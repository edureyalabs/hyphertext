'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPage, type Page } from '@/lib/api';
import { INITIAL_BOILERPLATE } from '@/lib/boilerplate';

type CreateMode = 'agent' | 'import';

const PAGE_SIZE = 20;

async function fetchPagesBatch(offset: number): Promise<{ pages: Page[]; hasMore: boolean }> {
  const res = await fetch(`/api/pages?limit=${PAGE_SIZE}&offset=${offset}`);
  if (!res.ok) return { pages: [], hasMore: false };
  const data = await res.json();
  return { pages: data.pages ?? [], hasMore: data.hasMore ?? false };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [pages, setPages]             = useState<Page[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [createMode, setCreateMode]   = useState<CreateMode>('agent');
  const [newTitle, setNewTitle]       = useState('');
  const [importHtml, setImportHtml]   = useState('');
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied]           = useState(false);

  const listRef     = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef   = useRef(0);

  const selectedPage = pages.find(p => p.id === selectedId) ?? null;
  const publishUrl   = selectedPage
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${selectedPage.id}`
    : '';

  // Initial load
  useEffect(() => {
    fetchPagesBatch(0).then(({ pages: initial, hasMore: more }) => {
      setPages(initial);
      offsetRef.current = initial.length;
      setHasMore(more);
      if (initial.length > 0) setSelectedId(initial[0].id);
      setLoading(false);
    });
  }, []);

  // Infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { pages: next, hasMore: more } = await fetchPagesBatch(offsetRef.current);
    setPages(prev => [...prev, ...next]);
    offsetRef.current += next.length;
    setHasMore(more);
    setLoadingMore(false);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { root: listRef.current, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const resetModal = () => {
    setShowModal(false);
    setCreateMode('agent');
    setNewTitle('');
    setImportHtml('');
    setCreateError('');
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    if (createMode === 'import' && !importHtml.trim()) {
      setCreateError('Please paste your HTML code.');
      return;
    }
    setCreating(true);
    setCreateError('');
    const html   = createMode === 'import' ? importHtml.trim() : INITIAL_BOILERPLATE;
    const source = createMode === 'import' ? 'import' : 'agent';
    const { page, error } = await createPage(newTitle.trim(), html, source);
    if (error || !page) {
      setCreateError(error ?? 'Failed to create page.');
      setCreating(false);
      return;
    }
    setCreating(false);
    resetModal();
    router.push(`/studio/${page.id}`);
  };

  const handleCopyUrl = async () => {
    if (!publishUrl) return;
    await navigator.clipboard.writeText(publishUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPageLive      = (p: Page) => p.is_published && p.hosting_status === 'active';
  const isPageSuspended = (p: Page) => p.is_published && p.hosting_status === 'suspended';

  const getPageStatusLabel = (p: Page) => {
    if (isPageLive(p))      return { label: 'live',      color: '#2a9d5c', dot: '●' };
    if (isPageSuspended(p)) return { label: 'suspended', color: '#f59e0b', dot: '◐' };
    return                         { label: 'draft',     color: '#bbb',    dot: '○' };
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.9; } }
        @keyframes spin    { to { transform: rotate(360deg); } }

        .left-panel {
          width: 260px; min-width: 220px; max-width: 300px;
          background: #fff; border-right: 1px solid #ece9e4;
          display: flex; flex-direction: column; min-height: 0; overflow: hidden;
        }
        .panel-header {
          padding: 1.2rem 1.1rem 0.85rem; border-bottom: 1px solid #f0ede8; flex-shrink: 0;
        }
        .new-page-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          width: 100%; background: #111; color: #f8f7f4; border: none;
          padding: 0.55rem 0; font-size: 0.8rem; font-family: 'DM Sans', sans-serif;
          font-weight: 400; letter-spacing: 0.02em; cursor: pointer;
          border-radius: 5px; transition: background 0.15s, transform 0.1s; margin-top: 0.85rem;
        }
        .new-page-btn:hover { background: #1f1f1f; transform: translateY(-1px); }
        .new-page-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .project-list {
          flex: 1; min-height: 0; overflow-y: auto; padding: 0.5rem 0;
        }
        .project-list::-webkit-scrollbar { width: 4px; }
        .project-list::-webkit-scrollbar-thumb { background: #e8e6e1; border-radius: 2px; }
        .project-item {
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.6rem 1.1rem; cursor: pointer;
          border-left: 2px solid transparent;
          transition: background 0.1s, border-color 0.1s; user-select: none;
        }
        .project-item:hover { background: #faf9f7; }
        .project-item.selected { background: #f5f3ef; border-left-color: #111; }

        .right-panel {
          flex: 1; min-width: 0; min-height: 0;
          display: flex; background: #f0ede8; overflow: hidden; position: relative;
        }
        .browser-wrap {
          position: absolute; inset: 1.75rem;
          display: flex; flex-direction: column;
          background: #fff; border-radius: 10px; overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08),
                      0 20px 56px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.07);
          animation: fadeIn 0.35s ease both;
        }
        .browser-chrome {
          height: 40px; min-height: 40px; background: #f5f3ef;
          border-bottom: 1px solid #e8e6e1; display: flex; align-items: center;
          padding: 0 0.85rem; gap: 0.65rem; flex-shrink: 0;
        }
        .traffic-lights { display: flex; gap: 5px; flex-shrink: 0; }
        .traffic-light  { width: 10px; height: 10px; border-radius: 50%; }
        .address-bar {
          flex: 1; background: #fff; border: 1px solid #e0ddd8; border-radius: 5px;
          padding: 0.22rem 0.7rem; font-family: 'DM Mono', monospace; font-size: 0.68rem;
          color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .action-btn {
          display: flex; align-items: center; gap: 0.3rem;
          background: transparent; border: 1px solid #e0ddd8; border-radius: 4px;
          padding: 0.22rem 0.55rem; font-size: 0.72rem; font-family: 'DM Sans', sans-serif;
          color: #666; cursor: pointer; transition: all 0.13s; white-space: nowrap;
          flex-shrink: 0; text-decoration: none;
        }
        .action-btn:hover:not(.disabled) { background: #fff; border-color: #bbb; color: #111; }
        .action-btn.primary { background: #111; border-color: #111; color: #f8f7f4; }
        .action-btn.primary:hover { background: #222; border-color: #222; }
        .action-btn.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
        .browser-iframe {
          flex: 1; min-height: 0; border: none; display: block; background: #fff;
        }
        .empty-preview {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; flex: 1; gap: 0.5rem; color: #ccc; text-align: center;
        }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.3);
          backdrop-filter: blur(5px); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .modal {
          background: #fff; border: 1px solid #e8e6e1; border-radius: 10px;
          padding: 2rem; width: 100%; max-width: 480px;
          animation: modalIn 0.2s ease both; box-shadow: 0 12px 48px rgba(0,0,0,0.12);
        }
        .modal-input {
          width: 100%; border: 1px solid #ddd; border-radius: 5px;
          padding: 0.7rem 0.9rem; font-size: 0.88rem; font-family: 'DM Sans', sans-serif;
          font-weight: 300; color: #111; background: #fafaf9; outline: none;
          transition: border-color 0.15s; margin-top: 0.85rem;
        }
        .modal-input:focus { border-color: #111; }
        .modal-input::placeholder { color: #ccc; }
        .mode-tab {
          flex: 1; padding: 0.5rem; border: 1px solid #e0ddd8;
          background: transparent; font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem; color: #888; cursor: pointer; transition: all 0.13s;
        }
        .mode-tab:first-child { border-radius: 5px 0 0 5px; border-right: none; }
        .mode-tab:last-child  { border-radius: 0 5px 5px 0; }
        .mode-tab.active { background: #111; color: #f8f7f4; border-color: #111; }
        .mode-tab:not(.active):hover { background: #f5f3ef; color: #333; }
      `}</style>

      {/* ── Left panel ── */}
      <aside className="left-panel">
        <div className="panel-header">
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>pages</p>
          <h2 style={{ fontSize: '1rem', fontWeight: 400, letterSpacing: '-0.02em', margin: 0, color: '#111' }}>Your pages</h2>
          <button className="new-page-btn" onClick={() => setShowModal(true)}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            New page
          </button>
        </div>

        <div className="project-list" ref={listRef}>
          {loading ? (
            <div style={{ padding: '1.5rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '36px', background: '#f5f3ef', borderRadius: '4px', animation: `shimmer ${0.8 + i * 0.15}s ease infinite` }} />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <div style={{ padding: '2rem 1.1rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#ccc', margin: '0 0 0.4rem' }}>no pages yet</p>
              <p style={{ fontSize: '0.8rem', color: '#bbb', fontWeight: 300, margin: 0, lineHeight: 1.6 }}>Create your first page to get started.</p>
            </div>
          ) : (
            <>
              {pages.map(page => {
                const status = getPageStatusLabel(page);
                return (
                  <div
                    key={page.id}
                    className={`project-item${selectedId === page.id ? ' selected' : ''}`}
                    onClick={() => setSelectedId(page.id)}
                  >
                    <div style={{
                      width: '28px', height: '34px', flexShrink: 0,
                      background: selectedId === page.id ? '#fff' : '#f5f3ef',
                      border: `1px solid ${selectedId === page.id ? '#e0ddd8' : '#ece9e4'}`,
                      borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.12s',
                    }}>
                      {page.page_source === 'import' ? (
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                          <rect x="1" y="1" width="10" height="12" rx="1.5" stroke="#b0c4de" strokeWidth="1"/>
                          <path d="M3 7h6M6 5v4" stroke="#b0c4de" strokeWidth="0.9" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                          <rect x="1" y="1" width="10" height="12" rx="1.5" stroke="#ccc" strokeWidth="1"/>
                          <path d="M3 4.5h6M3 7h6M3 9.5h4" stroke="#ddd" strokeWidth="0.8" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: '0 0 0.15rem', fontSize: '0.82rem',
                        fontWeight: selectedId === page.id ? 500 : 400,
                        color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{page.title}</p>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: status.color }}>
                        {status.dot} {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Sentinel for IntersectionObserver */}
              <div ref={sentinelRef} style={{ height: '1px' }} />

              {loadingMore && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
                  <div style={{ width: '14px', height: '14px', border: '1.5px solid #ddd', borderTopColor: '#999', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="right-panel">
        {selectedPage === null ? (
          <div className="empty-preview">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.3 }}>
              <rect x="2" y="5" width="28" height="22" rx="3" stroke="#999" strokeWidth="1.5"/>
              <path d="M2 10h28" stroke="#999" strokeWidth="1.5"/>
              <circle cx="6.5" cy="7.5" r="1" fill="#999"/>
              <circle cx="10" cy="7.5" r="1" fill="#999"/>
              <circle cx="13.5" cy="7.5" r="1" fill="#999"/>
            </svg>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#ccc', margin: 0 }}>
              {loading ? 'loading...' : 'select a page to preview'}
            </p>
          </div>
        ) : (
          <div className="browser-wrap">
            <div className="browser-chrome">
              <div className="traffic-lights">
                <div className="traffic-light" style={{ background: '#ff5f57' }} />
                <div className="traffic-light" style={{ background: '#febc2e' }} />
                <div className="traffic-light" style={{ background: '#28c840' }} />
              </div>

              <div className="address-bar">
                {isPageLive(selectedPage)
                  ? publishUrl
                  : isPageSuspended(selectedPage)
                  ? 'hosting suspended — upgrade to restore'
                  : 'draft · not published'}
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                <button className="action-btn primary" onClick={() => router.push(`/studio/${selectedPage.id}`)}>
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>

                <a
                  href={isPageLive(selectedPage) ? publishUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`action-btn${!isPageLive(selectedPage) ? ' disabled' : ''}`}
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M5.5 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8.5M8 1h5m0 0v5m0-5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Open
                </a>

                <button
                  className={`action-btn${!isPageLive(selectedPage) ? ' disabled' : ''}`}
                  onClick={handleCopyUrl}
                  disabled={!isPageLive(selectedPage)}
                >
                  {copied ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-6" stroke="#2a9d5c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ color: '#2a9d5c' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M3 10H2a1 1 0 01-1-1V2a1 1 0 011-1h7a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>

            {isPageSuspended(selectedPage) && (
              <div style={{ padding: '0.6rem 1rem', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 300 }}>
                  This site is suspended because your hosting plan expired.
                </span>
                <button
                  onClick={() => router.push('/account?tab=hosting')}
                  style={{ background: '#111', color: '#f8f7f4', border: 'none', borderRadius: '4px', padding: '0.25rem 0.7rem', fontSize: '0.72rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}
                >
                  Upgrade plan
                </button>
              </div>
            )}

            {isPageLive(selectedPage) ? (
              <iframe
                key={selectedPage.id}
                src={publishUrl}
                className="browser-iframe"
                title={`Preview: ${selectedPage.title}`}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                <iframe
                  key={selectedPage.id}
                  srcDoc={selectedPage.html_content || ''}
                  className="browser-iframe"
                  style={{ width: '100%', height: '100%' }}
                  title={`Preview: ${selectedPage.title}`}
                  sandbox="allow-scripts allow-same-origin"
                />
                {!isPageSuspended(selectedPage) && (
                  <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.92)', border: '1px solid #e8e6e1', borderRadius: '100px', padding: '0.35rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', whiteSpace: 'nowrap' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ccc', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#999' }}>draft · not published yet</span>
                    <button
                      onClick={() => router.push(`/studio/${selectedPage.id}`)}
                      style={{ background: '#111', color: '#f8f7f4', border: 'none', borderRadius: '100px', padding: '0.2rem 0.7rem', fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', marginLeft: '0.25rem' }}
                    >
                      Publish
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetModal(); }}>
          <div className="modal">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>new page</p>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#111', margin: '0 0 1rem' }}>Create a page</h2>

            <div style={{ display: 'flex', marginBottom: '1rem' }}>
              <button className={`mode-tab${createMode === 'agent' ? ' active' : ''}`} onClick={() => setCreateMode('agent')}>AI Generate</button>
              <button className={`mode-tab${createMode === 'import' ? ' active' : ''}`} onClick={() => setCreateMode('import')}>Import HTML</button>
            </div>

            {createMode === 'agent' ? (
              <p style={{ fontSize: '0.82rem', color: '#aaa', fontWeight: 300, margin: 0, lineHeight: 1.6 }}>
                Start with a blank canvas and describe what you want to build to the AI agent.
              </p>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#aaa', fontWeight: 300, margin: 0, lineHeight: 1.6 }}>
                Paste your existing HTML and we will host it instantly. You can edit it with AI later.
              </p>
            )}

            <input
              className="modal-input"
              type="text"
              placeholder={createMode === 'agent' ? 'e.g. Wedding Invite, My Portfolio...' : 'Page name, e.g. My Landing Page'}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') resetModal(); }}
              autoFocus
            />

            {createMode === 'import' && (
              <textarea
                className="modal-input"
                placeholder={'<!DOCTYPE html>\n<html>...</html>'}
                value={importHtml}
                onChange={e => setImportHtml(e.target.value)}
                style={{ height: '160px', resize: 'vertical', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', marginTop: '0.75rem' }}
                spellCheck={false}
              />
            )}

            {createError && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#e05252', marginTop: '0.5rem' }}>{createError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button
                onClick={resetModal}
                style={{ background: 'transparent', border: '1px solid #ddd', color: '#777', padding: '0.55rem 1rem', borderRadius: '4px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || (createMode === 'import' && !importHtml.trim()) || creating}
                style={{ background: '#111', color: '#f8f7f4', border: 'none', padding: '0.55rem 1.2rem', borderRadius: '4px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: (!newTitle.trim() || creating) ? 0.4 : 1 }}
              >
                {creating ? 'Creating...' : createMode === 'import' ? 'Import & open' : 'Create & open'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}