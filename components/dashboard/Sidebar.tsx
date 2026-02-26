'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  user: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace('/');
  };

  const navItems = [
    {
      href: '/dashboard/projects',
      label: 'Projects',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      ),
    },
    {
      href: '/dashboard/account',
      label: 'Account',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: '#fff',
      borderRight: '1px solid #e8e6e1',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      <style>{`
        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 1rem;
          font-size: 0.875rem;
          font-weight: 400;
          color: #777;
          text-decoration: none;
          border-radius: 4px;
          margin: 0 0.5rem;
          transition: background 0.12s, color 0.12s;
          letter-spacing: 0.01em;
        }
        .sidebar-nav-item:hover { background: #f8f7f4; color: #111; }
        .sidebar-nav-item.active { background: #f0ede8; color: #111; font-weight: 500; }

        .signout-btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: transparent;
          color: #bbb;
          border: none;
          padding: 0.55rem 1rem;
          font-size: 0.82rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          cursor: pointer;
          border-radius: 4px;
          margin: 0 0.5rem;
          width: calc(100% - 1rem);
          text-align: left;
          transition: color 0.12s, background 0.12s;
          letter-spacing: 0.01em;
        }
        .signout-btn:hover { color: #111; background: #f8f7f4; }
        .signout-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* Logo */}
      <Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '1.2rem 1.25rem',
        textDecoration: 'none',
        borderBottom: '1px solid #f0ede8',
        marginBottom: '0.5rem',
      }}>
        <Image src="/logo.png" alt="Hyphertext" width={26} height={26} style={{ borderRadius: '50%' }} />
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.82rem',
          color: '#111',
          letterSpacing: '0.01em',
        }}>
          hyphertext
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: '0.25rem' }}>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-nav-item${pathname === item.href || pathname.startsWith(item.href + '/') ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom: user info + sign out */}
      <div style={{
        borderTop: '1px solid #f0ede8',
        padding: '0.75rem 0',
      }}>
        <div style={{
          padding: '0.4rem 1.25rem 0.75rem',
          fontSize: '0.75rem',
          color: '#bbb',
          fontWeight: 300,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user?.email}
        </div>
        <button onClick={handleSignOut} disabled={signingOut} className="signout-btn">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}