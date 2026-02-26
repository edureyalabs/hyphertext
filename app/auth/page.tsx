'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function AuthContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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

        /* Override Supabase Auth UI styles */
        [data-supabase-auth-ui] button[type="submit"],
        .sbui-btn-primary,
        form button[type="submit"] {
          background: #111 !important;
          color: #f8f7f4 !important;
          border: none !important;
          border-radius: 3px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 400 !important;
          font-size: 0.875rem !important;
          letter-spacing: 0.02em !important;
          padding: 0.7rem 1rem !important;
          transition: background 0.15s !important;
          box-shadow: none !important;
        }

        form button[type="submit"]:hover {
          background: #222 !important;
        }

        form input[type="email"],
        form input[type="password"],
        form input[type="text"] {
          background: #fff !important;
          border: 1px solid #ddd !important;
          border-radius: 3px !important;
          color: #111 !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.875rem !important;
          padding: 0.65rem 0.85rem !important;
          transition: border-color 0.15s !important;
          box-shadow: none !important;
          outline: none !important;
        }

        form input:focus {
          border-color: #0047AB !important;
          box-shadow: none !important;
        }

        form label {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.78rem !important;
          font-weight: 400 !important;
          color: #555 !important;
          letter-spacing: 0.02em !important;
        }

        form a, .auth-anchor {
          color: #0047AB !important;
          font-size: 0.8rem !important;
          text-decoration: none !important;
          font-family: 'DM Sans', sans-serif !important;
        }

        form a:hover { text-decoration: underline !important; }

        form p {
          font-family: 'DM Mono', monospace !important;
          font-size: 0.75rem !important;
          color: #999 !important;
        }

        /* Remove any default card backgrounds from Auth UI */
        [data-supabase-auth-ui] > div {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
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
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          textDecoration: 'none',
        }}>
          <Image src="/logo.png" alt="Hyphertext" width={28} height={28} style={{ borderRadius: '50%' }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.85rem',
            color: '#111',
            letterSpacing: '0.01em',
          }}>
            hyphertext
          </span>
        </Link>
      </nav>

      {/* Auth container */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '5rem 2rem',
        minHeight: 'calc(100vh - 56px)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '360px',
          animation: 'fadeIn 0.5s ease both',
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.72rem',
              color: '#aaa',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
            }}>
              hyphertext.com
            </p>
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: 300,
              letterSpacing: '-0.025em',
              margin: '0 0 0.5rem',
              lineHeight: 1.2,
            }}>
              Welcome back.
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: '#888',
              fontWeight: 300,
              margin: 0,
            }}>
              Sign in to build and publish HTML pages instantly.
            </p>
          </div>

          {/* Auth form card */}
          <div style={{
            background: '#fff',
            border: '1px solid #e8e6e1',
            borderRadius: '6px',
            padding: '2rem',
          }}>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#111',
                      brandAccent: '#333',
                      inputBackground: '#fff',
                      inputBorder: '#ddd',
                      inputBorderHover: '#999',
                      inputBorderFocus: '#0047AB',
                      inputText: '#111',
                      inputLabelText: '#555',
                      inputPlaceholder: '#bbb',
                      messageText: '#555',
                      anchorTextColor: '#0047AB',
                      anchorTextHoverColor: '#0035a0',
                    },
                    space: {
                      spaceSmall: '8px',
                      spaceMedium: '12px',
                      spaceLarge: '16px',
                    },
                    fontSizes: {
                      baseBodySize: '14px',
                      baseInputSize: '14px',
                      baseLabelSize: '12px',
                      baseButtonSize: '14px',
                    },
                    radii: {
                      borderRadiusButton: '3px',
                      buttonBorderRadius: '3px',
                      inputBorderRadius: '3px',
                    },
                    fonts: {
                      bodyFontFamily: `'DM Sans', sans-serif`,
                      buttonFontFamily: `'DM Sans', sans-serif`,
                      inputFontFamily: `'DM Sans', sans-serif`,
                      labelFontFamily: `'DM Sans', sans-serif`,
                    },
                  },
                },
              }}
              providers={[]}
              view="sign_in"
              showLinks={true}
            />
          </div>

          {/* Footer note */}
          <p style={{
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: '#bbb',
            textAlign: 'center',
            fontWeight: 300,
            lineHeight: 1.6,
          }}>
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
      <AuthContent />
    </Suspense>
  );
}