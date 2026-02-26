'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f7f4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '1.5px solid #ddd',
          borderTopColor: '#111',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f7f4',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      color: '#111',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .signout-btn {
          background: transparent;
          color: #888;
          border: 1px solid #ddd;
          padding: 0.45rem 1rem;
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 3px;
          transition: border-color 0.15s, color 0.15s;
        }
        .signout-btn:hover { border-color: #999; color: #111; }
        .signout-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .create-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #111;
          color: #f8f7f4;
          border: none;
          padding: 0.7rem 1.4rem;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 3px;
          transition: background 0.15s, transform 0.1s;
          text-decoration: none;
        }
        .create-btn:hover { background: #222; transform: translateY(-1px); }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(248,247,244,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e8e6e1',
        padding: '0 2rem',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Hyphertext" width={28} height={28} style={{ borderRadius: '50%' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#111' }}>
            hyphertext
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 300 }}>
            {user?.email}
          </span>
          <button onClick={handleSignOut} disabled={signingOut} className="signout-btn">
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '5rem 2rem',
        animation: 'fadeIn 0.5s ease both',
      }}>

        {/* Greeting */}
        <div style={{ marginBottom: '4rem' }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.72rem',
            color: '#aaa',
            letterSpacing: '0.06em',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
          }}>
            dashboard
          </p>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
            fontWeight: 300,
            letterSpacing: '-0.025em',
            margin: '0 0 0.5rem',
            lineHeight: 1.2,
          }}>
            What will you build today?
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#888',
            fontWeight: 300,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Describe it in plain English. Your page will be live in seconds.
          </p>
        </div>

        {/* Empty state / CTA */}
        <div style={{
          background: '#fff',
          border: '1px solid #e8e6e1',
          borderRadius: '6px',
          padding: '4rem 2rem',
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#111',
            margin: '0 auto 1.5rem',
            overflow: 'hidden',
          }}>
            <Image src="/logo.png" alt="Hyphertext" width={40} height={40} style={{ borderRadius: '50%' }} />
          </div>

          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.78rem',
            color: '#ccc',
            margin: '0 0 0.75rem',
          }}>
            no pages yet
          </p>

          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem',
          }}>
            Your canvas is empty.
          </h2>

          <p style={{
            fontSize: '0.875rem',
            color: '#aaa',
            fontWeight: 300,
            margin: '0 0 2rem',
            lineHeight: 1.6,
          }}>
            Create your first page — a resume, an invitation,<br />
            a landing page, a quiz, anything.
          </p>

          <button className="create-btn" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
            New page
          </button>

          <p style={{
            marginTop: '1rem',
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.7rem',
            color: '#ccc',
          }}>
            coming soon
          </p>
        </div>

        {/* Bottom note */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 0',
          borderTop: '1px solid #e8e6e1',
        }}>
          <span style={{ fontSize: '0.78rem', color: '#ccc', fontWeight: 300 }}>
            hyphertext.com
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.72rem',
            color: '#ddd',
          }}>
            v0.1 — early access
          </span>
        </div>
      </div>
    </div>
  );
}