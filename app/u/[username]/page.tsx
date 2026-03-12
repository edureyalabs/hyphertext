'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/api';

interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface PublicPage {
  id: string;
  title: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  hosting_status: string;
  page_source: string;
  show_on_profile: boolean;
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
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  if (wks < 5)   return `${wks}w ago`;
  if (mos < 12)  return `${mos}mo ago`;
  return `${Math.floor(mos / 12)}y ago`;
}

const PAGE_SIZE = 10;

export default function UserProfilePage() {
  const params   = useParams();
  const username = (params.username as string)?.toLowerCase();

  const [profile, setProfile]           = useState<PublicProfile | null>(null);
  const [pages, setPages]               = useState<PublicPage[]>([]);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [urlCopied, setUrlCopied]       = useState(false);

  const [offset, setOffset]         = useState(0);
  const [hasMore, setHasMore]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal]           = useState(0);

  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editTitle, setEditTitle]         = useState('');
  const [editCaption, setEditCaption]     = useState('');
  const [editExpanded, setEditExpanded]   = useState<Record<string, boolean>>({});
  const [saving, setSaving]               = useState(false);
  const [hidingId, setHidingId]           = useState<string | null>(null);

  const listRef     = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const selectedPage = pages.find(p => p.id === selectedId) ?? null;
  const origin       = typeof window !== 'undefined' ? window.location.origin : '';
  const publishUrl   = selectedPage ? `${origin}/p/${selectedPage.id}` : '';
  const isOwner      = !!(viewerUserId && profile && viewerUserId === profile.id);

  useEffect(() => {
    getSession().then(s => {
      if (s) {
        setViewerUserId(s.user.id);
        setIsLoggedIn(true);
      }
    });

    fetch(`/api/profiles/${username}?offset=0`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setProfile(data.profile);
        setPages(data.pages ?? []);
        setTotal(data.total ?? 0);
        setHasMore(data.hasMore ?? false);
        setOffset(PAGE_SIZE);
        if (data.pages?.length > 0) setSelectedId(data.pages[0].id);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const res  = await fetch(`/api/profiles/${username}?offset=${offset}`);
    const data = await res.json();
    setPages(prev => [...prev, ...(data.pages ?? [])]);
    setHasMore(data.hasMore ?? false);
    setOffset(prev => prev + PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, offset, username]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { threshold: 0.1 });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadMore]);

  const handleCopyUrl = async () => {
    if (!publishUrl) return;
    await navigator.clipboard.writeText(publishUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const startEdit = (page: PublicPage) => {
    setEditingId(page.id);
    setEditTitle(page.title);
    setEditCaption(page.caption ?? '');
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async () => {
    if (!editingId || !viewerUserId) return;
    setSaving(true);
    const res = await fetch(`/api/profiles/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId: editingId,
        title: editTitle,
        caption: editCaption || null,
        userId: viewerUserId,
      }),
    });
    const data = await res.json();
    if (data.page) {
      setPages(prev => prev.map(p =>
        p.id === editingId
          ? { ...p, title: data.page.title, caption: data.page.caption }
          : p
      ));
    }
    setSaving(false);
    setEditingId(null);
  };

  const handleHideFromProfile = async (pageId: string) => {
    if (!viewerUserId) return;
    setHidingId(pageId);
    const res = await fetch(`/api/profiles/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, show_on_profile: false, userId: viewerUserId }),
    });
    const data = await res.json();
    if (data.page) {
      setPages(prev => prev.filter(p => p.id !== pageId));
      setTotal(t => t - 1);
      if (selectedId === pageId) {
        const remaining = pages.filter(p => p.id !== pageId);
        setSelectedId(remaining[0]?.id ?? null);
      }
    }
    setHidingId(null);
  };

  const toggleCaptionExpand = (id: string) =>
    setEditExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';
  const initials = (profile?.display_name || profile?.username || '?')[0].toUpperCase();

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", gap: '1rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');`}</style>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#bbb' }}>@{username}</p>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 300, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Profile not found</h1>
      <Link href="/explore" style={{ fontSize: '0.82rem', color: '#888', textDecoration: 'none', borderBottom: '1px solid #ddd' }}>Browse explore</Link>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }

        .site-card {
          padding: 0.95rem 1.1rem;
          border-bottom: 1px solid #f0ede8;
          cursor: pointer;
          transition: background 0.12s;
          position: relative;
          animation: fadeUp 0.25s ease both;
          border-left: 2px solid transparent;
        }
        .site-card:hover { background: #faf9f7; }
        .site-card.selected {
          background: #f5f3ef;
          border-left-color: #111;
        }

        .action-btn {
          display: flex; align-items: center; gap: 0.3rem;
          background: transparent; border: 1px solid #e0ddd8; border-radius: 4px;
          padding: 0.22rem 0.55rem; font-size: 0.72rem; font-family: 'DM Sans', sans-serif;
          color: #666; cursor: pointer; transition: all 0.13s; white-space: nowrap;
          flex-shrink: 0; text-decoration: none;
        }
        .action-btn:hover { background: #fff; border-color: #bbb; color: #111; }
        .action-btn.copied { border-color: #2a9d5c; color: #2a9d5c; }

        .owner-btn {
          background: none; border: none; cursor: pointer; padding: 0.2rem 0.3rem;
          border-radius: 3px; color: #ccc; font-size: 0.68rem;
          font-family: 'DM Mono', monospace; transition: color 0.12s, background 0.12s;
          display: flex; align-items: center; gap: 0.25rem;
        }
        .owner-btn:hover { color: #555; background: #f0ede8; }
        .owner-btn.danger:hover { color: #e05252; background: #fff5f5; }

        .edit-input {
          width: 100%; border: 1px solid #ddd; border-radius: 4px;
          padding: 0.45rem 0.65rem; font-size: 0.82rem;
          font-family: 'DM Sans', sans-serif; font-weight: 300;
          color: #111; background: #fff; outline: none;
          transition: border-color 0.15s;
        }
        .edit-input:focus { border-color: #111; }

        .edit-textarea {
          width: 100%; border: 1px solid #ddd; border-radius: 4px;
          padding: 0.45rem 0.65rem; font-size: 0.78rem;
          font-family: 'DM Sans', sans-serif; font-weight: 300;
          color: #333; background: #fff; outline: none; resize: none;
          transition: border-color 0.15s; line-height: 1.5;
        }
        .edit-textarea:focus { border-color: #111; }

        .save-btn {
          background: #111; color: #f8f7f4; border: none;
          padding: 0.38rem 0.85rem; border-radius: 4px; font-size: 0.78rem;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.12s;
        }
        .save-btn:hover { background: #333; }
        .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .cancel-btn {
          background: transparent; color: #999; border: 1px solid #e0ddd8;
          padding: 0.38rem 0.75rem; border-radius: 4px; font-size: 0.78rem;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.12s;
        }
        .cancel-btn:hover { border-color: #bbb; color: #555; }

        .scroll-panel::-webkit-scrollbar { width: 4px; }
        .scroll-panel::-webkit-scrollbar-thumb { background: #e0ddd8; border-radius: 2px; }
        .scroll-panel::-webkit-scrollbar-track { background: transparent; }

        .browser-wrap {
          display: flex; flex-direction: column;
          background: #fff; border-radius: 10px; overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08),
                      0 20px 56px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.07);
          animation: fadeIn 0.3s ease both;
          height: 100%;
        }

        .expand-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 0.6rem;
          color: #aaa; padding: 0; margin-top: 0.2rem;
          display: inline-block; transition: color 0.12s;
        }
        .expand-btn:hover { color: #555; }

        .nav-pill {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.32rem 0.8rem; border-radius: 100px;
          font-size: 0.78rem; font-family: 'DM Sans', sans-serif;
          font-weight: 400; cursor: pointer; text-decoration: none;
          transition: all 0.15s; white-space: nowrap;
        }
        .nav-pill.ghost {
          background: transparent; border: 1px solid #e0ddd8; color: #666;
        }
        .nav-pill.ghost:hover { border-color: #bbb; color: #111; background: #fff; }
        .nav-pill.filled {
          background: #111; border: 1px solid #111; color: #f8f7f4;
        }
        .nav-pill.filled:hover { background: #333; border-color: #333; }

        .about-panel::-webkit-scrollbar { width: 3px; }
        .about-panel::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        height: '44px',
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
        {/* Left: back arrow icon only */}
        {isLoggedIn ? (
          <Link href="/dashboard/projects" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '22px', height: '22px', borderRadius: '5px',
            border: '1px solid #e8e6e1', background: 'transparent',
            color: '#666', textDecoration: 'none', transition: 'all 0.13s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ef'; (e.currentTarget as HTMLElement).style.borderColor = '#ccc'; (e.currentTarget as HTMLElement).style.color = '#111'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = '#e8e6e1'; (e.currentTarget as HTMLElement).style.color = '#666'; }}
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ) : (
          <div style={{ width: '30px' }} />
        )}

        {/* Right: create site for logged out */}
        {!isLoggedIn && (
          <Link href="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: '#111', color: '#f8f7f4', border: 'none',
            borderRadius: '5px', padding: '0.28rem 0.7rem',
            fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400, textDecoration: 'none', letterSpacing: '0.01em',
            transition: 'background 0.13s',
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Create site
          </Link>
        )}
        {isLoggedIn && <div style={{ width: '30px' }} />}
      </header>

      {/* ── Profile header strip ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e8e6e1',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        flexShrink: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          overflow: 'hidden', border: '2px solid #e8e6e1',
          flexShrink: 0, background: '#f0ede8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.1rem', color: '#999', fontWeight: 400 }}>{initials}</span>
          }
        </div>

        {/* Name + bio */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#111', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {profile?.display_name || `@${profile?.username}`}
            </h1>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#999', background: '#f5f3ef', padding: '0.1rem 0.5rem', borderRadius: '100px' }}>
              @{profile?.username}
            </span>
          </div>
          {profile?.bio && (
            <p style={{
              margin: 0, fontSize: '0.82rem', color: '#555', fontWeight: 300,
              lineHeight: 1.55, whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', maxWidth: '500px',
            }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* Sites count */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: '#111', borderRadius: '8px', padding: '0.55rem 1.1rem',
            minWidth: '64px',
          }}>
            <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '1.15rem', fontWeight: 500, color: '#f8f7f4', letterSpacing: '-0.03em', lineHeight: 1 }}>{total}</p>
            <p style={{ margin: '0.2rem 0 0', fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>sites</p>
          </div>

          <div style={{ width: '1px', height: '32px', background: '#e8e6e1', margin: '0 0.25rem' }} />

          {/* Joined */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0.25rem 0.5rem' }}>
            <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#45c23a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>joined</p>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 400, color: '#333', letterSpacing: '-0.01em' }}>{joinedDate}</p>
          </div>
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: iframe + about section (65%) ── */}
        <div style={{
          flex: '0 0 65%',
          background: '#e8e5e0',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.5rem 1.25rem 1.5rem 1.5rem',
          gap: '0.75rem',
        }}>
          {!selectedPage ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', border: '1.5px dashed #d0cdc8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="12" rx="2" stroke="#ccc" strokeWidth="1.2"/>
                  <path d="M2 8h16" stroke="#ccc" strokeWidth="1.2"/>
                  <circle cx="5" cy="6" r="0.8" fill="#ccc"/>
                  <circle cx="7.5" cy="6" r="0.8" fill="#ccc"/>
                </svg>
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#c0bdb8', margin: 0 }}>
                {pages.length === 0 ? 'no published sites yet' : 'select a site to preview'}
              </p>
            </div>
          ) : (
            <>
              {/* Iframe in browser chrome — fixed portion */}
              <div className="browser-wrap" style={{ height: '520px', flexShrink: 0 }}>
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
                    <a href={publishUrl} target="_blank" rel="noopener noreferrer" className="action-btn">
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                        <path d="M5.5 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8.5M8 1h5m0 0v5m0-5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Open
                    </a>
                    <button className={`action-btn${urlCopied ? ' copied' : ''}`} onClick={handleCopyUrl}>
                      {urlCopied ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#2a9d5c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span style={{ color: '#2a9d5c' }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M3 10H2a1 1 0 01-1-1V2a1 1 0 011-1h7a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          Copy URL
                        </>
                      )}
                    </button>
                    {isOwner && (
                      <Link href={`/studio/${selectedPage.id}`} className="action-btn">
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                          <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit
                      </Link>
                    )}
                  </div>
                </div>

                {/* Iframe — fills available space */}
                <iframe
                  key={selectedPage.id}
                  src={publishUrl}
                  style={{ flex: 1, border: 'none', display: 'block', background: '#fff', minHeight: 0, width: '100%', height: '100%' }}
                  title={`Preview: ${selectedPage.title}`}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* About this site — separate card BELOW the iframe */}
              {selectedPage.caption && (
                <div style={{
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  flexShrink: 0,
                  animation: 'fadeIn 0.25s ease both',
                }}>
                  <div style={{ padding: '0.65rem 1rem 0.5rem', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="#999" strokeWidth="1.2"/>
                      <path d="M7 6v4M7 4.5v.5" stroke="#999" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#e8824a', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>about this site</p>
                  </div>
                  <div style={{ padding: '0.65rem 1rem 0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#444', fontWeight: 300, lineHeight: 1.65 }}>
                      {selectedPage.caption}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT: Scrollable site list (35%) ── */}
        <div
          ref={listRef}
          className="scroll-panel"
          style={{ flex: '0 0 35%', background: '#fff', borderLeft: '1px solid #e8e6e1', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        >
          {/* List header */}
          <div style={{
            padding: '0.75rem 1.1rem',
            borderBottom: '1px solid #ece9e4',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 10,
          }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>published work</p>
          </div>

          {/* Empty state */}
          {pages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center', gap: '0.6rem' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#ccc', margin: 0 }}>no published sites yet</p>
              <p style={{ fontSize: '0.78rem', color: '#bbb', fontWeight: 300, margin: 0, lineHeight: 1.6 }}>
                {isOwner ? 'Publish your first site from the studio.' : 'Check back later.'}
              </p>
              {isOwner && (
                <Link href="/dashboard/projects" style={{ marginTop: '0.5rem', background: '#111', color: '#f8f7f4', padding: '0.45rem 1rem', borderRadius: '4px', fontSize: '0.78rem', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                  Go to dashboard →
                </Link>
              )}
            </div>
          )}

          {/* Site cards */}
          {pages.map((page, idx) => {
            const accent    = accentFromId(page.id);
            const isSelected = selectedId === page.id;
            const isEditing  = editingId === page.id;
            const captionExpanded = editExpanded[page.id];
            const hasLongCaption  = (page.caption?.length ?? 0) > 120;

            return (
              <div
                key={page.id}
                className={`site-card${isSelected ? ' selected' : ''}`}
                onClick={() => !isEditing && setSelectedId(page.id)}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  {/* Accent bar */}
                  <div style={{
                    width: '3px', minHeight: '36px', borderRadius: '2px',
                    background: isSelected ? accent : '#ece9e4',
                    flexShrink: 0, transition: 'background 0.2s', alignSelf: 'stretch',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.3rem' }}>site name</p>
                          <input className="edit-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Site name" />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>caption</p>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: editCaption.length > 900 ? '#e05252' : '#ccc' }}>
                              {editCaption.length}/1000
                            </span>
                          </div>
                          <textarea className="edit-textarea" value={editCaption} onChange={e => setEditCaption(e.target.value.slice(0, 1000))} placeholder="What's this site about? (optional)" rows={3} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button className="cancel-btn" onClick={e => { e.stopPropagation(); cancelEdit(); }}>Cancel</button>
                          <button className="save-btn" onClick={e => { e.stopPropagation(); saveEdit(); }} disabled={saving || !editTitle.trim()}>
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <p style={{
                            margin: 0, fontSize: '0.88rem',
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? '#111' : '#222',
                            lineHeight: 1.3, letterSpacing: '-0.01em', flex: 1, minWidth: 0,
                          }}>
                            {page.title}
                          </p>
                          {isOwner && (
                            <div style={{ display: 'flex', gap: '0.15rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                              <button className="owner-btn" onClick={() => startEdit(page)} title="Edit caption & name">
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M8 1.5l2.5 2.5-7 7H1V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button className="owner-btn danger" onClick={() => handleHideFromProfile(page.id)} disabled={hidingId === page.id} title="Hide from profile">
                                {hidingId === page.id
                                  ? <span style={{ fontSize: '0.6rem' }}>…</span>
                                  : <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                      <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.1"/>
                                      <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
                                      <path d="M1 1l10 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                    </svg>
                                }
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Caption preview */}
                        {page.caption && (
                          <div style={{ marginTop: '0.3rem' }}>
                            <p style={{
                              margin: 0, fontSize: '0.75rem', color: '#777',
                              fontWeight: 300, lineHeight: 1.55,
                              ...(captionExpanded || !hasLongCaption ? {} : {
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              } as any),
                            }}>
                              {page.caption}
                            </p>
                            {hasLongCaption && (
                              <button className="expand-btn" onClick={e => { e.stopPropagation(); toggleCaptionExpand(page.id); }}>
                                {captionExpanded ? 'less ↑' : 'more ↓'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Meta row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: accent, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#999' }}>
                            {timeAgo(page.created_at)}
                          </span>
                          {page.page_source === 'import' && (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#aaa', background: '#f5f3ef', border: '1px solid #ece9e4', padding: '0.05rem 0.4rem', borderRadius: '3px' }}>
                              imported
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            {loadingMore && (
              <div style={{ width: '16px', height: '16px', border: '1.5px solid #e0ddd8', borderTopColor: '#999', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            )}
            {!hasMore && pages.length > 0 && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#ddd', margin: 0 }}>· end ·</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}