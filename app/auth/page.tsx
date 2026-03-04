// app/auth/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSession, signIn, signUp, forgotPassword, signInWithGoogle } from '@/lib/api';

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password' | 'check_email';

// Google "G" SVG icon — no external dependency needed
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AuthContent() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    if (view === 'sign_in') {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
        setSubmitting(false);
      } else {
        router.replace('/dashboard');
      }
    } else if (view === 'sign_up') {
      const { requiresConfirmation, error: err } = await signUp(email, password);
      if (err) {
        setError(err);
        setSubmitting(false);
      } else if (requiresConfirmation) {
        setView('check_email');
        setSubmitting(false);
      } else {
        router.replace('/dashboard');
      }
    } else if (view === 'forgot_password') {
      const { error: err } = await forgotPassword(email);
      if (err) {
        setError(err);
      } else {
        setMessage('Check your email for a password reset link.');
      }
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signInWithGoogle(); // redirects browser — page will navigate away
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const titles: Record<AuthView, string> = {
    sign_in: 'Welcome back.',
    sign_up: 'Create an account.',
    forgot_password: 'Reset your password.',
    check_email: 'Check your email.',
  };

  const subtitles: Record<AuthView, string> = {
    sign_in: 'Sign in to build and publish HTML pages instantly.',
    sign_up: "Get started — it's free.",
    forgot_password: "Enter your email and we'll send a reset link.",
    check_email: 'We sent a confirmation link to ' + email + '. Click it to activate your account.',
  };

  // Google button is shown on sign_in and sign_up views only
  const showGoogle = view === 'sign_in' || view === 'sign_up';

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: '#111' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }

        .field-input {
          width: 100%;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 3px;
          color: #111;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          padding: 0.65rem 0.85rem;
          transition: border-color 0.15s;
          outline: none;
        }
        .field-input:focus { border-color: #0047AB; }

        .submit-btn {
          width: 100%;
          background: #111;
          color: #f8f7f4;
          border: none;
          padding: 0.7rem 1rem;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 3px;
          transition: background 0.15s;
        }
        .submit-btn:hover:not(:disabled) { background: #222; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .google-btn {
          width: 100%;
          background: #fff;
          color: #111;
          border: 1px solid #ddd;
          padding: 0.65rem 1rem;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 3px;
          transition: background 0.15s, border-color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
        }
        .google-btn:hover:not(:disabled) { background: #f5f5f5; border-color: #ccc; }
        .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.25rem 0;
          color: #ccc;
          font-size: 0.75rem;
          font-family: 'DM Mono', monospace;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e8e6e1;
        }

        .text-link {
          background: none;
          border: none;
          color: #0047AB;
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
        }
        .text-link:hover { text-decoration: underline; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e8e6e1' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Hyphertext" width={28} height={28} style={{ borderRadius: '50%' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#111' }}>hyphertext</span>
        </Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5rem 2rem', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ width: '100%', maxWidth: '360px', animation: 'fadeIn 0.5s ease both' }}>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#aaa', letterSpacing: '0.06em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              hyphertext.com
            </p>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 300, letterSpacing: '-0.025em', margin: '0 0 0.5rem', lineHeight: 1.2 }}>
              {titles[view]}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300, margin: 0, lineHeight: 1.5 }}>
              {subtitles[view]}
            </p>
          </div>

          {view === 'check_email' ? (
            <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '6px', padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#2a9d5c', margin: '0 0 1rem' }}>✓ email sent</p>
              <button className="text-link" onClick={() => { setView('sign_in'); setEmail(''); setPassword(''); }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '6px', padding: '2rem' }}>

              {/* Google OAuth button — only on sign_in / sign_up */}
              {showGoogle && (
                <>
                  <button
                    className="google-btn"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || submitting}
                    type="button"
                  >
                    {googleLoading ? (
                      <>
                        <div style={{ width: '16px', height: '16px', border: '1.5px solid #ddd', borderTopColor: '#555', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <GoogleIcon />
                        Continue with Google
                      </>
                    )}
                  </button>

                  <div className="divider">or</div>
                </>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#555', marginBottom: '0.4rem' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {(view === 'sign_in' || view === 'sign_up') && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#555', marginBottom: '0.4rem' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field-input"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete={view === 'sign_in' ? 'current-password' : 'new-password'}
                    />
                  </div>
                )}

                {error && (
                  <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: '3px', padding: '0.65rem 0.75rem', marginBottom: '1rem' }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#e05252', margin: 0, lineHeight: 1.5 }}>
                      {error}
                    </p>
                  </div>
                )}

                {message && (
                  <div style={{ background: '#f0faf5', border: '1px solid #a7f3d0', borderRadius: '3px', padding: '0.65rem 0.75rem', marginBottom: '1rem' }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#2a9d5c', margin: 0, lineHeight: 1.5 }}>
                      {message}
                    </p>
                  </div>
                )}

                <button type="submit" className="submit-btn" disabled={submitting || googleLoading}>
                  {submitting ? 'Please wait...' : view === 'sign_in' ? 'Sign in' : view === 'sign_up' ? 'Create account' : 'Send reset link'}
                </button>
              </form>

              {/* View switcher links */}
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                {view === 'sign_in' && (
                  <>
                    <button className="text-link" onClick={() => { setView('forgot_password'); setError(''); setMessage(''); }}>
                      Forgot your password?
                    </button>
                    <p style={{ fontSize: '0.8rem', color: '#999', margin: 0 }}>
                      Don&apos;t have an account?{' '}
                      <button className="text-link" onClick={() => { setView('sign_up'); setError(''); setMessage(''); }}>
                        Sign up
                      </button>
                    </p>
                  </>
                )}
                {view === 'sign_up' && (
                  <p style={{ fontSize: '0.8rem', color: '#999', margin: 0 }}>
                    Already have an account?{' '}
                    <button className="text-link" onClick={() => { setView('sign_in'); setError(''); setMessage(''); }}>
                      Sign in
                    </button>
                  </p>
                )}
                {view === 'forgot_password' && (
                  <button className="text-link" onClick={() => { setView('sign_in'); setError(''); setMessage(''); }}>
                    Back to sign in
                  </button>
                )}
              </div>
            </div>
          )}

          <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#bbb', textAlign: 'center', fontWeight: 300, lineHeight: 1.6 }}>
            By continuing, you agree to our{' '}
            <Link href="/terms" style={{ color: '#888', textDecoration: 'underline' }}>Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: '#888', textDecoration: 'underline' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}