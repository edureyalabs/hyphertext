// app/studio/[pageId]/page.tsx
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
import StudioNav     from './StudioNav';
import PreviewPane   from './PreviewPane';
import ChatPanel     from './ChatPanel';
import VersionsPanel from './VersionsPanel';

type ViewMode = 'preview' | 'mobile' | 'code';

const AGENT_SLOW_MS = 90_000;

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_IMAGE_BYTES = 5  * 1024 * 1024;
const MAX_DOC_BYTES   = 10 * 1024 * 1024;

function deriveAgentRunning(msgs: ChatMessage[]): boolean {
  return msgs.some(m => m.status === 'pending' || m.status === 'processing');
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
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const [page, setPage]           = useState<Page | null>(null);
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [assets, setAssets]       = useState<PageAsset[]>([]);
  const [versions, setVersions]   = useState<PageVersion[]>([]);
  const [loading, setLoading]     = useState(true);

  // Agent status — driven by polling + realtime
  const [agentStatus, setAgentStatus] = useState<string | null>(null);

  const [pendingUploads, setPendingUploads]   = useState<PendingUpload[]>([]);
  const [stagedFiles, setStagedFiles]         = useState<File[]>([]);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const [showVersions, setShowVersions] = useState(false);
  const [revertingId, setRevertingId]   = useState<string | null>(null);

  const [input, setInput]                                 = useState('');
  const [isAgentRunning, setIsAgentRunning]               = useState(false);
  const [agentSlowWarning, setAgentSlowWarning]           = useState(false);
  const [awaitingClarification, setAwaitingClarification] = useState(false);
  const [hasEverSentMessage, setHasEverSentMessage]       = useState(false);
  const [expandedThinking, setExpandedThinking]           = useState<Record<string, boolean>>({});

  const [viewMode, setViewMode]     = useState<ViewMode>('preview');
  const [editedCode, setEditedCode] = useState<string | null>(null);
  const [syncing, setSyncing]       = useState(false);
  const [syncDone, setSyncDone]     = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting]               = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const slowTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentRunningRef = useRef(false);

  const hasUnsyncedChanges = editedCode !== null && editedCode !== (page?.html_content ?? '');

  // ── Slow-warning timer ───────────────────────────────────────────────────
  const startSlowTimer = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    setAgentSlowWarning(false);
    slowTimerRef.current = setTimeout(() => {
      if (agentRunningRef.current) setAgentSlowWarning(true);
    }, AGENT_SLOW_MS);
  }, []);

  const clearSlowTimer = useCallback(() => {
    if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null; }
    setAgentSlowWarning(false);
  }, []);

  const setAgentRunning = useCallback((running: boolean) => {
    agentRunningRef.current = running;
    setIsAgentRunning(running);
    if (!running) {
      clearSlowTimer();
      setAgentStatus(null); // clear status when done
    }
  }, [clearSlowTimer]);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      if (!session) { router.replace('/auth'); return; }

      const pageData = await getPage(pageId);
      if (!pageData) { router.replace('/dashboard/projects'); return; }
      setPage(pageData);
      setEditedCode(pageData.html_content);

      // Restore persisted agent status from DB (survives refresh)
      if ((pageData as any).agent_status) {
        setAgentStatus((pageData as any).agent_status);
      }

      const [msgList, assetList, versionList] = await Promise.all([
        getMessages(pageId),
        listAssets(pageId),
        getPageVersions(pageId),
      ]);
      setMessages(msgList);
      setAssets(assetList);
      setVersions(versionList);

      if (msgList.length > 0) setHasEverSentMessage(true);

      const running = deriveAgentRunning(msgList);
      setAgentRunning(running);
      if (running) startSlowTimer();

      const lastMsg = msgList[msgList.length - 1];
      if (lastMsg?.message_type === 'clarification' && lastMsg?.meta?.awaiting_clarification) {
        setAwaitingClarification(true);
      }

      setLoading(false);
    };
    init();
    return () => clearSlowTimer();
  }, [pageId, router, setAgentRunning, startSlowTimer, clearSlowTimer]);

  // ── Poll agent_status while agent is running ──────────────────────────────
  // Polling is the reliable fallback since realtime column tracking can be flaky.
  useEffect(() => {
    if (!isAgentRunning) return;

    const interval = setInterval(async () => {
      try {
        const pageData = await getPage(pageId);
        if (pageData) {
          setAgentStatus((pageData as any).agent_status ?? null);
        }
      } catch {
        // silently ignore poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAgentRunning, pageId]);

  // ── Realtime subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const pageChannel = supabaseRealtime
      .channel(`page-${pageId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pages'
      }, (payload) => {
        const updatedPage = payload.new as any;
        if (updatedPage.id !== pageId) return;

        setPage(prev => prev ? { ...prev, ...updatedPage } : prev);
        setAgentStatus(updatedPage.agent_status ?? null);
        if (!hasUnsyncedChanges) setEditedCode(updatedPage.html_content);
      })
      .subscribe();

    const chatChannel = supabaseRealtime
      .channel(`chat-${pageId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'chat_messages', filter: `page_id=eq.${pageId}`
      }, (payload) => {
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
            setAgentRunning(false);
            getPageVersions(pageId).then(setVersions);
          }
          if (updatedMsg.meta?.insufficient_tokens) {
            setAgentRunning(false);
          }
        }
      })
      .subscribe();

    const assetChannel = supabaseRealtime
      .channel(`assets-${pageId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'page_assets', filter: `page_id=eq.${pageId}`
      }, (payload) => {
        setAssets(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new as PageAsset } : a));
      })
      .subscribe();

    return () => {
      supabaseRealtime.removeChannel(pageChannel);
      supabaseRealtime.removeChannel(chatChannel);
      supabaseRealtime.removeChannel(assetChannel);
    };
  }, [pageId, loading, setAgentRunning, hasUnsyncedChanges]);

  // ── File handling ────────────────────────────────────────────────────────
  const validateAndStageFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" is not supported.`;
    const isImage = file.type.startsWith('image/');
    if (file.size > (isImage ? MAX_IMAGE_BYTES : MAX_DOC_BYTES)) return `"${file.name}" is too large.`;
    return null;
  };

  const stageFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of arr) {
      const err = validateAndStageFile(f);
      if (err) errors.push(err); else valid.push(f);
    }
    if (errors.length) alert(errors.join('\n'));
    if (valid.length) setStagedFiles(prev => [...prev, ...valid]);
  };

  const removeStagedFile = (index: number) => setStagedFiles(prev => prev.filter((_, i) => i !== index));
  const handleDragOver   = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave  = () => setIsDragOver(false);
  const handleDrop       = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) stageFiles(e.dataTransfer.files);
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!input.trim() || isAgentRunning) return;
    const text = input.trim();

    setInput('');
    setAgentRunning(true);
    setAgentStatus('planning'); // optimistic — shows immediately before first DB update
    startSlowTimer();
    setHasEverSentMessage(true);
    if (awaitingClarification) setAwaitingClarification(false);

    if (stagedFiles.length > 0) {
      const filesToUpload = [...stagedFiles];
      setStagedFiles([]);
      const tempUploads: PendingUpload[] = filesToUpload.map(f => ({
        id: `${Date.now()}-${f.name}`, file: f, progress: 0
      }));
      setPendingUploads(prev => [...prev, ...tempUploads]);
      await Promise.all(
        filesToUpload.map((file, i) =>
          uploadAsset(pageId, file, (pct) => {
            setPendingUploads(prev => prev.map(u =>
              u.id === tempUploads[i].id ? { ...u, progress: pct } : u
            ));
          }).then(result => {
            if (result.error) {
              setPendingUploads(prev => prev.map(u =>
                u.id === tempUploads[i].id ? { ...u, error: result.error! } : u
              ));
            } else if (result.asset) {
              setAssets(prev => [...prev, result.asset!]);
              setPendingUploads(prev => prev.filter(u => u.id !== tempUploads[i].id));
            }
          })
        )
      );
    }

    const { error } = await sendMessage(pageId, text);
    if (error) setAgentRunning(false);
  };

  // ── Code sync ────────────────────────────────────────────────────────────
  const handleSyncCode = async () => {
    if (!editedCode || !hasUnsyncedChanges) return;
    setSyncing(true);
    const { page: updated, error } = await syncPageCode(pageId, editedCode);
    setSyncing(false);
    if (error) { alert('Sync failed: ' + error); return; }
    if (updated) {
      setPage(updated);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
      getPageVersions(pageId).then(setVersions);
    }
  };

  // ── Version revert ───────────────────────────────────────────────────────
  const handleRevertVersion = async (versionId: string) => {
    setRevertingId(versionId);
    const { page: updated, error } = await revertPageVersion(pageId, versionId);
    setRevertingId(null);
    if (error) { alert('Revert failed: ' + error); return; }
    if (updated) {
      setPage(updated);
      setEditedCode(updated.html_content);
      getPageVersions(pageId).then(setVersions);
      setShowVersions(false);
    }
  };

  // ── Asset delete ─────────────────────────────────────────────────────────
  const handleDeleteAsset = async (assetId: string) => {
    setDeletingAssetId(assetId);
    const { error } = await deleteAsset(pageId, assetId);
    if (!error) setAssets(prev => prev.filter(a => a.id !== assetId));
    setDeletingAssetId(null);
  };

  // ── Page delete ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deletePage(pageId);
    if (error) { setDeleting(false); setShowDeleteModal(false); return; }
    router.replace('/dashboard/projects');
  };

  // ── Versions toggle ──────────────────────────────────────────────────────
  const handleToggleVersions = () => {
    setShowVersions(v => !v);
    if (!showVersions) getPageVersions(pageId).then(setVersions);
  };

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
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
      `}</style>

      {/* Drag overlay */}
      {isDragOver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,71,171,0.08)', border: '2px dashed #0047AB', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem 2.5rem', textAlign: 'center', border: '1px solid #0047AB' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: '#0047AB', margin: 0 }}>drop files to attach</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files) stageFiles(e.target.files); e.target.value = ''; }}
      />

      {/* Nav */}
      <StudioNav
        page={page!}
        pageId={pageId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isAgentRunning={isAgentRunning}
        agentStatus={agentStatus}
        hasUnsyncedChanges={hasUnsyncedChanges}
        syncing={syncing}
        syncDone={syncDone}
        onSyncCode={handleSyncCode}
        onDeleteClick={() => setShowDeleteModal(true)}
        onPageUpdate={(updated) => setPage(prev => prev ? { ...prev, ...updated } : prev)}
        showVersions={showVersions}
        onToggleVersions={handleToggleVersions}
      />

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <PreviewPane
          viewMode={viewMode}
          htmlContent={page?.html_content ?? ''}
          editedCode={editedCode ?? ''}
          hasUnsyncedChanges={hasUnsyncedChanges}
          syncing={syncing}
          syncDone={syncDone}
          onCodeChange={setEditedCode}
          onSyncCode={handleSyncCode}
          pageId={pageId}
          isPublished={page?.is_published && page?.hosting_status === 'active'}
        />

        {/* Chat pane */}
        <div style={{ flex: '0 0 28%', minWidth: '300px', maxWidth: '480px', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showVersions && (
            <VersionsPanel
              versions={versions}
              revertingId={revertingId}
              onRevert={handleRevertVersion}
              onClose={() => setShowVersions(false)}
            />
          )}

          <ChatPanel
            messages={messages}
            assets={assets}
            pendingUploads={pendingUploads}
            stagedFiles={stagedFiles}
            isAgentRunning={isAgentRunning}
            agentStatus={agentStatus}
            agentSlowWarning={agentSlowWarning}
            awaitingClarification={awaitingClarification}
            hasEverSentMessage={hasEverSentMessage}
            pageSource={page?.page_source}
            input={input}
            onInputChange={setInput}
            onSend={handleSendMessage}
            onAttachClick={() => fileInputRef.current?.click()}
            onRemoveStagedFile={removeStagedFile}
            onDeleteAsset={handleDeleteAsset}
            deletingAssetId={deletingAssetId}
            expandedThinking={expandedThinking}
            onToggleThinking={(id) => setExpandedThinking(prev => ({ ...prev, [id]: !prev[id] }))}
            showVersions={showVersions}
            onToggleVersions={handleToggleVersions}
          />
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '8px', padding: '2rem', width: '100%', maxWidth: '380px', animation: 'modalIn 0.2s ease both', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#e57373', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>delete page</p>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#111', margin: '0 0 0.5rem' }}>Delete "{page?.title}"?</h2>
            <p style={{ fontSize: '0.83rem', color: '#999', fontWeight: 300, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              This will permanently delete the page, all chat history, and all uploaded files. Cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} style={{ background: 'transparent', border: '1px solid #ddd', color: '#777', padding: '0.55rem 1rem', borderRadius: '3px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ background: '#c0392b', border: 'none', color: '#fff', padding: '0.55rem 1.1rem', borderRadius: '3px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}