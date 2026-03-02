// app/u/[username]/page.tsx
'use client';
import { useState, useEffect } from 'react';
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
  html_content: string;
  is_published: boolean;
  hosting_status: string;
  page_source: string;
  created_at: string;
  updated_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = (params.username as string)?.toLowerCase();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pages, setPages] = useState<PublicPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedPage = pages.find(p => p.id === selectedId) ?? null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publishUrl = selectedPage ? `${origin}/p/${selectedPage.id}` : '';

  useEffect(() => {
    getSession().then(session => {
      if (session) setViewerUserId(session.user.id);
    });

    fetch(`/api/profiles/${username}`)
      .then(res => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setProfile(data.profile);
        setPages(data.pages ?? []);
        if (data.pages?.length > 0) setSelectedId(data.pages[0].id);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [username]);

  const isOwner = !!(viewerUserId && profile && viewerUserId === profile.id);

  const handleCopyUrl = async () => {
    if (!publishUrl) return;
    await navigator.clipboard.writeText(publishUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  const initials = (profile?.display_name || profile?.username || '?')[0].toUpperCase();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", gap: '1rem' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');`}</style>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#bbb' }}>@{username}</p>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 300, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Profile not found</h1>
        <Link href="/explore" style={{ fontSize: '0.82rem', color: '#888', textDecoration: 'none', borderBottom: '1px solid #ddd' }}>Browse explore</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

        .left-panel {
          width: 260px; min-width: 220px; max-width: 300px;
          background: #fff; border-right: 1px solid #ece9e4;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .panel-header {
          padding: 1.2rem 1.1rem 0.85rem;
          border-bottom: 1px solid #f0ede8; flex-shrink: 0;
        }
        .project-list { flex: 1; overflow-y: auto; padding: 0.5rem 0; }
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
          flex: 1; display: flex; background: #f0ede8;
          overflow: hidden; position: relative;
        }
        .browser-wrap {
          margin: auto;
          width: calc(100% - 3.5rem); height: calc(100% - 3.5rem);
          display: flex; flex-direction: column;
          background: #fff; border-radius: 10px; overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 20px 56px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.07);
          animation: fadeIn 0.35s ease both;
        }
        .browser-chrome {
          height: 40px; min-height: 40px; background: #f5f3ef;
          border-bottom: 1px solid #e8e6e1;
          display: flex; align-items: center;
          padding: 0 0.85rem; gap: 0.65rem; flex-shrink: 0;
        }
        .traffic-lights { display: flex; gap: 5px; flex-shrink: 0; }
        .traffic-light  { width: 10px; height: 10px; border-radius: 50%; }
        .address-bar {
          flex: 1; background: #fff; border: 1px solid #e0ddd8; border-radius: 5px;
          padding: 0.22rem 0.7rem; font-family: 'DM Mono', monospace; font-size: 0.68rem;
          color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .browser-iframe { flex: 1; border: none; display: block; background: #fff; min-height: 0; }

        .action-btn {
          display: flex; align-items: center; gap: 0.3rem;
          background: transparent; border: 1px solid #e0ddd8; border-radius: 4px;
          padding: 0.22rem 0.55rem; font-size: 0.72rem; font-family: 'DM Sans', sans-serif;
          color: #666; cursor: pointer; transition: all 0.13s; white-space: nowrap;
          flex-shrink: 0; text-decoration: none;
        }
        .action-btn:hover { background: #fff; border-color: #bbb; color: #111; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 0.45rem;
          background: transparent; border: 1px solid #e8e6e1; border-radius: 5px;
          padding: 0.32rem 0.75rem; font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif; font-weight: 400; color: #777;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.13s, color 0.13s, background 0.13s;
        }
        .back-btn:hover { border-color: #ccc; color: #111; background: #fff; }
      `}</style>

      {/* Header */}
      <header style={{ height: '52px', background: '#fff', borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Hyphertext" width={26} height={26} style={{ borderRadius: '50%' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: '#111', letterSpacing: '0.01em' }}>hyphertext</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isOwner && (
            <Link href="/account" className="back-btn">Edit profile</Link>
          )}
          <Link href="/explore" className="back-btn">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10 10l-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Explore
          </Link>
        </div>
      </header>

      {/* Profile strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e6e1', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #e8e6e1', flexShrink: 0, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.1rem', color: '#bbb' }}>{initials}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500, color: '#111', letterSpacing: '-0.01em' }}>
              {profile?.display_name || `@${profile?.username}`}
            </h1>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#bbb' }}>
              @{profile?.username}
            </span>
          </div>
          {profile?.bio && (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#666', fontWeight: 300, lineHeight: 1.5 }}>
              {profile.bio}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.3rem' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#bbb' }}>
              {pages.length} site{pages.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#bbb' }}>
              joined {joinedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Split layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 52px - 85px)' }}>
        <aside className="left-panel">
          <div className="panel-header">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>sites</p>
            <h2 style={{ fontSize: '1rem', fontWeight: 400, letterSpacing: '-0.02em', margin: 0, color: '#111' }}>
              {profile?.display_name ? `${profile.display_name}'s sites` : `@${profile?.username}'s sites`}
            </h2>
          </div>
          <div className="project-list">
            {pages.length === 0 ? (
              <div style={{ padding: '2rem 1.1rem', textAlign: 'center' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#ccc', margin: '0 0 0.4rem' }}>no published sites</p>
                <p style={{ fontSize: '0.8rem', color: '#bbb', fontWeight: 300, margin: 0, lineHeight: 1.6 }}>This user hasn&apos;t published anything yet.</p>
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
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                      <rect x="1" y="1" width="10" height="12" rx="1.5" stroke="#ccc" strokeWidth="1"/>
                      <path d="M3 4.5h6M3 7h6M3 9.5h4" stroke="#ddd" strokeWidth="0.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 0.15rem', fontSize: '0.82rem',
                      fontWeight: selectedId === page.id ? 500 : 400,
                      color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {page.title}
                    </p>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#2a9d5c' }}>
                      {'● live'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="right-panel">
          {!selectedPage ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.5rem', color: '#ccc', textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.3 }}>
                <rect x="2" y="5" width="28" height="22" rx="3" stroke="#999" strokeWidth="1.5"/>
                <path d="M2 10h28" stroke="#999" strokeWidth="1.5"/>
                <circle cx="6.5" cy="7.5" r="1" fill="#999"/>
                <circle cx="10" cy="7.5" r="1" fill="#999"/>
                <circle cx="13.5" cy="7.5" r="1" fill="#999"/>
              </svg>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#ccc', margin: 0 }}>
                no sites to preview
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
                  <a
                    href={publishUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn"
                  >
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M5.5 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8.5M8 1h5m0 0v5m0-5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Open
                  </a>
                  <button className="action-btn" onClick={handleCopyUrl}>
                    {copied ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7l4 4 6-6" stroke="#2a9d5c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{ color: '#2a9d5c' }}>Copied</span>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                          <rect x="4" y="4" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M3 10H2a1 1 0 01-1-1V2a1 1 0 011-1h7a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        Copy URL
                      </span>
                    )}
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