// app/studio/[pageId]/ChatPanel.tsx
'use client';
import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { type ChatMessage, type PageAsset } from '@/lib/api';
import loadingAnimationData from '@/public/loader.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type ChatTab = 'chat' | 'files';

const MAX_TEXTAREA_HEIGHT = 168;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(asset: PageAsset): string {
  if (asset.asset_type === 'image') return 'img';
  if (asset.file_type === 'application/pdf') return 'pdf';
  return 'doc';
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

interface PendingUpload {
  id: string;
  file: File;
  progress: number;
  error?: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  assets: PageAsset[];
  pendingUploads: PendingUpload[];
  stagedFiles: File[];
  isAgentRunning: boolean;
  agentSlowWarning: boolean;
  awaitingClarification: boolean;
  hasEverSentMessage: boolean;
  pageSource?: string;
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onAttachClick: () => void;
  onRemoveStagedFile: (index: number) => void;
  onDeleteAsset: (assetId: string) => void;
  deletingAssetId: string | null;
  expandedThinking: Record<string, boolean>;
  onToggleThinking: (msgId: string) => void;
  showVersions: boolean;
  onToggleVersions: () => void;
}

export default function ChatPanel({
  messages,
  assets,
  pendingUploads,
  stagedFiles,
  isAgentRunning,
  agentSlowWarning,
  awaitingClarification,
  hasEverSentMessage,
  pageSource,
  input,
  onInputChange,
  onSend,
  onAttachClick,
  onRemoveStagedFile,
  onDeleteAsset,
  deletingAssetId,
  expandedThinking,
  onToggleThinking,
  showVersions,
  onToggleVersions,
}: ChatPanelProps) {
  const router = useRouter();
  const [chatTab, setChatTab] = useState<ChatTab>('chat');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);

  const readyAssets = assets.filter(a => a.processing_status === 'ready');

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
  }, [input]);

  const resizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const next = el.scrollHeight;
    if (next <= MAX_TEXTAREA_HEIGHT) {
      el.style.height = next + 'px';
      el.style.overflowY = 'hidden';
    } else {
      el.style.height = MAX_TEXTAREA_HEIGHT + 'px';
      el.style.overflowY = 'auto';
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
    resizeTextarea(e.target);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const renderThinkingBlock = (msg: ChatMessage) => {
    const plan = msg.meta?.plan as Record<string, any> ?? {};
    const isExpanded = expandedThinking[msg.id];
    return (
      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <button
          onClick={() => onToggleThinking(msg.id)}
          style={{ background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#aaa' }}
        >
          <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{isExpanded ? 'v' : '>'}</span>
          thinking
        </button>
        {isExpanded && (
          <div style={{ marginTop: '0.4rem', background: '#fafaf9', border: '1px solid #e8e6e1', borderRadius: '6px', padding: '0.75rem', maxWidth: '300px', width: '100%' }}>
            {plan.description && (
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#333', fontWeight: 400, lineHeight: 1.5 }}>
                {plan.description}
              </p>
            )}
            {plan.changes?.length > 0 && (
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
      <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontFamily: "'DM Mono', monospace", color: '#bbb' }}>
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
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#ccc' }}>· {formatBytes(asset.file_size_bytes)}</span>
        </div>
        {asset.processing_status === 'ready' && (asset.vision_description || asset.extracted_summary) && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.68rem', color: '#888', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
            {asset.vision_description || asset.extracted_summary}
          </p>
        )}
      </div>
      <button
        onClick={() => onDeleteAsset(asset.id)}
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

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .chat-tab-btn { background: transparent; border: none; padding: 0.3rem 0.7rem; font-size: 0.72rem; font-family: 'DM Mono', monospace; color: #bbb; cursor: pointer; border-bottom: 2px solid transparent; transition: color 0.12s, border-color 0.12s; }
        .chat-tab-btn:hover { color: #555; }
        .chat-tab-btn.active { color: #111; border-bottom-color: #111; }
        .send-btn { background: #111; color: #f8f7f4; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.12s; }
        .send-btn:hover { background: #333; }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .attach-btn { background: transparent; border: none; color: #bbb; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 4px; transition: color 0.12s, background 0.12s; flex-shrink: 0; }
        .attach-btn:hover { color: #555; background: #f0ede8; }
        .attach-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .chat-msg { animation: fadeUp 0.2s ease both; max-width: 90%; line-height: 1.55; }
        .user-msg { background: #111; color: #f8f7f4; border-radius: 12px 12px 3px 12px; padding: 0.65rem 0.9rem; font-size: 0.82rem; font-weight: 300; }
        .assistant-msg { background: #fff; color: #111; border: 1px solid #e8e6e1; border-radius: 3px 12px 12px 12px; padding: 0.65rem 0.9rem; font-size: 0.82rem; font-weight: 300; }
        .chat-input { width: 100%; border: none; outline: none; resize: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 300; color: #111; line-height: 1.6; min-height: 22px; max-height: ${MAX_TEXTAREA_HEIGHT}px; overflow-y: hidden; display: block; transition: height 0.08s ease; }
        .chat-input::placeholder { color: #bbb; }
        .chat-input::-webkit-scrollbar { width: 3px; }
        .chat-input::-webkit-scrollbar-track { background: transparent; }
        .chat-input::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        .chat-input::-webkit-scrollbar-thumb:hover { background: #bbb; }
        .staged-file-chip { display: flex; align-items: center; gap: 0.3rem; background: #f0ede8; border: 1px solid #e0ddd8; border-radius: 4px; padding: 0.2rem 0.5rem; font-size: 0.72rem; color: #555; max-width: 120px; }
        .staged-file-chip span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
      `}</style>

      {/* Tab bar */}
      <div style={{ padding: '0 0.75rem 0 1rem', borderBottom: '1px solid #f0ede8', flexShrink: 0, display: 'flex', alignItems: 'center', height: '42px', gap: '0.35rem' }}>
        <button className={`chat-tab-btn${chatTab === 'chat' ? ' active' : ''}`} onClick={() => setChatTab('chat')}>chat</button>
        <button className={`chat-tab-btn${chatTab === 'files' ? ' active' : ''}`} onClick={() => setChatTab('files')} style={{ position: 'relative' }}>
          files
          {assets.length > 0 && (
            <span style={{ marginLeft: '0.3rem', background: chatTab === 'files' ? '#111' : '#e8e6e1', color: chatTab === 'files' ? '#fff' : '#888', borderRadius: '100px', padding: '0 0.35rem', fontSize: '0.58rem', fontFamily: "'DM Mono', monospace", lineHeight: '1.4', display: 'inline-block' }}>
              {assets.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Chat tab ── */}
      {chatTab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#ccc', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>*</span>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem' }}>
                  {pageSource === 'import' ? 'page imported — describe what to change' : 'describe your page'}
                </p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#ddd', maxWidth: '180px', lineHeight: 1.5 }}>
                  attach images or docs with the paperclip button
                </p>
              </div>
            )}
            {messages.map(msg => renderMessage(msg))}

            {hasEverSentMessage && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem', paddingTop: '0.25rem' }}>
                {isAgentRunning
                  ? <Lottie animationData={loadingAnimationData} loop={true} style={{ width: '72px', height: '72px' }} />
                  : <Image src="/loader.png" alt="idle" width={24} height={24} style={{ objectFit: 'contain' }} />
                }
                {agentSlowWarning && isAgentRunning && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.35rem 0.6rem', maxWidth: '240px' }}>
                    <span style={{ fontSize: '0.65rem' }}>⏳</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#92400e', lineHeight: 1.4 }}>
                      still working — complex requests take longer
                    </span>
                  </div>
                )}
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input area */}
          <div style={{ flexShrink: 0, padding: '0.75rem', borderTop: '1px solid #f0ede8' }}>
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
                    <button onClick={() => onRemoveStagedFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0 }}>
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

            <div style={{
              background: '#f8f7f4',
              border: '1px solid #e8e6e1',
              borderRadius: '8px',
              padding: '0.65rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: 'border-color 0.15s',
            }}>
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder={isAgentRunning ? 'generating...' : awaitingClarification ? 'type your answer...' : 'describe a change...'}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                disabled={isAgentRunning}
                rows={1}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button className="attach-btn" onClick={onAttachClick} disabled={isAgentRunning}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 7.5L7.5 13.5C6.1 14.9 3.9 14.9 2.5 13.5C1.1 12.1 1.1 9.9 2.5 8.5L9 2C9.9 1.1 11.4 1.1 12.3 2C13.2 2.9 13.2 4.4 12.3 5.3L6.3 11.3C5.9 11.7 5.2 11.7 4.8 11.3C4.4 10.9 4.4 10.2 4.8 9.8L10 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="send-btn" onClick={onSend} disabled={!input.trim() || isAgentRunning}>
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

      {/* ── Files tab ── */}
      {chatTab === 'files' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {assets.length === 0 && pendingUploads.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#ccc', gap: '0.75rem', padding: '2rem', cursor: 'pointer' }} onClick={onAttachClick}>
              <div style={{ width: '40px', height: '40px', border: '1.5px dashed #ddd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 7.5L7.5 13.5C6.1 14.9 3.9 14.9 2.5 13.5C1.1 12.1 1.1 9.9 2.5 8.5L9 2C9.9 1.1 11.4 1.1 12.3 2C13.2 2.9 13.2 4.4 12.3 5.3L6.3 11.3C5.9 11.7 5.2 11.7 4.8 11.3C4.4 10.9 4.4 10.2 4.8 9.8L10 4.5" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
                <button onClick={onAttachClick} style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '3px', padding: '0.25rem 0.6rem', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#888', cursor: 'pointer' }}>
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
  );
}