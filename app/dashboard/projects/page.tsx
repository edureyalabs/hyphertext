// app/dashboard/projects/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listPages, createPage, type Page } from '@/lib/api';
import { INITIAL_BOILERPLATE } from '@/lib/boilerplate';

export default function ProjectsPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedPage = pages.find(p => p.id === selectedId) ?? null;
  const publishUrl = selectedPage
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${selectedPage.id}`
    : '';

  useEffect(() => {
    listPages().then((data) => {
      setPages(data);
      if (data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError('');
    const { page, error } = await createPage(newTitle.trim(), INITIAL_BOILERPLATE);
    if (error || !page) {
      setCreateError(error ?? 'Failed to create page.');
      setCreating(false);
      return;
    }
    setCreating(false);
    setShowModal(false);
    setNewTitle('');
    router.push(`/studio/${page.id}`);
  };

  const handleCopyUrl = async () => {
    if (!publishUrl) return;
    await navigator.clipboard.writeText(publishUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 52px)' }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.9; } }

        /* ── LEFT PANEL ── */
        .left-panel {
          width: 260px;
          min-width: 220px;
          max-width: 300px;
          background: #fff;
          border-right: 1px solid #ece9e4;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          padding: 1.2rem 1.1rem 0.85rem;
          border-bottom: 1px solid #f0ede8;
          flex-shrink: 0;
        }

        .new-page-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          background: #111;
          color: #f8f7f4;
          border: none;
          padding: 0.55rem 0;
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 5px;
          transition: background 0.15s, transform 0.1s;
          margin-top: 0.85rem;
        }
        .new-page-btn:hover { background: #1f1f1f; transform: translateY(-1px); }
        .new-page-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .project-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem 0;
        }
        .project-list::-webkit-scrollbar { width: 4px; }
        .project-list::-webkit-scrollbar-track { background: transparent; }
        .project-list::-webkit-scrollbar-thumb { background: #e8e6e1; border-radius: 2px; }

        .project-item {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.6rem 1.1rem;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: background 0.1s, border-color 0.1s;
          user-select: none;
        }
        .project-item:hover { background: #faf9f7; }
        .project-item.selected {
          background: #f5f3ef;
          border-left-color: #111;
        }

        /* ── RIGHT PANEL ── */
        .right-panel {
          flex: 1;
          display: flex;
          background: #f0ede8;
          overflow: hidden;
          position: relative;
        }

        /* Browser window */
        .browser-wrap {
          margin: auto;
          width: calc(100% - 3.5rem);
          height: calc(100% - 3.5rem);
          display: flex;
          flex-direction: column;
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.04),
            0 8px 24px rgba(0,0,0,0.08),
            0 20px 56px rgba(0,0,0,0.06),
            inset 0 0 0 1px rgba(0,0,0,0.07);
          animation: fadeIn 0.35s ease both;
        }

        /* Browser chrome bar */
        .browser-chrome {
          height: 40px;
          min-height: 40px;
          background: #f5f3ef;
          border-bottom: 1px solid #e8e6e1;
          display: flex;
          align-items: center;
          padding: 0 0.85rem;
          gap: 0.65rem;
          flex-shrink: 0;
        }

        /* Traffic lights */
        .traffic-lights {
          display: flex;
          gap: 5px;
          flex-shrink: 0;
        }
        .traffic-light {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        /* Address bar */
        .address-bar {
          flex: 1;
          background: #fff;
          border: 1px solid #e0ddd8;
          border-radius: 5px;
          padding: 0.22rem 0.7rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.68rem;
          color: #888;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }

        /* Action buttons */
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: transparent;
          border: 1px solid #e0ddd8;
          border-radius: 4px;
          padding: 0.22rem 0.55rem;
          font-size: 0.72rem;
          font-family: 'DM Sans', sans-serif;
          color: #666;
          cursor: pointer;
          transition: all 0.13s;
          white-space: nowrap;
          flex-shrink: 0;
          text-decoration: none;
        }
        .action-btn:hover:not(.disabled) { background: #fff; border-color: #bbb; color: #111; }
        .action-btn.primary { background: #111; border-color: #111; color: #f8f7f4; }
        .action-btn.primary:hover { background: #222; border-color: #222; }
        .action-btn.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

        /* iframe */
        .browser-iframe {
          flex: 1;
          border: none;
          display: block;
          background: #fff;
          min-height: 0;
        }

        /* Empty state in right panel */
        .empty-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 0.5rem;
          color: #ccc;
          text-align: center;
        }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(5px);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .modal {
          background: #fff; border: 1px solid #e8e6e1;
          border-radius: 10px; padding: 2rem;
          width: 100%; max-width: 420px;
          animation: modalIn 0.2s ease both;
          box-shadow: 0 12px 48px rgba(0,0,0,0.12);
        }
        .modal-input {
          width: 100%; border: 1px solid #ddd; border-radius: 5px;
          padding: 0.7rem 0.9rem; font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif; font-weight: 300;
          color: #111; background: #fafaf9; outline: none;
          transition: border-color 0.15s; margin-top: 0.85rem;
        }
        .modal-input:focus { border-color: #111; }
        .modal-input::placeholder { color: #ccc; }
      `}</style>

      {/* ══════════════════════════════════════════
          LEFT PANEL — project list
      ══════════════════════════════════════════ */}
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

        <div className="project-list">
          {loading ? (
            <div style={{ padding: '1.5rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: '36px', background: '#f5f3ef', borderRadius: '4px', animation: `shimmer ${0.8 + i * 0.15}s ease infinite` }} />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <div style={{ padding: '2rem 1.1rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#ccc', margin: '0 0 0.4rem' }}>no pages yet</p>
              <p style={{ fontSize: '0.8rem', color: '#bbb', fontWeight: 300, margin: 0, lineHeight: 1.6 }}>Create your first page to get started.</p>
            </div>
          ) : (
            pages.map(page => (
              <div
                key={page.id}
                className={`project-item${selectedId === page.id ? ' selected' : ''}`}
                onClick={() => setSelectedId(page.id)}
              >
                {/* Small doc icon */}
                <div style={{
                  width: '28px', height: '34px', flexShrink: 0,
                  background: selectedId === page.id ? '#fff' : '#f5f3ef',
                  border: `1px solid ${selectedId === page.id ? '#e0ddd8' : '#ece9e4'}`,
                  borderRadius: '3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}>
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                    <rect x="1" y="1" width="10" height="12" rx="1.5" stroke="#ccc" strokeWidth="1"/>
                    <path d="M3 4.5h6M3 7h6M3 9.5h4" stroke="#ddd" strokeWidth="0.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: '0 0 0.15rem',
                    fontSize: '0.82rem',
                    fontWeight: selectedId === page.id ? 500 : 400,
                    color: '#111',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{page.title}</p>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.62rem',
                    color: page.is_published ? '#2a9d5c' : '#bbb',
                  }}>
                    {page.is_published ? '● live' : '○ draft'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Subtle divider handled by border-right on left panel */}

      {/* ══════════════════════════════════════════
          RIGHT PANEL — browser preview
      ══════════════════════════════════════════ */}
      <div className="right-panel">
        {!selectedPage ? (
          /* Nothing selected */
          <div className="empty-preview">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.3 }}>
              <rect x="2" y="5" width="28" height="22" rx="3" stroke="#999" strokeWidth="1.5"/>
              <path d="M2 10h28" stroke="#999" strokeWidth="1.5"/>
              <circle cx="6.5" cy="7.5" r="1" fill="#999"/>
              <circle cx="10" cy="7.5" r="1" fill="#999"/>
              <circle cx="13.5" cy="7.5" r="1" fill="#999"/>
            </svg>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#ccc', margin: 0 }}>
              {loading ? 'loading…' : 'select a page to preview'}
            </p>
          </div>
        ) : (
          <div className="browser-wrap">
            {/* ── Browser chrome ── */}
            <div className="browser-chrome">
              {/* Traffic lights */}
              <div className="traffic-lights">
                <div className="traffic-light" style={{ background: '#ff5f57' }} />
                <div className="traffic-light" style={{ background: '#febc2e' }} />
                <div className="traffic-light" style={{ background: '#28c840' }} />
              </div>

              {/* Address bar */}
              <div className="address-bar">
                {selectedPage.is_published
                  ? publishUrl
                  : `draft · not published`}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                {/* Edit → studio */}
                <button
                  className="action-btn primary"
                  onClick={() => router.push(`/studio/${selectedPage.id}`)}
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>

                {/* Open in new tab */}
                <a
                  href={selectedPage.is_published ? publishUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`action-btn${!selectedPage.is_published ? ' disabled' : ''}`}
                  title={!selectedPage.is_published ? 'Publish first to open' : 'Open in new tab'}
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M5.5 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8.5M8 1h5m0 0v5m0-5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Open
                </a>

                {/* Copy URL */}
                <button
                  className={`action-btn${!selectedPage.is_published ? ' disabled' : ''}`}
                  onClick={handleCopyUrl}
                  disabled={!selectedPage.is_published}
                  title={!selectedPage.is_published ? 'Publish first to copy link' : 'Copy link'}
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

            {/* ── iframe ── */}
            {selectedPage.is_published ? (
              <iframe
                key={selectedPage.id}
                src={publishUrl}
                className="browser-iframe"
                title={`Preview: ${selectedPage.title}`}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              /* Unpublished — show content + overlay nudge */
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <iframe
                  key={selectedPage.id}
                  srcDoc={selectedPage.html_content || ''}
                  className="browser-iframe"
                  style={{ width: '100%', height: '100%' }}
                  title={`Preview: ${selectedPage.title}`}
                  sandbox="allow-scripts allow-same-origin"
                />
                {/* Soft unpublished ribbon */}
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid #e8e6e1',
                  borderRadius: '100px',
                  padding: '0.35rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ccc', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#999' }}>draft · not published yet</span>
                  <button
                    onClick={() => router.push(`/studio/${selectedPage.id}`)}
                    style={{ background: '#111', color: '#f8f7f4', border: 'none', borderRadius: '100px', padding: '0.2rem 0.7rem', fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', marginLeft: '0.25rem' }}
                  >
                    Publish →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          NEW PAGE MODAL
      ══════════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>new page</p>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#111', margin: '0 0 0.2rem' }}>Name your project</h2>
            <p style={{ fontSize: '0.82rem', color: '#aaa', fontWeight: 300, margin: 0 }}>You can change this anytime in the studio.</p>
            <input
              className="modal-input"
              type="text"
              placeholder="e.g. Wedding Invite, My Portfolio, Product Landing…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowModal(false); }}
              autoFocus
            />
            {createError && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#e05252', marginTop: '0.5rem' }}>{createError}</p>
            )}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModal(false); setCreateError(''); setNewTitle(''); }}
                style={{ background: 'transparent', border: '1px solid #ddd', color: '#777', padding: '0.55rem 1rem', borderRadius: '4px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.12s' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                style={{ background: '#111', color: '#f8f7f4', border: 'none', padding: '0.55rem 1.2rem', borderRadius: '4px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: (!newTitle.trim() || creating) ? 0.4 : 1, transition: 'opacity 0.12s' }}
              >
                {creating ? 'Creating…' : 'Create & open →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}