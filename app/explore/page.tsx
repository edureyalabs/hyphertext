// app/explore/page.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/api';

interface ExploreProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface ExplorePage {
  id: string;
  title: string;
  html_content: string;
  updated_at: string;
  owner_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

function accentFromId(id: string): string {
  const palette = [
    '#C85A1A', '#1A5AC8', '#1A8A4A', '#6B3AC8',
    '#C81A6B', '#8A6A1A', '#1A7A8A', '#8A1A1A',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const wks   = Math.floor(days / 7);
  const mos   = Math.floor(days / 30);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  if (wks  < 5)  return `${wks}w ago`;
  if (mos  < 12) return `${mos}mo ago`;
  return `${Math.floor(mos / 12)}y ago`;
}

const PAGE_SIZE = 20;

export default function ExplorePage() {
  const [query, setQuery]           = useState('');
  const [profiles, setProfiles]     = useState<ExploreProfile[]>([]);
  const [pages, setPages]           = useState<ExplorePage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [searching, setSearching]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Infinite scroll state
  const [offset, setOffset]           = useState(0);
  const [hasMore, setHasMore]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef     = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const selectedPage = pages.find(p => p.id === selectedId) ?? null;
  const publishUrl   = selectedPage
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${selectedPage.id}`
    : '';

  const ownerInitials = (page: ExplorePage) =>
    (page.profiles?.display_name || page.profiles?.username || '?')[0].toUpperCase();

  // Initial / search fetch
  const fetchData = useCallback(async (q: string, reset = true) => {
    if (reset) setSearching(true);
    try {
      const res  = await fetch(`/api/explore?q=${encodeURIComponent(q)}&limit=${PAGE_SIZE}&offset=0`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      setPages(data.pages ?? []);
      setHasMore(data.hasMore ?? false);
      setOffset(data.pages?.length ?? 0);
      if (data.pages?.length > 0) setSelectedId(data.pages[0].id);
      else setSelectedId(null);
    } catch {
      // silent
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  // Load more for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || query.length > 0) return;
    setLoadingMore(true);
    try {
      const res  = await fetch(`/api/explore?q=&limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await res.json();
      setPages(prev => [...prev, ...(data.pages ?? [])]);
      setHasMore(data.hasMore ?? false);
      setOffset(prev => prev + (data.pages?.length ?? 0));
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, offset, query]);

