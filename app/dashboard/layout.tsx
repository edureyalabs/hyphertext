// app/dashboard/layout.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSession, signOut, type ApiUser } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.replace('/auth');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const initials = user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }

        .header-nav-link {
          font-size: 0.8rem;
          font-weight: 400;
          color: #999;
          text-decoration: none;
          padding: 0.3rem 0.65rem;
          border-radius: 4px;
          transition: color 0.12s, background 0.12s;
          letter-spacing: 0.01em;
        }
        .header-nav-link:hover { color: #111; background: #f0ede8; }
        .header-nav-link.active { color: #111; background: #ede9e3; font-weight: 500; }

        .account-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid #e8e6e1;
          border-radius: 6px;
          padding: 0.28rem 0.55rem 0.28rem 0.32rem;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .account-btn:hover { border-color: #ccc; background: #faf9f7; }
        .account-btn.open { border-color: #bbb; background: #faf9f7; }

        .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #111;
          color: #f8f7f4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 500;
          font-family: 'DM Mono', monospace;
          flex-shrink: 0;
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 7px);
          right: 0;
          background: #fff;
          border: 1px solid #e8e6e1;
          border-radius: 8px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04);
          min-width: 216px;
          overflow: hidden;
          animation: dropIn 0.15s ease both;
          z-index: 200;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-5px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.65rem 1rem;
          font-size: 0.82rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          color: #444;
          background: transparent;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.1s, color 0.1s;
          letter-spacing: 0.01em;
          text-align: left;
        }
        .dropdown-item:hover { background: #f8f7f4; color: #111; }
        .dropdown-item.signout { color: #aaa; border-top: 1px solid #f0ede8; }
        .dropdown-item.signout:hover { background: #fdf5f5; color: #c0392b; }
        .dropdown-item:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        height: '52px',
        background: '#fff',
        borderBottom: '1px solid #e8e6e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Hyphertext" width={26} height={26} style={{ borderRadius: '50%' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: '#111', letterSpacing: '0.01em' }}>hyphertext</span>
        </Link>

        {/* Center nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <Link
            href="/dashboard/projects"
            className={`header-nav-link${pathname?.startsWith('/dashboard/projects') ? ' active' : ''}`}
          >
            Projects
          </Link>
        </nav>

        {/* Account dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className={`account-btn${accountOpen ? ' open' : ''}`}
            onClick={() => setAccountOpen(v => !v)}
            aria-label="Account menu"
          >
            <div className="avatar">{initials}</div>
            <span style={{
              fontSize: '0.78rem',
              color: '#555',
              maxWidth: '130px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.email?.split('@')[0]}
            </span>
            <svg
              width="10" height="6" viewBox="0 0 10 6" fill="none"
              style={{ color: '#bbb', flexShrink: 0, transition: 'transform 0.15s', transform: accountOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {accountOpen && (
            <div className="dropdown">
              {/* Email header */}
              <div style={{ padding: '0.75rem 1rem 0.65rem', borderBottom: '1px solid #f0ede8' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#ccc', margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>signed in as</p>
                <p style={{ fontSize: '0.79rem', color: '#555', margin: 0, fontWeight: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              </div>

              <Link
                href="/account"
                className="dropdown-item"
                onClick={() => setAccountOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Account settings
              </Link>

              <button
                className="dropdown-item signout"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}