'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type ViewMode = 'preview' | 'mobile' | 'code';

const AVAILABLE_MODELS = [
  { id: 'groq/llama-3.3-70b', label: 'Llama 3.3 70B', provider: 'Groq' },
  { id: 'groq/llama-3.1-8b', label: 'Llama 3.1 8B', provider: 'Groq' },
  { id: 'claude/claude-sonnet-4-5', label: 'Claude Sonnet', provider: 'Anthropic' },
  { id: 'claude/claude-haiku-4-5', label: 'Claude Haiku', provider: 'Anthropic' },
];

const DEFAULT_MODEL = 'groq/llama-3.3-70b';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message_type: string;
  meta: Record<string, any>;
  created_at: string;
}

interface Page {
  id: string;
  title: string;
  html_content: string;
  is_published: boolean;
}

function getStoredModel(pageId: string): string {
  if (typeof window === 'undefined') return DEFAULT_MODEL;
  return localStorage.getItem(`model:${pageId}`) || DEFAULT_MODEL;
}

function storeModel(pageId: string, modelId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`model:${pageId}`, modelId);
}

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const [page, setPage] = useState<Page | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishCopied, setPublishCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [modelLocked, setModelLocked] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [awaitingClarification, setAwaitingClarification] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/auth'); return; }

      const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (!pageData) { router.replace('/dashboard/projects'); return; }
      setPage(pageData);

      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: true });

      const msgList = msgs || [];
      setMessages(msgList);

      const storedModel = getStoredModel(pageId);
      setSelectedModel(storedModel);

      const hasCompletedMessages = msgList.some(
        (m: ChatMessage) => m.role === 'user' && m.status === 'completed'
      );
      if (hasCompletedMessages) {
        setModelLocked(true);
      }

      const hasPendingClarification = msgList.some(
        (m: ChatMessage) => m.message_type === 'clarification' && m.meta?.awaiting_clarification === true
      );
      setAwaitingClarification(hasPendingClarification);

      setLoading(false);
    };
    init();
  }, [pageId, router]);

  useEffect(() => {
    if (!pageId) return;

    const pageChannel = supabase
      .channel(`page-${pageId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pages',
        filter: `id=eq.${pageId}`
      }, (payload) => {
        const updated = payload.new as Page;
        setPage(prev => prev ? { ...prev, ...updated } : updated);
      })
      .subscribe();

    const chatChannel = supabase
      .channel(`chat-${pageId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `page_id=eq.${pageId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.message_type === 'clarification' && newMsg.meta?.awaiting_clarification) {
            setAwaitingClarification(true);
          }
        }
        if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          if (updatedMsg.status === 'completed' || updatedMsg.status === 'error') {
            setIsAgentRunning(false);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pageChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [pageId]);

  useEffect(() => {
    if (!page?.html_content || !iframeRef.current || viewMode === 'code') return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(page.html_content);
      doc.close();
    }
  }, [page?.html_content, viewMode]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModelChange = (modelId: string) => {
    if (modelLocked) return;
    setSelectedModel(modelId);
    storeModel(pageId, modelId);
  };

  const sendMessage = async () => {
    if (!input.trim() || isAgentRunning) return;
    const text = input.trim();
    setInput('');
    setIsAgentRunning(true);

    if (awaitingClarification) {
      setAwaitingClarification(false);
    }

    if (!modelLocked) {
      setModelLocked(true);
      storeModel(pageId, selectedModel);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: insertedMsg } = await supabase.from('chat_messages').insert({
      page_id: pageId,
      role: 'user',
      content: text,
      status: 'pending',
      message_type: 'chat',
      meta: {}
    }).select().single();

    if (!insertedMsg) return;

    await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL}/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_id: insertedMsg.id,
        page_id: pageId,
        content: text,
        model_id: selectedModel
      })
    });
  };

  const handlePublish = async () => {
    if (!page) return;
    setPublishing(true);
    const newState = !page.is_published;
    await supabase.from('pages').update({ is_published: newState }).eq('id', pageId);
    setPage(prev => prev ? { ...prev, is_published: newState } : prev);
    if (newState) {
      const link = `${window.location.origin}/p/${pageId}`;
      await navigator.clipboard.writeText(link);
      setPublishCopied(true);
      setTimeout(() => setPublishCopied(false), 3000);
    }
    setPublishing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('pages').delete().eq('id', pageId);
    if (error) {
      setDeleting(false);
      setShowDeleteModal(false);
      return;
    }
    router.replace('/dashboard/projects');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const toggleThinking = (msgId: string) => {
    setExpandedThinking(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const renderThinkingBlock = (msg: ChatMessage) => {
    const plan = msg.meta?.plan || {};
    const isExpanded = expandedThinking[msg.id];
    return (
      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <button
          onClick={() => toggleThinking(msg.id)}
          style={{
            background: '#f8f7f4',
            border: '1px solid #e8e6e1',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.68rem',
            color: '#888',
            transition: 'background 0.12s'
          }}
        >
          <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{isExpanded ? '▼' : '▶'}</span>
          thinking
          {plan.complexity && (
            <span style={{
              background: plan.complexity === 'complex' ? '#fef3c7' : plan.complexity === 'moderate' ? '#ede9fe' : '#f0fdf4',
              color: plan.complexity === 'complex' ? '#92400e' : plan.complexity === 'moderate' ? '#5b21b6' : '#166534',
              padding: '0.1rem 0.4rem',
              borderRadius: '100px',
              fontSize: '0.62rem'
            }}>
              {plan.complexity}
            </span>
          )}
        </button>
        {isExpanded && (
          <div style={{
            marginTop: '0.4rem',
            background: '#fafaf9',
            border: '1px solid #e8e6e1',
            borderRadius: '6px',
            padding: '0.75rem',
            maxWidth: '280px',
            width: '100%'
          }}>
            {plan.description && (
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#333', fontWeight: 400, lineHeight: 1.5 }}>
                {plan.description}
              </p>
            )}
            {plan.decision && (
              <p style={{ margin: '0 0 0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#888' }}>
                mode: <span style={{ color: plan.decision === 'full_rewrite' ? '#dc2626' : '#2563eb' }}>{plan.decision}</span>
              </p>
            )}
            {plan.changes && plan.changes.length > 0 && (
              <div>
                <p style={{ margin: '0 0 0.3rem', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', textTransform: 'uppercase' }}>changes</p>
                {plan.changes.map((c: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', flexShrink: 0, marginTop: '0.1rem' }}>{c.order}.</span>
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
    if (msg.message_type === 'thinking') {
      return renderThinkingBlock(msg);
    }

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

    return (
      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
        <div className={`chat-msg ${msg.role === 'user' ? 'user-msg' : 'assistant-msg'}`}>
          {msg.content}
          {msg.status === 'processing' && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '0.5rem', alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} className="thinking-dot" style={{ animationDelay: `${delay}s` }} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const publishUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${pageId}`;
  const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }

        .tab-btn {
          background: transparent; border: none;
          padding: 0.35rem 0.75rem; font-size: 0.78rem;
          font-family: 'DM Sans', sans-serif; font-weight: 400;
          color: #999; cursor: pointer; border-radius: 3px;
          transition: background 0.12s, color 0.12s; letter-spacing: 0.01em;
        }
        .tab-btn:hover { background: #f0ede8; color: #111; }
        .tab-btn.active { background: #111; color: #f8f7f4; }

        .send-btn {
          background: #111; color: #f8f7f4; border: none;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.12s, transform 0.1s;
        }
        .send-btn:hover { background: #333; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

        .publish-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: transparent; border: 1px solid #ddd;
          padding: 0.38rem 0.85rem; font-size: 0.78rem;
          font-family: 'DM Sans', sans-serif; font-weight: 400;
          color: #555; cursor: pointer; border-radius: 3px;
          transition: all 0.15s;
        }
        .publish-btn:hover { border-color: #999; color: #111; }
        .publish-btn.live { border-color: #2a9d5c; color: #2a9d5c; background: rgba(42,157,92,0.06); }
        .publish-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .delete-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: transparent; border: 1px solid #ddd;
          padding: 0.38rem 0.75rem; font-size: 0.78rem;
          font-family: 'DM Sans', sans-serif; font-weight: 400;
          color: #bbb; cursor: pointer; border-radius: 3px;
          transition: all 0.15s;
        }
        .delete-btn:hover { border-color: #e57373; color: #e57373; background: rgba(229,115,115,0.05); }

        .chat-msg {
          animation: fadeUp 0.2s ease both;
          max-width: 88%;
          line-height: 1.55;
        }

        .user-msg {
          background: #111; color: #f8f7f4;
          border-radius: 12px 12px 3px 12px;
          padding: 0.65rem 0.9rem;
          font-size: 0.82rem; font-weight: 300;
          align-self: flex-end;
        }

        .assistant-msg {
          background: #fff; color: #111;
          border: 1px solid #e8e6e1;
          border-radius: 3px 12px 12px 12px;
          padding: 0.65rem 0.9rem;
          font-size: 0.82rem; font-weight: 300;
        }

        .thinking-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #bbb; display: inline-block;
          animation: pulse 1.2s ease infinite;
        }

        .chat-input {
          flex: 1; border: none; outline: none; resize: none;
          background: transparent; font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 300; color: #111;
          line-height: 1.5; min-height: 20px; max-height: 120px;
          overflow-y: auto;
        }
        .chat-input::placeholder { color: #bbb; }

        .model-select {
          background: transparent;
          border: 1px solid #e8e6e1;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-size: 0.72rem;
          font-family: 'DM Mono', monospace;
          color: #888;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s, color 0.15s;
          appearance: none;
          -webkit-appearance: none;
          padding-right: 1.2rem;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23bbb' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.4rem center;
        }
        .model-select:hover:not(:disabled) { border-color: #bbb; color: #555; }
        .model-select:disabled { opacity: 0.5; cursor: not-allowed; }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .modal {
          background: #fff; border: 1px solid #e8e6e1;
          border-radius: 8px; padding: 2rem;
          width: 100%; max-width: 380px;
          animation: modalIn 0.2s ease both;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
        }
        .modal-cancel-btn {
          background: transparent; border: 1px solid #ddd;
          color: #777; padding: 0.55rem 1rem;
          border-radius: 3px; font-size: 0.82rem;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s;
        }
        .modal-cancel-btn:hover { border-color: #999; color: #111; }
        .modal-delete-confirm-btn {
          background: #c0392b; border: none; color: #fff;
          padding: 0.55rem 1.1rem; border-radius: 3px;
          font-size: 0.82rem; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 400;
          transition: background 0.15s;
        }
        .modal-delete-confirm-btn:hover { background: #a93226; }
        .modal-delete-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <nav style={{ height: '48px', background: '#fff', borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', flexShrink: 0, gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <Link href="/dashboard/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Hyphertext" width={22} height={22} style={{ borderRadius: '50%' }} />
          </Link>
          <span style={{ color: '#ddd', fontSize: '0.75rem' }}>/</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
            {page?.title}
          </span>
          {isAgentRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '100px', padding: '0.2rem 0.6rem' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#888' }}>generating</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.2rem', background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '5px', padding: '0.2rem' }}>
          {(['preview', 'mobile', 'code'] as ViewMode[]).map(mode => (
            <button key={mode} className={`tab-btn${viewMode === mode ? ' active' : ''}`} onClick={() => setViewMode(mode)}>
              {mode === 'preview' ? 'desktop' : mode === 'mobile' ? 'mobile' : 'code'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {page?.is_published && (
            <a href={publishUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#2a9d5c', textDecoration: 'none', borderBottom: '1px solid currentColor', lineHeight: 1 }}>
              {publishUrl.replace('https://', '')}
            </a>
          )}
          <button className="delete-btn" onClick={() => setShowDeleteModal(true)} title="Delete page">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 3.5H13M5.5 3.5V2.5C5.5 2 5.5 1.5 6.5 1.5H7.5C8.5 1.5 8.5 2 8.5 2.5V3.5M6 6V10.5M8 6V10.5M2.5 3.5L3 11.5C3 12 3.5 12.5 4 12.5H10C10.5 12.5 11 12 11 11.5L11.5 3.5H2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
          <button className={`publish-btn${page?.is_published ? ' live' : ''}`} onClick={handlePublish} disabled={publishing}>
            {page?.is_published ? (
              <><span style={{ fontSize: '0.6rem' }}>●</span> {publishCopied ? 'link copied!' : 'live'}</>
            ) : (
              <><span>↗</span> Publish</>
            )}
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        <div style={{ flex: '0 0 80%', borderRight: '1px solid #e8e6e1', background: viewMode === 'code' ? '#1e1e1e' : '#e8e6e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {viewMode === 'preview' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
              <iframe ref={iframeRef} style={{ flex: 1, border: 'none', display: 'block', background: '#fff' }} title="Page preview" sandbox="allow-scripts allow-same-origin" />
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
            <MonacoEditor
              height="100%"
              language="html"
              theme="vs-dark"
              value={page?.html_content || ''}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                fontFamily: "'DM Mono', 'Fira Code', monospace",
                padding: { top: 16, bottom: 16 },
              }}
            />
          )}
        </div>

        <div style={{ flex: '0 0 20%', display: 'flex', flexDirection: 'column', background: '#fff', minWidth: '260px', maxWidth: '380px' }}>

          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f0ede8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#bbb', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>chat</p>
            {activeModel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {modelLocked && <span style={{ fontSize: '0.55rem', color: '#bbb' }}>locked</span>}
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: modelLocked ? '#bbb' : '#888', background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '3px', padding: '0.1rem 0.4rem' }}>
                  {activeModel.label}
                </span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#ccc', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>✦</span>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}>describe your page</p>
              </div>
            )}
            {messages.map(msg => renderMessage(msg))}
            {isAgentRunning && messages[messages.length - 1]?.role === 'user' && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div className="assistant-msg chat-msg" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} className="thinking-dot" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div style={{ padding: '0.75rem', borderTop: '1px solid #f0ede8', flexShrink: 0 }}>
            {!modelLocked && (
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb' }}>model</span>
                <select
                  className="model-select"
                  value={selectedModel}
                  onChange={e => handleModelChange(e.target.value)}
                  disabled={modelLocked}
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.provider} / {m.label}</option>
                  ))}
                </select>
              </div>
            )}
            {awaitingClarification && (
              <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#f59e0b' }}>answering clarification</span>
              </div>
            )}
            <div style={{ background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '8px', padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', transition: 'border-color 0.15s' }}>
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder={
                  isAgentRunning ? 'generating...' :
                  awaitingClarification ? 'type your answer...' :
                  'describe a change...'
                }
                value={input}
                onChange={handleInputChange}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isAgentRunning}
                rows={1}
              />
              <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || isAgentRunning}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 13L13 7L1 1V5.5L9 7L1 8.5V13Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#ddd', marginTop: '0.4rem', textAlign: 'center' }}>
              enter to send · shift+enter for newline
            </p>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div className="modal">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#e57373', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>delete page</p>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#111', margin: '0 0 0.5rem' }}>Delete "{page?.title}"?</h2>
            <p style={{ fontSize: '0.83rem', color: '#999', fontWeight: 300, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              This will permanently delete the page and all its chat history. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button className="modal-cancel-btn" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
              <button className="modal-delete-confirm-btn" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}