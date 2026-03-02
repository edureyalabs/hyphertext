// app/explore/page.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<ExploreProfile[]>([]);
  const [pages, setPages] = useState<ExplorePage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPage = pages.find(p => p.id === selectedId) ?? null;
  const publishUrl = selectedPage
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${selectedPage.id}`
    : '';

  const fetchData = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/explore?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      setPages(data.pages ?? []);
      if (data.pages?.length > 0) setSelectedId(data.pages[0].id);
      else setSelectedId(null);
    } catch {
      // silent
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData('');
  }, [fetchData]);

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

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const ownerInitials = (page: ExplorePage) =>
    (page.profiles?.display_name || page.profiles?.username || '?')[0].toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.9; } }

        .project-item {
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.6rem 1.1rem; cursor: pointer;
          border-left: 2px solid transparent;
          transition: background 0.1s, border-color 0.1s; user-select: none;
        }
        .project-item:hover { background: #faf9f7; }
        .project-item.selected { background: #f5f3ef; border-left-color: #111; }

        .action-btn {
          display: flex; align-items: center; gap: 0.3rem;
          background: transparent; border: 1px solid #e0ddd8; border-radius: 4px;
          padding: 0.22rem 0.55rem; font-size: 0.72rem; font-family: 'DM Sans', sans-serif;
          color: #666; cursor: pointer; transition: all 0.13s; white-space: nowrap;
          flex-shrink: 0; text-decoration: none;
        }
        .action-btn:hover { background: #fff; border-color: #bbb; color: #111; }

        .profile-card {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem 1rem; background: #fff;
          border: 1px solid #e8e6e1; border-radius: 8px;
          text-decoration: none; transition: border-color 0.13s, box-shadow 0.13s;
        }
        .profile-card:hover { border-color: #ccc; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

        .search-input {
          width: 100%; border: 1px solid #e0ddd8; border-radius: 6px;
          padding: 0.65rem 0.9rem 0.65rem 2.5rem; font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif; font-weight: 300; color: #111;
          background: #fff; outline: none; transition: border-color 0.15s;
        }
        .search-input:focus { border-color: #111; }
        .search-input::placeholder { color: #bbb; }

        .left-panel {
          width: 300px; min-width: 260px;
          background: #fff; border-right: 1px solid #ece9e4;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .project-list { flex: 1; overflow-y: auto; padding: 0.5rem 0; }
        .project-list::-webkit-scrollbar { width: 4px; }
        .project-list::-webkit-scrollbar-thumb { background: #e8e6e1; border-radius: 2px; }

        .right-panel { flex: 1; display: flex; background: #f0ede8; overflow: hidden; position: relative; }
        .browser-wrap {
          margin: auto; width: calc(100% - 3.5rem); height: calc(100% - 3.5rem);
          display: flex; flex-direction: column; background: #fff; border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 20px 56px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.07);
          animation: fadeIn 0.35s ease both;
        }
        .browser-chrome {
          height: 40px; min-height: 40px; background: #f5f3ef;
          border-bottom: 1px solid #e8e6e1; display: flex; align-items: center;
          padding: 0 0.85rem; gap: 0.65rem; flex-shrink: 0;
        }
        .traffic-lights { display: flex; gap: 5px; }
        .traffic-light { width: 10px; height: 10px; border-radius: 50%; }
        .address-bar {
          flex: 1; background: #fff; border: 1px solid #e0ddd8; border-radius: 5px;
          padding: 0.22rem 0.7rem; font-family: 'DM Mono', monospace; font-size: 0.68rem;
          color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .browser-iframe { flex: 1; border: none; display: block; background: #fff; min-height: 0; }
      `}</style>

      {/* Header */}
      <header style={{ height: '52px', background: '#fff', borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Hyphertext" width={26} height={26} style={{ borderRadius: '50%' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: '#111', letterSpacing: '0.01em' }}>hyphertext</span>
        </Link>
        <Link href="/dashboard/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'transparent', border: '1px solid #e8e6e1', borderRadius: '5px', padding: '0.32rem 0.75rem', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", color: '#777', textDecoration: 'none', transition: 'all 0.13s' }}>
          Dashboard
        </Link>
      </header>

      {/* Search bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e6e1', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '600px', position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M12 12l-2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search people or sites..."
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            autoFocus
          />
          {searching && (
            <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>
      </div>

      {/* Main split layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 52px - 65px)' }}>
        <aside className="left-panel">
          <div className="project-list">

            {/* Profile results — only when searching */}
            {query.length > 0 && profiles.length > 0 && (
              <div style={{ padding: '0.75rem 1rem 0.5rem' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.6rem' }}>people</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {profiles.map(p => (
                    <Link key={p.id} href={`/u/${p.username}`} className="profile-card">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f5f3ef', border: '1px solid #e8e6e1', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#bbb' }}>
                            {(p.display_name || p.username)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.display_name || `@${p.username}`}
                        </p>
                        <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb' }}>@{p.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Divider when both results exist */}
            {query.length > 0 && profiles.length > 0 && pages.length > 0 && (
              <div style={{ height: '1px', background: '#f0ede8', margin: '0.5rem 0' }} />
            )}

            {/* Pages list */}
            <div>
              {query.length > 0 && pages.length > 0 && (
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0.75rem 1rem 0.25rem' }}>sites</p>
              )}
              {query.length === 0 && (
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0.75rem 1rem 0.25rem' }}>recent sites</p>
              )}

              {loading ? (
                <div style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ height: '36px', background: '#f5f3ef', borderRadius: '4px', animation: `shimmer ${0.8 + i * 0.1}s ease infinite` }} />
                  ))}
                </div>
              ) : pages.length === 0 ? (
                <div style={{ padding: '2rem 1.1rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#ccc', margin: 0 }}>
                    {query.length > 0 ? 'no results' : 'no published sites yet'}
                  </p>
                </div>
              ) : (
                pages.map(page => (
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
                      {page.profiles?.avatar_url ? (
                        <img src={page.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }} />
                      ) : (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#bbb' }}>{ownerInitials(page)}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: '0 0 0.1rem', fontSize: '0.82rem',
                        fontWeight: selectedId === page.id ? 500 : 400,
                        color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{page.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {page.profiles?.username && (
                          <Link
                            href={`/u/${page.profiles.username}`}
                            onClick={e => e.stopPropagation()}
                            style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', textDecoration: 'none', transition: 'color 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#111')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
                          >
                            @{page.profiles.username}
                          </Link>
                        )}
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#ddd' }}>·</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#ccc' }}>{timeAgo(page.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="right-panel">
          {!selectedPage ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.5rem', color: '#ccc', textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.3 }}>
                <circle cx="14" cy="14" r="10" stroke="#999" strokeWidth="1.5"/>
                <path d="M22 22l6 6" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#ccc', margin: 0 }}>
                {query.length > 0 ? 'no results found' : 'select a site to preview'}
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
                <div className="address-bar">{publishUrl}</div>
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
                  <button className="action-btn" onClick={handleCopyUrl}>
                    {copied
                      ? <><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#2a9d5c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{ color: '#2a9d5c' }}>Copied</span></>
                      : <><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M3 10H2a1 1 0 01-1-1V2a1 1 0 011-1h7a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>Copy URL</>
                    }
                  </button>
                </div>
              </div>
              <iframe
                key={selectedPage.id}
                src={publishUrl}
                className="browser-iframe"
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