// app/account/page.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function AccountPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f7f4',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: transparent;
          border: 1px solid #e8e6e1;
          border-radius: 5px;
          padding: 0.32rem 0.75rem 0.32rem 0.6rem;
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          color: #777;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.13s, color 0.13s, background 0.13s;
          letter-spacing: 0.01em;
        }
        .back-btn:hover {
          border-color: #ccc;
          color: #111;
          background: #fff;
        }
      `}</style>

      {/* ── Header ── */}
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

        {/* Back to dashboard */}
        <Link href="/dashboard/projects" className="back-btn">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to dashboard
        </Link>
      </header>

      {/* ── Content ── */}
      <main style={{ flex: 1, padding: '2.75rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ animation: 'fadeIn 0.35s ease both', maxWidth: '640px', width: '100%' }}>

          {/* Page header */}
          <div style={{ marginBottom: '2.25rem' }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.62rem',
              color: '#bbb',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
            }}>
              account
            </p>
            <h1 style={{
              fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
              fontWeight: 300,
              letterSpacing: '-0.025em',
              margin: 0,
              color: '#111',
            }}>
              Account settings
            </h1>
          </div>

          {/* Coming-soon card */}
          <div style={{
            background: '#fff',
            border: '1px dashed #e0ddd8',
            borderRadius: '10px',
            padding: '4rem 2.5rem',
            textAlign: 'center',
          }}>
            {/* Icon */}
            <div style={{
              width: '44px',
              height: '44px',
              border: '1.5px dashed #ddd',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ddd',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M2.5 16.5c0-3.59 2.91-6 6.5-6s6.5 2.41 6.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>

            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.68rem',
              color: '#ccc',
              marginBottom: '0.55rem',
              letterSpacing: '0.04em',
            }}>
              in development
            </p>
            <h2 style={{
              fontSize: '1.05rem',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: '#555',
              margin: '0 0 0.5rem',
            }}>
              Account settings coming soon.
            </h2>
            <p style={{
              fontSize: '0.84rem',
              color: '#bbb',
              fontWeight: 300,
              margin: '0 0 2rem',
              lineHeight: 1.7,
            }}>
              Profile, username, avatar, and billing will live here.
            </p>

            {/* Back button in card */}
            <Link href="/dashboard/projects" className="back-btn" style={{ display: 'inline-flex' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Go back to dashboard
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}