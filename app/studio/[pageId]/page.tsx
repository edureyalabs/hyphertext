'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getSession,
  getPage,
  updatePage,
  deletePage,
  getMessages,
  sendMessage,
  listAssets,
  uploadAsset,
  deleteAsset,
  getPageVersions,
  syncPageCode,
  revertPageVersion,
  type Page,
  type ChatMessage,
  type PageAsset,
  type PageVersion,
} from '@/lib/api';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import loadingAnimationData from '@/public/loader.json';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type ViewMode = 'preview' | 'mobile' | 'code';
type ChatTab  = 'chat' | 'files';
type InferenceMode = 'economy' | 'speed';

const AGENT_TIMEOUT_MS = 90000;

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOC_BYTES   = 10 * 1024 * 1024;

function deriveAgentRunning(msgs: ChatMessage[]): boolean {
  return msgs.some(m => m.status === 'pending' || m.status === 'processing');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(asset: PageAsset): string {
  if (asset.asset_type === 'image') return 'X';
  if (asset.file_type === 'application/pdf') return 'P';
  return 'D';
}

function assetStatusColor(status: PageAsset['processing_status']): string {
  switch (status) {
    case 'ready':      return '#2a9d5c';
    case 'processing': return '#f59e0b';
    case 'failed':     return '#e05252';
    default:           return '#bbb';
  }
}

function assetStatusLabel(status: PageAsset['processing_status']): string {
  switch (status) {
    case 'ready':      return 'ready';
    case 'processing': return 'processing...';
    case 'failed':     return 'failed';
    default:           return 'pending';
  }
}

function triggerTypeLabel(t: string): string {
  switch (t) {
    case 'agent_complete': return 'AI edit';
    case 'manual_sync':    return 'Manual sync';
    case 'revert':         return 'Reverted';
    default:               return t;
  }
}

interface PendingUpload {
  id: string;
  file: File;
  progress: number;
  error?: string;
}

const supabaseRealtime = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StudioPage() {
  const params   = useParams();
  const router   = useRouter();
  const pageId   = params.pageId as string;

  const [page, setPage]                       = useState<Page | null>(null);
  const [messages, setMessages]               = useState<ChatMessage[]>([]);
  const [assets, setAssets]                   = useState<PageAsset[]>([]);
  const [pendingUploads, setPendingUploads]   = useState<PendingUpload[]>([]);
  const [stagedFiles, setStagedFiles]         = useState<File[]>([]);
  const [versions, setVersions]               = useState<PageVersion[]>([]);
  const [showVersions, setShowVersions]       = useState(false);
  const [revertingId, setRevertingId]         = useState<string | null>(null);

  const [input, setInput]                     = useState('');
  const [chatTab, setChatTab]                 = useState<ChatTab>('chat');
  const [viewMode, setViewMode]               = useState<ViewMode>('preview');
  const [isAgentRunning, setIsAgentRunning]   = useState(false);
  const [publishing, setPublishing]           = useState(false);
  const [publishCopied, setPublishCopied]     = useState(false);
  const [publishError, setPublishError]       = useState('');
  const [loading, setLoading]                 = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [awaitingClarification, setAwaitingClarification] = useState(false);
  const [hasEverSentMessage, setHasEverSentMessage]       = useState(false);
  const [isDragOver, setIsDragOver]           = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  // ── Inference mode state ─────────────────────────────────────────────────
  // Defaults to 'economy'. Once first message is sent, locked to the
  // persisted value from the page record (read via page.inference_mode).
  const [inferenceMode, setInferenceMode]     = useState<InferenceMode>('economy');
  // modeLocked = true once first message has been sent OR page already has a mode
  const [modeLocked, setModeLocked]           = useState(false);
  // Brief confirmation label shown after lock-in ("⚡ Speed locked" / "Economy locked")
  const [modeLockLabel, setModeLockLabel]     = useState('');

  // code editor state
  const [editedCode, setEditedCode]           = useState<string | null>(null);
  const [syncing, setSyncing]                 = useState(false);
  const [syncDone, setSyncDone]               = useState(false);
  const hasUnsyncedChanges = editedCode !== null && editedCode !== (page?.html_content ?? '');

  const chatBottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const agentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const htmlContentRef  = useRef<string>('');
  const iframeRef       = useRef<HTMLIFrameElement | null>(null);

  const writeToIframe = useCallback((html: string, iframe: HTMLIFrameElement | null) => {
    if (!iframe || !html) return;
    const doc = iframe.contentDocument;
    if (doc) { doc.open(); doc.write(html); doc.close(); }
  }, []);

  const iframeRefCallback = useCallback((iframe: HTMLIFrameElement | null) => {
    iframeRef.current = iframe;
    writeToIframe(htmlContentRef.current, iframe);
  }, [writeToIframe]);

  useEffect(() => {
    if (!page?.html_content) return;
    htmlContentRef.current = page.html_content;
    if (viewMode !== 'code') writeToIframe(page.html_content, iframeRef.current);
    if (editedCode === null) setEditedCode(page.html_content);
  }, [page?.html_content, viewMode, writeToIframe]);

  const clearAgentTimeout = useCallback(() => {
    if (agentTimeoutRef.current) { clearTimeout(agentTimeoutRef.current); agentTimeoutRef.current = null; }
  }, []);

  const startAgentTimeout = useCallback(() => {
    clearAgentTimeout();
    agentTimeoutRef.current = setTimeout(() => {
      setIsAgentRunning(false);
      agentTimeoutRef.current = null;
    }, AGENT_TIMEOUT_MS);
  }, [clearAgentTimeout]);

  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      if (!session) { router.replace('/auth'); return; }

      const pageData = await getPage(pageId);
      if (!pageData) { router.replace('/dashboard/projects'); return; }
      setPage(pageData);
      htmlContentRef.current = pageData.html_content;
      setEditedCode(pageData.html_content);

      // ── Restore persisted inference mode from DB ──────────────────────────
      const persistedMode = (pageData as any).inference_mode as InferenceMode | undefined;
      if (persistedMode === 'economy' || persistedMode === 'speed') {
        setInferenceMode(persistedMode);
      }

      const [msgList, assetList, versionList] = await Promise.all([
        getMessages(pageId),
        listAssets(pageId),
        getPageVersions(pageId),
      ]);
      setMessages(msgList);
      setAssets(assetList);
      setVersions(versionList);

      const hadPriorMessages = msgList.length > 0;
      if (hadPriorMessages) {
        setHasEverSentMessage(true);
        // Lock mode if this page already has messages (mode was already chosen)
        setModeLocked(true);
      }

      const agentCurrentlyRunning = deriveAgentRunning(msgList);
      setIsAgentRunning(agentCurrentlyRunning);
      if (agentCurrentlyRunning) startAgentTimeout();

      const lastMsg = msgList[msgList.length - 1];
      const hasPendingClarification =
        lastMsg?.message_type === 'clarification' &&
        lastMsg?.meta?.awaiting_clarification === true;
      setAwaitingClarification(hasPendingClarification);

      setLoading(false);
    };
    init();
    return () => clearAgentTimeout();
  }, [pageId, router, clearAgentTimeout, startAgentTimeout]);

  useEffect(() => {
    if (loading) return;

    const pageChannel = supabaseRealtime
      .channel(`page-${pageId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pages', filter: `id=eq.${pageId}` }, (payload) => {
        setPage(prev => prev ? { ...prev, ...(payload.new as Page) } : prev);
        if (editedCode === null || !hasUnsyncedChanges) {
          setEditedCode((payload.new as Page).html_content);
        }
      })
      .subscribe();

    const chatChannel = supabaseRealtime
      .channel(`chat-${pageId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `page_id=eq.${pageId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          if (newMsg.message_type === 'clarification' && newMsg.meta?.awaiting_clarification) {
            setAwaitingClarification(true);
          }
        }
        if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          if (updatedMsg.status === 'completed' || updatedMsg.status === 'error') {
            setIsAgentRunning(false);
            clearAgentTimeout();
            getPageVersions(pageId).then(setVersions);
          }
          if (updatedMsg.meta?.insufficient_tokens) {
            setIsAgentRunning(false);
            clearAgentTimeout();
          }
        }
      })
      .subscribe();

    const assetChannel = supabaseRealtime
      .channel(`assets-${pageId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'page_assets', filter: `page_id=eq.${pageId}` }, (payload) => {
        setAssets(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new as PageAsset } : a));
      })
      .subscribe();

    return () => {
      supabaseRealtime.removeChannel(pageChannel);
      supabaseRealtime.removeChannel(chatChannel);
      supabaseRealtime.removeChannel(assetChannel);
    };
  }, [pageId, loading, clearAgentTimeout, editedCode, hasUnsyncedChanges]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateAndStageFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" is not supported.`;
    const isImage = file.type.startsWith('image/');
    const max = isImage ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
    if (file.size > max) return `"${file.name}" exceeds the ${max / (1024 * 1024)} MB limit.`;
    return null;
  };

  const stageFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of arr) {
      const err = validateAndStageFile(f);
      if (err) errors.push(err);
      else valid.push(f);
    }
    if (errors.length) alert(errors.join('\n'));
    if (valid.length) setStagedFiles(prev => [...prev, ...valid]);
  };

  const removeStagedFile = (index: number) => setStagedFiles(prev => prev.filter((_, i) => i !== index));
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop      = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files.length) stageFiles(e.dataTransfer.files); };

  const handleSendMessage = async () => {
    if (!input.trim() || isAgentRunning) return;
    const text = input.trim();

    // ── Lock mode on first send ───────────────────────────────────────────
    const isFirstMessage = !hasEverSentMessage;
    if (isFirstMessage && !modeLocked) {
      setModeLocked(true);
      const label = inferenceMode === 'speed' ? '⚡ Speed locked' : 'Economy locked';
      setModeLockLabel(label);
      setTimeout(() => setModeLockLabel(''), 3000);
    }

    setInput('');
    setIsAgentRunning(true);
    setHasEverSentMessage(true);
    startAgentTimeout();
    if (awaitingClarification) setAwaitingClarification(false);

    if (stagedFiles.length > 0) {
      const filesToUpload = [...stagedFiles];
      setStagedFiles([]);
      const tempUploads: PendingUpload[] = filesToUpload.map(f => ({ id: `${Date.now()}-${f.name}`, file: f, progress: 0 }));
      setPendingUploads(prev => [...prev, ...tempUploads]);
      await Promise.all(
        filesToUpload.map((file, i) =>
          uploadAsset(pageId, file, (pct) => {
            setPendingUploads(prev => prev.map(u => u.id === tempUploads[i].id ? { ...u, progress: pct } : u));
          }).then(result => {
            if (result.error) setPendingUploads(prev => prev.map(u => u.id === tempUploads[i].id ? { ...u, error: result.error! } : u));
            else if (result.asset) { setAssets(prev => [...prev, result.asset!]); setPendingUploads(prev => prev.filter(u => u.id !== tempUploads[i].id)); }
          })
        )
      );
    }

    // Pass inference_mode only on first message — backend ignores it after that
    const { error } = await sendMessage(
      pageId,
      text,
      isFirstMessage ? inferenceMode : undefined,
    );
    if (error) { setIsAgentRunning(false); clearAgentTimeout(); }
  };

  const handleSyncCode = async () => {
    if (!editedCode || !hasUnsyncedChanges) return;
    setSyncing(true);
    const { page: updated, error } = await syncPageCode(pageId, editedCode);
    setSyncing(false);
    if (error) { alert('Sync failed: ' + error); return; }
    if (updated) {
      setPage(updated);
      htmlContentRef.current = editedCode;
      writeToIframe(editedCode, iframeRef.current);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
      getPageVersions(pageId).then(setVersions);
    }
  };

  const handleRevertVersion = async (versionId: string) => {
    setRevertingId(versionId);
    const { page: updated, error } = await revertPageVersion(pageId, versionId);
    setRevertingId(null);
    if (error) { alert('Revert failed: ' + error); return; }
    if (updated) {
      setPage(updated);
      setEditedCode(updated.html_content);
      htmlContentRef.current = updated.html_content;
      writeToIframe(updated.html_content, iframeRef.current);
      getPageVersions(pageId).then(setVersions);
      setShowVersions(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    setDeletingAssetId(assetId);
    const { error } = await deleteAsset(pageId, assetId);
    if (!error) setAssets(prev => prev.filter(a => a.id !== assetId));
    setDeletingAssetId(null);
  };

  const handlePublish = async () => {
    if (!page) return;
    setPublishing(true);
    setPublishError('');
    const newState = !page.is_published;
    const { page: updated, error, code, site_limit, tier } = await updatePage(pageId, { is_published: newState });
    if (error) {
      setPublishing(false);
      if (code === 'hosting_limit_reached') {
        setPublishError(`Hosting limit reached (${site_limit} site${site_limit === 1 ? '' : 's'} on ${tier} plan). Upgrade your plan to publish more sites.`);
      } else {
        setPublishError(error);
      }
      return;
    }
    if (updated) {
      setPage(prev => prev ? { ...prev, is_published: newState } : prev);
      if (newState) {
        const link = `${window.location.origin}/p/${pageId}`;
        await navigator.clipboard.writeText(link);
        setPublishCopied(true);
        setTimeout(() => setPublishCopied(false), 3000);
      }
    }
    setPublishing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deletePage(pageId);
    if (error) { setDeleting(false); setShowDeleteModal(false); return; }
    router.replace('/dashboard/projects');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const toggleThinking = (msgId: string) =>
    setExpandedThinking(prev => ({ ...prev, [msgId]: !prev[msgId] }));

  const renderThinkingBlock = (msg: ChatMessage) => {
    const plan = msg.meta?.plan as Record<string, any> ?? {};
    const isExpanded = expandedThinking[msg.id];
    return (
      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <button
          onClick={() => toggleThinking(msg.id)}
          style={{ background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#aaa' }}
        >
          <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{isExpanded ? 'v' : '>'}</span>
          thinking
          {plan._inference_mode === 'speed' && (
            <span style={{ marginLeft: '0.2rem', fontSize: '0.6rem' }}>⚡</span>
          )}
        </button>
        {isExpanded && (
          <div style={{ marginTop: '0.4rem', background: '#fafaf9', border: '1px solid #e8e6e1', borderRadius: '6px', padding: '0.75rem', maxWidth: '300px', width: '100%' }}>
            {plan.description && (
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#333', fontWeight: 400, lineHeight: 1.5 }}>
                {plan.description}
              </p>
            )}
            {plan.changes && plan.changes.length > 0 && (
              <div>
                <p style={{ margin: '0 0 0.3rem', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', textTransform: 'uppercase' }}>changes</p>
                {plan.changes.map((c: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', flexShrink: 0 }}>{c.order}.</span>
                    <span style={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.4 }}>{c.what}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMessage = (msg: ChatMessage) => {
    if (msg.message_type === 'thinking') return renderThinkingBlock(msg);
    if (msg.message_type === 'clarification') {
      return (
        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="chat-msg assistant-msg" style={{ borderLeft: '2px solid #f59e0b' }}>
            <p style={{ margin: '0 0 0.3rem', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#f59e0b', textTransform: 'uppercase' }}>needs clarification</p>
            {msg.content}
          </div>
        </div>
      );
    }
    if (msg.meta?.insufficient_tokens) {
      return (
        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="chat-msg assistant-msg" style={{ borderLeft: '2px solid #e05252' }}>
            <p style={{ margin: '0 0 0.3rem', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#e05252', textTransform: 'uppercase' }}>out of tokens</p>
            {msg.content}
            <button
              onClick={() => router.push('/account?tab=purchase')}
              style={{ marginTop: '0.5rem', background: '#111', color: '#f8f7f4', border: 'none', borderRadius: '4px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              Purchase tokens
            </button>
          </div>
        </div>
      );
    }
    return (
      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
        <div className={`chat-msg ${msg.role === 'user' ? 'user-msg' : 'assistant-msg'}`}>{msg.content}</div>
      </div>
    );
  };

  const renderAssetRow = (asset: PageAsset) => (
    <div key={asset.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.6rem', background: '#fafaf9', border: '1px solid #e8e6e1', borderRadius: '6px' }}>
      <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontFamily: "'DM Mono', monospace", color: '#bbb' }}>
        {asset.asset_type === 'image' && asset.public_url
          ? <img src={asset.public_url} alt={asset.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : fileIcon(asset)
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {asset.original_file_name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: assetStatusColor(asset.processing_status), flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#aaa' }}>{assetStatusLabel(asset.processing_status)}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#ccc' }}>- {formatBytes(asset.file_size_bytes)}</span>
        </div>
        {asset.processing_status === 'ready' && asset.vision_description && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.68rem', color: '#888', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {asset.vision_description}
          </p>
        )}
        {asset.processing_status === 'ready' && asset.extracted_summary && !asset.vision_description && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.68rem', color: '#888', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {asset.extracted_summary}
          </p>
        )}
      </div>
      <button
        onClick={() => handleDeleteAsset(asset.id)}
        disabled={deletingAssetId === asset.id}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: '2px', flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e05252')}
        onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
      >
        {deletingAssetId === asset.id
          ? <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem' }}>...</span>
          : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        }
      </button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const publishUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${pageId}`;
  const readyAssets = assets.filter(a => a.processing_status === 'ready');
  const isLive = page?.is_published && page?.hosting_status === 'active';
  const isSuspended = page?.is_published && page?.hosting_status === 'suspended';

  return (
    <div
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", overflow: 'hidden' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }

        .tab-btn { background: transparent; border: none; padding: 0.35rem 0.75rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; font-weight: 400; color: #999; cursor: pointer; border-radius: 3px; transition: background 0.12s, color 0.12s; }
        .tab-btn:hover { background: #f0ede8; color: #111; }
        .tab-btn.active { background: #111; color: #f8f7f4; }

        .chat-tab-btn { background: transparent; border: none; padding: 0.3rem 0.7rem; font-size: 0.72rem; font-family: 'DM Mono', monospace; color: #bbb; cursor: pointer; border-bottom: 2px solid transparent; transition: color 0.12s, border-color 0.12s; }
        .chat-tab-btn:hover { color: #555; }
        .chat-tab-btn.active { color: #111; border-bottom-color: #111; }

        .send-btn { background: #111; color: #f8f7f4; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.12s; }
        .send-btn:hover { background: #333; }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .attach-btn { background: transparent; border: none; color: #bbb; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 4px; transition: color 0.12s, background 0.12s; flex-shrink: 0; }
        .attach-btn:hover { color: #555; background: #f0ede8; }
        .attach-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .publish-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: transparent; border: 1px solid #ddd; padding: 0.38rem 0.85rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; font-weight: 400; color: #555; cursor: pointer; border-radius: 3px; transition: all 0.15s; }
        .publish-btn:hover { border-color: #999; color: #111; }
        .publish-btn.live { border-color: #2a9d5c; color: #2a9d5c; background: rgba(42,157,92,0.06); }
        .publish-btn.suspended { border-color: #f59e0b; color: #92400e; background: rgba(245,158,11,0.06); }
        .publish-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .delete-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: transparent; border: 1px solid #ddd; padding: 0.38rem 0.75rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; font-weight: 400; color: #bbb; cursor: pointer; border-radius: 3px; transition: all 0.15s; }
        .delete-btn:hover { border-color: #e57373; color: #e57373; }

        .sync-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: #0047AB; color: #fff; border: none; padding: 0.38rem 0.85rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; cursor: pointer; border-radius: 3px; transition: background 0.15s; }
        .sync-btn:hover { background: #003a8c; }
        .sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sync-btn.done { background: #2a9d5c; }

        .versions-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: transparent; border: 1px solid #ddd; padding: 0.38rem 0.65rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; color: #888; cursor: pointer; border-radius: 3px; transition: all 0.15s; }
        .versions-btn:hover { border-color: #bbb; color: #111; background: #f8f7f4; }

        .chat-msg { animation: fadeUp 0.2s ease both; max-width: 90%; line-height: 1.55; }
        .user-msg { background: #111; color: #f8f7f4; border-radius: 12px 12px 3px 12px; padding: 0.65rem 0.9rem; font-size: 0.82rem; font-weight: 300; }
        .assistant-msg { background: #fff; color: #111; border: 1px solid #e8e6e1; border-radius: 3px 12px 12px 12px; padding: 0.65rem 0.9rem; font-size: 0.82rem; font-weight: 300; }

        .chat-input { flex: 1; border: none; outline: none; resize: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 300; color: #111; line-height: 1.5; min-height: 20px; max-height: 120px; overflow-y: auto; }
        .chat-input::placeholder { color: #bbb; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .modal { background: #fff; border: 1px solid #e8e6e1; border-radius: 8px; padding: 2rem; width: 100%; max-width: 380px; animation: modalIn 0.2s ease both; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }

        .staged-file-chip { display: flex; align-items: center; gap: 0.3rem; background: #f0ede8; border: 1px solid #e0ddd8; border-radius: 4px; padding: 0.2rem 0.5rem; font-size: 0.72rem; color: #555; max-width: 120px; }
        .staged-file-chip span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }

        .versions-panel { position: absolute; top: 42px; right: 0; width: 260px; background: #fff; border: 1px solid #e8e6e1; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); z-index: 100; overflow: hidden; animation: fadeUp 0.15s ease both; }

        /* ── Inference mode toggle ───────────────────────────────────────── */
        .mode-toggle-wrap { display: flex; align-items: center; gap: 0.5rem; }
        .mode-toggle { display: flex; background: #f0ede8; border: 1px solid #e8e6e1; border-radius: 100px; padding: 2px; gap: 2px; }
        .mode-btn {
          border: none; background: transparent; border-radius: 100px;
          padding: 0.22rem 0.65rem; font-size: 0.68rem;
          font-family: 'DM Mono', monospace; cursor: pointer;
          transition: background 0.15s, color 0.15s;
          color: #aaa; display: flex; align-items: center; gap: 0.25rem;
          white-space: nowrap;
        }
        .mode-btn:hover:not(:disabled) { color: #555; }
        .mode-btn.active.economy { background: #fff; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .mode-btn.active.speed   { background: #111; color: #f8f7f4; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .mode-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .mode-lock-label { font-family: 'DM Mono', monospace; font-size: 0.62rem; color: #aaa; animation: fadeIn 0.2s ease both; white-space: nowrap; }
      `}</style>

      {isDragOver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,71,171,0.08)', border: '2px dashed #0047AB', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem 2.5rem', textAlign: 'center', border: '1px solid #0047AB' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: '#0047AB', margin: 0 }}>drop files to attach</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { if (e.target.files) stageFiles(e.target.files); e.target.value = ''; }} />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{ height: '48px', background: '#fff', borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', flexShrink: 0, gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <Link href="/dashboard/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Hyphertext" width={22} height={22} style={{ borderRadius: '50%' }} />
          </Link>
          <span style={{ color: '#ddd', fontSize: '0.75rem' }}>/</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{page?.title}</span>
          {isAgentRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '100px', padding: '0.2rem 0.6rem' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#888' }}>generating</span>
              {inferenceMode === 'speed' && <span style={{ fontSize: '0.65rem' }}>⚡</span>}
            </div>
          )}
          {isSuspended && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '100px', padding: '0.2rem 0.6rem' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#92400e' }}>hosting suspended</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.2rem', background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '5px', padding: '0.2rem' }}>
          {(['preview', 'mobile', 'code'] as ViewMode[]).map(mode => (
            <button key={mode} className={`tab-btn${viewMode === mode ? ' active' : ''}`} onClick={() => setViewMode(mode)}>
              {mode === 'preview' ? 'desktop' : mode}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {viewMode === 'code' && hasUnsyncedChanges && (
            <button className={`sync-btn${syncDone ? ' done' : ''}`} onClick={handleSyncCode} disabled={syncing}>
              {syncing ? 'Saving...' : syncDone ? 'Saved' : 'Sync code'}
            </button>
          )}
          {isLive && (
            <a href={publishUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#2a9d5c', textDecoration: 'none', borderBottom: '1px solid currentColor', lineHeight: 1 }}>
              {publishUrl.replace('https://', '')}
            </a>
          )}
          <button className="versions-btn" onClick={() => { setShowVersions(v => !v); if (!showVersions) getPageVersions(pageId).then(setVersions); }} title="Version history">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 3.5H13M5.5 3.5V2.5C5.5 2 5.5 1.5 6.5 1.5H7.5C8.5 1.5 8.5 2 8.5 2.5V3.5M6 6V10.5M8 6V10.5M2.5 3.5L3 11.5C3 12 3.5 12.5 4 12.5H10C10.5 12.5 11 12 11 11.5L11.5 3.5H2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
          <button
            className={`publish-btn${isLive ? ' live' : isSuspended ? ' suspended' : ''}`}
            onClick={isSuspended ? () => router.push('/account?tab=hosting') : handlePublish}
            disabled={publishing}
          >
            {isSuspended ? 'Upgrade plan' : isLive ? (publishCopied ? 'link copied!' : 'live') : 'Publish'}
          </button>
        </div>
      </nav>

      {publishError && (
        <div style={{ background: '#fff5f5', borderBottom: '1px solid #fecaca', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#c53030', fontWeight: 300 }}>{publishError}</span>
          <button onClick={() => router.push('/account?tab=hosting')} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.25rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
            Upgrade plan
          </button>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Preview / Code pane ──────────────────────────────────────────── */}
        <div style={{ flex: '0 0 72%', borderRight: '1px solid #e8e6e1', background: viewMode === 'code' ? '#1e1e1e' : '#e8e6e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {viewMode === 'preview' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
              <iframe ref={iframeRefCallback} style={{ flex: 1, border: 'none', display: 'block', background: '#fff' }} title="Page preview" sandbox="allow-scripts allow-same-origin" />
            </div>
          )}
          {viewMode === 'mobile' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#e0ddd8' }}>
              <div style={{ width: '375px', height: '812px', maxHeight: '90%', background: '#fff', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.1)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '28px', background: '#111', borderRadius: '0 0 20px 20px', zIndex: 10 }} />
                <iframe style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} srcDoc={page?.html_content || ''} title="Mobile preview" sandbox="allow-scripts allow-same-origin" />
              </div>
            </div>
          )}
          {viewMode === 'code' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {hasUnsyncedChanges && (
                <div style={{ background: '#1a1a2e', borderBottom: '1px solid #2d2d4e', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#6b7280' }}>unsaved changes</span>
                  <button className={`sync-btn${syncDone ? ' done' : ''}`} onClick={handleSyncCode} disabled={syncing} style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}>
                    {syncing ? 'Saving...' : syncDone ? 'Saved' : 'Sync & save'}
                  </button>
                </div>
              )}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <MonacoEditor
                  height="100%"
                  language="html"
                  theme="vs-dark"
                  value={editedCode ?? page?.html_content ?? ''}
                  onChange={(val) => setEditedCode(val ?? '')}
                  options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', wordWrap: 'on', scrollBeyondLastLine: false, fontFamily: "'DM Mono', 'Fira Code', monospace", padding: { top: 16, bottom: 16 } }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Chat pane ────────────────────────────────────────────────────── */}
        <div style={{ flex: '0 0 28%', minWidth: '300px', maxWidth: '480px', display: 'flex', flexDirection: 'column', background: '#fff', position: 'relative' }}>
          <div style={{ padding: '0 1rem', borderBottom: '1px solid #f0ede8', flexShrink: 0, display: 'flex', alignItems: 'center', height: '42px' }}>
            <button className={`chat-tab-btn${chatTab === 'chat' ? ' active' : ''}`} onClick={() => setChatTab('chat')}>chat</button>
            <button className={`chat-tab-btn${chatTab === 'files' ? ' active' : ''}`} onClick={() => setChatTab('files')} style={{ position: 'relative' }}>
              files
              {assets.length > 0 && (
                <span style={{ marginLeft: '0.3rem', background: chatTab === 'files' ? '#111' : '#e8e6e1', color: chatTab === 'files' ? '#fff' : '#888', borderRadius: '100px', padding: '0 0.35rem', fontSize: '0.58rem', fontFamily: "'DM Mono', monospace", lineHeight: '1.4', display: 'inline-block' }}>
                  {assets.length}
                </span>
              )}
            </button>

            {/* ── Mode badge (shown when locked) ──────────────────────────── */}
            {modeLocked && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: '0.62rem',
                  padding: '0.15rem 0.5rem', borderRadius: '100px',
                  background: inferenceMode === 'speed' ? '#111' : '#f0ede8',
                  color: inferenceMode === 'speed' ? '#f8f7f4' : '#888',
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                }}>
                  {inferenceMode === 'speed' ? '⚡ speed' : 'economy'}
                </span>
              </div>
            )}
          </div>

          {/* ── Version history panel ──────────────────────────────────────── */}
          {showVersions && (
            <div className="versions-panel">
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>version history</p>
                <button onClick={() => setShowVersions(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {versions.length === 0 ? (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#ccc', textAlign: 'center', padding: '1.5rem' }}>no versions yet</p>
                ) : versions.map((v, i) => (
                  <div key={v.id} style={{ padding: '0.6rem 1rem', borderBottom: i < versions.length - 1 ? '1px solid #f8f7f4' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#333', fontWeight: 400 }}>v{v.version_num} — {triggerTypeLabel(v.trigger_type)}</p>
                      <p style={{ margin: '0.1rem 0 0', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb' }}>
                        {new Date(v.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(v.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {i > 0 && (
                      <button
                        onClick={() => handleRevertVersion(v.id)}
                        disabled={revertingId === v.id}
                        style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '3px', padding: '0.2rem 0.5rem', fontSize: '0.68rem', color: '#666', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0, transition: 'border-color 0.12s, color 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#666'; }}
                      >
                        {revertingId === v.id ? '...' : 'Restore'}
                      </button>
                    )}
                    {i === 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#2a9d5c' }}>current</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Chat tab ──────────────────────────────────────────────────── */}
          {chatTab === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#ccc', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>*</span>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}>
                      {page?.page_source === 'import' ? 'page imported — describe what to change' : 'describe your page'}
                    </p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#ddd', maxWidth: '180px', lineHeight: 1.5 }}>attach images or docs with the paperclip button</p>
                  </div>
                )}
                {messages.map(msg => renderMessage(msg))}
                {hasEverSentMessage && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '0.25rem' }}>
                    {isAgentRunning
                      ? <Lottie animationData={loadingAnimationData} loop={true} style={{ width: '72px', height: '72px' }} />
                      : <Image src="/loader.png" alt="idle" width={24} height={24} style={{ objectFit: 'contain' }} />
                    }
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              <div style={{ padding: '0.75rem', borderTop: '1px solid #f0ede8', flexShrink: 0 }}>
                {awaitingClarification && (
                  <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#f59e0b' }}>answering clarification</span>
                  </div>
                )}
                {stagedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    {stagedFiles.map((f, i) => (
                      <div key={i} className="staged-file-chip">
                        <span style={{ fontSize: '0.75rem' }}>{f.type.startsWith('image/') ? 'img' : 'doc'}</span>
                        <span>{f.name}</span>
                        <button onClick={() => removeStagedFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0 }}>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {pendingUploads.length > 0 && (
                  <div style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {pendingUploads.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.file.name}</span>
                        {u.error
                          ? <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#e05252' }}>failed</span>
                          : <div style={{ width: '60px', height: '3px', background: '#e8e6e1', borderRadius: '2px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${u.progress}%`, background: '#0047AB', transition: 'width 0.2s' }} /></div>
                        }
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Inference mode toggle (shown only before first send) ── */}
                {!modeLocked && (
                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="mode-toggle-wrap">
                      <div className="mode-toggle">
                        <button
                          className={`mode-btn${inferenceMode === 'economy' ? ' active economy' : ''}`}
                          onClick={() => setInferenceMode('economy')}
                          title="Economy: Together AI — lower cost"
                        >
                          Economy
                        </button>
                        <button
                          className={`mode-btn${inferenceMode === 'speed' ? ' active speed' : ''}`}
                          onClick={() => setInferenceMode('speed')}
                          title="Speed: Cerebras — ~1000 tokens/sec"
                        >
                          ⚡ Speed
                        </button>
                      </div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#ccc' }}>
                        {inferenceMode === 'speed' ? 'cerebras · ~1000 t/s' : 'together ai · default'}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Lock-in confirmation label ────────────────────────── */}
                {modeLockLabel && (
                  <div style={{ marginBottom: '0.4rem' }}>
                    <span className="mode-lock-label">{modeLockLabel}</span>
                  </div>
                )}

                <div style={{ background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '8px', padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea
                    ref={textareaRef}
                    className="chat-input"
                    placeholder={isAgentRunning ? 'generating...' : awaitingClarification ? 'type your answer...' : 'describe a change...'}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    disabled={isAgentRunning}
                    rows={1}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button className="attach-btn" onClick={() => fileInputRef.current?.click()} disabled={isAgentRunning}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 7.5L7.5 13.5C6.1 14.9 3.9 14.9 2.5 13.5C1.1 12.1 1.1 9.9 2.5 8.5L9 2C9.9 1.1 11.4 1.1 12.3 2C13.2 2.9 13.2 4.4 12.3 5.3L6.3 11.3C5.9 11.7 5.2 11.7 4.8 11.3C4.4 10.9 4.4 10.2 4.8 9.8L10 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="send-btn" onClick={handleSendMessage} disabled={!input.trim() || isAgentRunning}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 13L13 7L1 1V5.5L9 7L1 8.5V13Z" fill="currentColor"/></svg>
                    </button>
                  </div>
                </div>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#ddd', marginTop: '0.4rem', textAlign: 'center' }}>
                  enter to send · shift+enter for newline
                </p>
              </div>
            </>
          )}

          {/* ── Files tab ─────────────────────────────────────────────────── */}
          {chatTab === 'files' && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {assets.length === 0 && pendingUploads.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#ccc', gap: '0.75rem', padding: '2rem', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  <div style={{ width: '40px', height: '40px', border: '1.5px dashed #ddd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 7.5L7.5 13.5C6.1 14.9 3.9 14.9 2.5 13.5C1.1 12.1 1.1 9.9 2.5 8.5L9 2C9.9 1.1 11.4 1.1 12.3 2C13.2 2.9 13.2 4.4 12.3 5.3L6.3 11.3C5.9 11.7 5.2 11.7 4.8 11.3C4.4 10.9 4.4 10.2 4.8 9.8L10 4.5" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', marginBottom: '0.25rem' }}>no files yet</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#ddd', lineHeight: 1.5 }}>click to attach or drag and drop</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {assets.length} file{assets.length !== 1 ? 's' : ''} · {readyAssets.length} ready
                    </span>
                    <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '3px', padding: '0.25rem 0.6rem', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#888', cursor: 'pointer' }}>
                      + add
                    </button>
                  </div>
                  {pendingUploads.map(u => (
                    <div key={u.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', padding: '0.6rem', background: '#fafaf9', border: '1px solid #e8e6e1', borderRadius: '6px' }}>
                      <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '4px', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb' }}>
                        {u.file.type.startsWith('image/') ? 'img' : 'doc'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.file.name}</p>
                        {u.error
                          ? <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#e05252' }}>upload failed</span>
                          : <div style={{ width: '100%', height: '3px', background: '#e8e6e1', borderRadius: '2px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${u.progress}%`, background: '#0047AB', transition: 'width 0.2s' }} /></div>
                        }
                      </div>
                    </div>
                  ))}
                  {assets.map(asset => renderAssetRow(asset))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Delete modal ─────────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div className="modal">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#e57373', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>delete page</p>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#111', margin: '0 0 0.5rem' }}>Delete "{page?.title}"?</h2>
            <p style={{ fontSize: '0.83rem', color: '#999', fontWeight: 300, margin: '0 0 1.5rem', lineHeight: 1.6 }}>This will permanently delete the page, all chat history, and all uploaded files. Cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} style={{ background: 'transparent', border: '1px solid #ddd', color: '#777', padding: '0.55rem 1rem', borderRadius: '3px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ background: '#c0392b', border: 'none', color: '#fff', padding: '0.55rem 1.1rem', borderRadius: '3px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{deleting ? 'Deleting...' : 'Yes, delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}