'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Monaco editor — load client side only
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type ViewMode = 'preview' | 'mobile' | 'code';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
}

interface Page {
  id: string;
  title: string;
  html_content: string;
  is_published: boolean;
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

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load initial page data ──────────────────────────────
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

      setMessages(msgs || []);
      setLoading(false);
    };
    init();
  }, [pageId, router]);

  // ── Supabase Realtime subscriptions ────────────────────
  useEffect(() => {
    if (!pageId) return;

    // Watch html_content changes → update iframe live
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

    // Watch chat messages → update chat window live
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
            // avoid duplicates
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
        if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          // If a message transitions to completed/error, agent is done
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

  // ── Update iframe when html_content changes ────────────
  useEffect(() => {
    if (!page?.html_content || !iframeRef.current || viewMode === 'code') return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(page.html_content);
      doc.close();
    }
  }, [page?.html_content, viewMode]);

  // ── Scroll chat to bottom ───────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || isAgentRunning) return;
    const text = input.trim();
    setInput('');
    setIsAgentRunning(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Insert user message → DB trigger fires → edge function → backend
    await supabase.from('chat_messages').insert({
      page_id: pageId,
      role: 'user',
      content: text,
      status: 'pending'
    });
  };

  // ── Publish / unpublish ──────────────────────────────────
  const handlePublish = async () => {
    if (!page) return;
    setPublishing(true);

    const newState = !page.is_published;
    await supabase.from('pages').update({ is_published: newState }).eq('id', pageId);
    setPage(prev => prev ? { ...prev, is_published: newState } : prev);

    if (newState) {
      // Copy link to clipboard
      const link = `${window.location.origin}/p/${pageId}`;
      await navigator.clipboard.writeText(link);
      setPublishCopied(true);
      setTimeout(() => setPublishCopied(false), 3000);
    }

    setPublishing(false);
  };

  // ── Textarea auto-resize ─────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }

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
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{ height: '48px', background: '#fff', borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', flexShrink: 0, gap: '1rem' }}>
        {/* Left: logo + title */}
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

        {/* Center: view tabs */}
        <div style={{ display: 'flex', gap: '0.2rem', background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '5px', padding: '0.2rem' }}>
          {(['preview', 'mobile', 'code'] as ViewMode[]).map(mode => (
            <button key={mode} className={`tab-btn${viewMode === mode ? ' active' : ''}`} onClick={() => setViewMode(mode)}>
              {mode === 'preview' ? '⬜ desktop' : mode === 'mobile' ? '📱 mobile' : '</> code'}
            </button>
          ))}
        </div>

        {/* Right: publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {page?.is_published && (
            <a href={publishUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#2a9d5c', textDecoration: 'none', borderBottom: '1px solid currentColor', lineHeight: 1 }}>
              {publishUrl.replace('https://', '')}
            </a>
          )}
          <button
            className={`publish-btn${page?.is_published ? ' live' : ''}`}
            onClick={handlePublish}
            disabled={publishing}
          >
            {page?.is_published ? (
              <><span style={{ fontSize: '0.6rem' }}>●</span> {publishCopied ? 'link copied!' : 'live'}</>
            ) : (
              <><span>↗</span> Publish</>
            )}
          </button>
        </div>
      </nav>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: PREVIEW PANEL (80%) ── */}
        <div style={{ flex: '0 0 80%', borderRight: '1px solid #e8e6e1', background: viewMode === 'code' ? '#1e1e1e' : '#e8e6e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {viewMode === 'preview' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', padding: '0' }}>
              <iframe
                ref={iframeRef}
                style={{ flex: 1, border: 'none', display: 'block', background: '#fff' }}
                title="Page preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}

          {viewMode === 'mobile' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#e0ddd8' }}>
              <div style={{ width: '375px', height: '812px', maxHeight: '90%', background: '#fff', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.1)', position: 'relative' }}>
                {/* notch */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '28px', background: '#111', borderRadius: '0 0 20px 20px', zIndex: 10 }} />
                <iframe
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  srcDoc={page?.html_content || ''}
                  title="Mobile preview"
                  sandbox="allow-scripts allow-same-origin"
                />
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

        {/* ── RIGHT: CHAT PANEL (20%) ── */}
        <div style={{ flex: '0 0 20%', display: 'flex', flexDirection: 'column', background: '#fff', minWidth: '260px', maxWidth: '380px' }}>

          {/* Chat header */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f0ede8', flexShrink: 0 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#bbb', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>chat</p>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#ccc', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>✦</span>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}>describe your page</p>
              </div>
            )}

            {messages.map(msg => (
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
            ))}

            {/* Processing indicator — shown when agent is running but no reply yet */}
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

          {/* Input area */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid #f0ede8', flexShrink: 0 }}>
            <div style={{ background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '8px', padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', transition: 'border-color 0.15s' }}>
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder={isAgentRunning ? 'generating...' : 'describe a change...'}
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
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || isAgentRunning}
              >
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
    </div>
  );
}