'use client';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error') || 'An unknown error occurred';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f7f4',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      color: '#111',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{
        padding: '0 2rem',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #e8e6e1',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Hyphertext" width={28} height={28} style={{ borderRadius: '50%' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#111' }}>
            hyphertext
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 2rem',
        minHeight: 'calc(100vh - 56px)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '360px',
          animation: 'fadeIn 0.4s ease both',
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .back-btn {
              display: inline-block;
              background: #111;
              color: #f8f7f4;
              border: none;
              padding: 0.65rem 1.4rem;
              font-size: 0.875rem;
              font-family: 'DM Sans', sans-serif;
              font-weight: 400;
              letter-spacing: 0.02em;
              cursor: pointer;
              border-radius: 3px;
              text-decoration: none;
              width: 100%;
              text-align: center;
              transition: background 0.15s;
            }
            .back-btn:hover { background: #222; }
          `}</style>

          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.72rem',
            color: '#aaa',
            letterSpacing: '0.06em',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
          }}>
            error
          </p>

          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 300,
            letterSpacing: '-0.025em',
            margin: '0 0 0.5rem',
          }}>
            Something went wrong.
          </h1>

          <p style={{
            fontSize: '0.875rem',
            color: '#888',
            fontWeight: 300,
            margin: '0 0 2rem',
            lineHeight: 1.6,
          }}>
            Authentication could not be completed.
          </p>

          <div style={{
            background: '#fff',
            border: '1px solid #e8e6e1',
            borderRadius: '6px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.78rem',
              color: '#e05252',
              margin: 0,
              lineHeight: 1.6,
            }}>
              {error}
            </p>
          </div>

          <button onClick={() => router.push('/auth')} className="back-btn">
            Back to sign in
          </button>

          <p style={{
            marginTop: '1rem',
            fontSize: '0.75rem',
            color: '#bbb',
            textAlign: 'center',
            fontWeight: 300,
          }}>
            If this keeps happening, contact support
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
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
    }>
      <ErrorContent />
    </Suspense>
  );
}