  useEffect(() => {
    getSession().then(s => { if (s) setIsLoggedIn(true); });
    fetchData('');
  }, [fetchData]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { root: listRef.current, threshold: 0.1 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadMore]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(val), 400);
  };

  const handleCopyUrl = async () => {
    if (!publishUrl) return;
    await navigator.clipboard.writeText(publishUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }

        .site-card {
          padding: 0.75rem 1.1rem;
          border-bottom: 1px solid #f0ede8;
          cursor: pointer;
          transition: background 0.12s;
          border-left: 2px solid transparent;
          animation: fadeUp 0.22s ease both;
        }
        .site-card:hover { background: #faf9f7; }
        .site-card.selected { background: #f5f3ef; border-left-color: #111; }

        .action-btn {
          display: flex; align-items: center; gap: 0.3rem;
          background: transparent; border: 1px solid #e0ddd8; border-radius: 4px;
          padding: 0.22rem 0.55rem; font-size: 0.72rem; font-family: 'DM Sans', sans-serif;
          color: #666; cursor: pointer; transition: all 0.13s; white-space: nowrap;
          flex-shrink: 0; text-decoration: none;
        }
        .action-btn:hover { background: #fff; border-color: #bbb; color: #111; }

        .profile-card {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.65rem 0.85rem; background: #fff;
          border: 1px solid #e8e6e1; border-radius: 7px;
          text-decoration: none; transition: border-color 0.13s, box-shadow 0.13s;
        }
        .profile-card:hover { border-color: #ccc; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

        .search-input {
          width: 100%; border: 1px solid #e0ddd8; border-radius: 6px;
          padding: 0.6rem 0.9rem 0.6rem 2.4rem; font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif; font-weight: 300; color: #111;
          background: #fff; outline: none; transition: border-color 0.15s;
        }
        .search-input:focus { border-color: #111; }
        .search-input::placeholder { color: #888; }

        .scroll-panel { flex: 1; overflow-y: auto; }
        .scroll-panel::-webkit-scrollbar { width: 4px; }
        .scroll-panel::-webkit-scrollbar-thumb { background: #e8e6e1; border-radius: 2px; }
        .scroll-panel::-webkit-scrollbar-track { background: transparent; }

        .browser-wrap {
          display: flex; flex-direction: column;
          background: #fff; border-radius: 10px; overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08),
                      0 20px 56px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.07);
          animation: fadeIn 0.3s ease both;
          width: 100%; height: 100%;
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        height: '30px',
        background: '#fff',
        borderBottom: '1px solid #e8e6e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {isLoggedIn ? (
          <Link href="/dashboard/projects" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '5px',
            border: '1px solid #e8e6e1', background: 'transparent',
            color: '#666', textDecoration: 'none', transition: 'all 0.13s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ef'; (e.currentTarget as HTMLElement).style.borderColor = '#ccc'; (e.currentTarget as HTMLElement).style.color = '#111'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = '#e8e6e1'; (e.currentTarget as HTMLElement).style.color = '#666'; }}
          >
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ) : (
          <div style={{ width: '20px' }} />
        )}

        {!isLoggedIn && (
          <Link href="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: '#111', color: '#f8f7f4', border: 'none',
            borderRadius: '5px', padding: '0.22rem 0.65rem',
            fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400, textDecoration: 'none',
          }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Create site
          </Link>
        )}
        {isLoggedIn && <div style={{ width: '20px' }} />}
      </header>

      {/* ── Search bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e8e6e1',
        padding: '0.75rem 1.5rem',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: '520px', position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M12 12l-2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search people or sites…"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            autoFocus
          />
          {searching && (
            <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: Site list ── */}
        <aside style={{
          width: '280px',
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #ece9e4',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            padding: '0.65rem 1.1rem 0.6rem',
            borderBottom: '1px solid #ece9e4',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 10,
          }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.0rem', color: '#f16363', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>
              {query.length > 0 ? 'results' : 'recent sites'}
            </p>
          </div>

          <div ref={listRef} className="scroll-panel">

            {/* Profile results — only when searching */}
            {query.length > 0 && profiles.length > 0 && (
              <div style={{ padding: '0.75rem 1rem 0.5rem' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>people</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {profiles.map(p => (
                    <Link key={p.id} href={`/u/${p.username}`} className="profile-card">
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f5f3ef', border: '1px solid #e8e6e1', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.avatar_url
                          ? <img src={p.avatar_url} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#bbb' }}>{(p.display_name || p.username)[0].toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.display_name || `@${p.username}`}
                        </p>
                        <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb' }}>@{p.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {query.length > 0 && profiles.length > 0 && pages.length > 0 && (
              <div style={{ height: '1px', background: '#f0ede8', margin: '0.4rem 0' }} />
            )}

            {/* Sites section label when searching */}
            {query.length > 0 && pages.length > 0 && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0.6rem 1.1rem 0.2rem' }}>sites</p>
            )}

            {/* Loading skeletons */}
            {loading ? (
              <div style={{ padding: '0.75rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ height: '44px', background: '#f5f3ef', borderRadius: '5px', animation: `shimmer ${0.8 + i * 0.1}s ease infinite` }} />
                ))}
              </div>
            ) : pages.length === 0 ? (
              <div style={{ padding: '2.5rem 1.1rem', textAlign: 'center' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#ccc', margin: 0 }}>
                  {query.length > 0 ? 'no results' : 'no published sites yet'}
                </p>
              </div>
            ) : (
              <>
                {pages.map((page, idx) => {
                  const accent     = accentFromId(page.id);
                  const isSelected = selectedId === page.id;
                  return (
                    <div
                      key={page.id}
                      className={`site-card${isSelected ? ' selected' : ''}`}
                      onClick={() => setSelectedId(page.id)}
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        {/* Accent bar */}
                        <div style={{
                          width: '3px', minHeight: '34px', borderRadius: '2px',
                          background: isSelected ? accent : '#ece9e4',
                          flexShrink: 0, transition: 'background 0.2s', alignSelf: 'stretch',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: '0 0 0.2rem', fontSize: '0.85rem',
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? '#111' : '#222',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            letterSpacing: '-0.01em',
                          }}>{page.title}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {page.profiles?.username && (
                              <Link
                                href={`/u/${page.profiles.username}`}
                                onClick={e => e.stopPropagation()}
                                style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#999', textDecoration: 'none', transition: 'color 0.1s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#111')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#999')}
                              >
                                @{page.profiles.username}
                              </Link>
                            )}
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', color: '#ddd' }}>·</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb' }}>
                              {timeAgo(page.updated_at)}
                            </span>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: accent, flexShrink: 0, marginLeft: '0.1rem' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                  {loadingMore && (
                    <div style={{ width: '14px', height: '14px', border: '1.5px solid #e0ddd8', borderTopColor: '#999', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  )}
                  {!hasMore && pages.length > 0 && !loadingMore && (
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#ddd', margin: 0 }}>· end ·</p>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── RIGHT: Preview ── */}
        <div style={{
          flex: 1,
          background: '#e8e5e0',
          display: 'flex',
          overflow: 'hidden',
          padding: '1.5rem',
        }}>
          {!selectedPage ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', border: '1.5px dashed #d0cdc8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="6" stroke="#ccc" strokeWidth="1.2"/>
                  <path d="M16 16l-3-3" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#c0bdb8', margin: 0 }}>
                {query.length > 0 ? 'no results found' : 'select a site to preview'}
              </p>
            </div>
          ) : (
            <div className="browser-wrap">
              {/* Browser chrome */}
              <div style={{ height: '40px', minHeight: '40px', background: '#f5f3ef', borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', padding: '0 0.85rem', gap: '0.65rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
                </div>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e0ddd8', borderRadius: '5px', padding: '0.22rem 0.7rem', fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {publishUrl}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  {selectedPage.profiles?.username && (
                    <Link href={`/u/${selectedPage.profiles.username}`} className="action-btn">
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#f5f3ef', border: '1px solid #e8e6e1', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', fontFamily: "'DM Mono', monospace", color: '#bbb' }}>
                        {selectedPage.profiles.avatar_url
                          ? <img src={selectedPage.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : ownerInitials(selectedPage)
                        }
                      </div>
                      @{selectedPage.profiles.username}
                    </Link>
                  )}
                  <a href={publishUrl} target="_blank" rel="noopener noreferrer" className="action-btn">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M5.5 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8.5M8 1h5m0 0v5m0-5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Open
                  </a>
                  <button className="action-btn" onClick={handleCopyUrl} style={{ background: copied ? undefined : undefined, borderColor: copied ? '#2a9d5c' : undefined, color: copied ? '#2a9d5c' : undefined }}>
                    {copied ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#2a9d5c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M3 10H2a1 1 0 01-1-1V2a1 1 0 011-1h7a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        Copy URL
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Iframe */}
              <iframe
                key={selectedPage.id}
                src={publishUrl}
                style={{ flex: 1, border: 'none', display: 'block', background: '#fff', minHeight: 0, width: '100%', height: '100%' }}
                title={`Preview: ${selectedPage.title}`}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}