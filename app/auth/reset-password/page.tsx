'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push('/auth');
        }, 2500);
      }
    } catch {
      setError('An error occurred while updating your password.');
      setLoading(false);
    }
  };

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
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 2rem',
        minHeight: 'calc(100vh - 56px)',
      }}>
        <div style={{ width: '100%', maxWidth: '360px', animation: 'fadeIn 0.5s ease both' }}>

          {/* Invalid session state */}
          {!hasSession && error ? (
            <>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#aaa', letterSpacing: '0.06em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                error
              </p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 300, letterSpacing: '-0.025em', margin: '0 0 0.5rem' }}>
                Link expired.
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300, margin: '0 0 2rem', lineHeight: 1.6 }}>
                This password reset link is no longer valid.
              </p>
              <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '6px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: '#e05252', margin: 0, lineHeight: 1.6 }}>
                  {error}
                </p>
              </div>
              <button onClick={() => router.push('/auth')} className="submit-btn">
                Request a new link
              </button>
            </>
          ) : success ? (
            /* Success state */
            <>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#aaa', letterSpacing: '0.06em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                done
              </p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 300, letterSpacing: '-0.025em', margin: '0 0 0.5rem' }}>
                Password updated.
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300, margin: '0 0 2rem', lineHeight: 1.6 }}>
                Redirecting you to sign in...
              </p>
              <div style={{
                height: '2px',
                background: '#e8e6e1',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: '100%',
                  background: '#0047AB',
                  animation: 'progress 2.5s linear forwards',
                }} />
              </div>
              <style>{`
                @keyframes progress { from { transform: translateX(-100%); } to { transform: translateX(0); } }
              `}</style>
            </>
          ) : (
            /* Form state */
            <>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#aaa', letterSpacing: '0.06em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                reset password
              </p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 300, letterSpacing: '-0.025em', margin: '0 0 0.5rem' }}>
                Choose a new password.
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300, margin: '0 0 2rem', lineHeight: 1.6 }}>
                Must be at least 6 characters.
              </p>

              <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '6px', padding: '2rem' }}>
                <form onSubmit={handleReset}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#555', marginBottom: '0.4rem', letterSpacing: '0.02em' }}>
                      New password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field-input"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#555', marginBottom: '0.4rem', letterSpacing: '0.02em' }}>
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="field-input"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div style={{
                      background: '#fff5f5',
                      border: '1px solid #fcc',
                      borderRadius: '3px',
                      padding: '0.75rem',
                      marginBottom: '1rem',
                    }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#e05252', margin: 0, lineHeight: 1.5 }}>
                        {error}
                      </p>
                    </div>
                  )}

                  <button type="submit" disabled={loading || !hasSession} className="submit-btn">
                    {loading ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}