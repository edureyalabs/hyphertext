// app/auth/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSession, signIn, signUp, forgotPassword } from '@/lib/api';

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password' | 'check_email';

function AuthContent() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    sign_up: 'Get started — it\'s free.',
    forgot_password: 'Enter your email and we\'ll send a reset link.',
    check_email: 'We sent a confirmation link to ' + email + '. Click it to activate your account.',
  };

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

                <button type="submit" className="submit-btn" disabled={submitting}>
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