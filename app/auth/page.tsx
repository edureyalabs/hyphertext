'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    });

    // Listen for successful sign-ins
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image 
            src="/logo.png" 
            alt="GarliQ" 
            width={60} 
            height={60}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Back to Home Link */}
      <div className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      {/* Auth Container */}
      <div className="relative z-10 flex items-start justify-center px-6 pt-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-2 flex justify-center"
            >
              <Image 
                src="/logo.png" 
                alt="GarliQ" 
                width={40} 
                height={40}
                className="drop-shadow-2xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold mb-1">
                Welcome to GarliQ
              </h1>
              <p className="text-gray-400 text-xs">
                Start your AI-powered learning journey
              </p>
            </motion.div>

            {/* Trial Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400 font-semibold">7-day free trial • 500K tokens</span>
            </motion.div>
          </div>

          {/* Auth Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-xl p-6"
          >
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#9333ea',
                      brandAccent: '#a855f7',
                      inputBackground: 'rgba(0, 0, 0, 0.3)',
                      inputBorder: 'rgba(75, 85, 99, 1)',
                      inputBorderHover: 'rgba(156, 163, 175, 1)',
                      inputBorderFocus: 'rgba(147, 51, 234, 1)',
                      inputText: 'white',
                      inputLabelText: 'rgba(209, 213, 219, 1)',
                      inputPlaceholder: 'rgba(107, 114, 128, 1)',
                    },
                    space: {
                      spaceSmall: '6px',
                      spaceMedium: '8px',
                      spaceLarge: '10px',
                    },
                    fontSizes: {
                      baseBodySize: '13px',
                      baseInputSize: '13px',
                      baseLabelSize: '12px',
                      baseButtonSize: '13px',
                    },
                    radii: {
                      borderRadiusButton: '6px',
                      buttonBorderRadius: '6px',
                      inputBorderRadius: '6px',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button',
                  input: 'auth-input',
                  label: 'auth-label',
                  anchor: 'text-purple-400 hover:text-purple-300 transition-colors',
                },
              }}
              providers={[]}
              view="sign_in"
              showLinks={true}
              theme="dark"
            />

            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-[10px] text-center text-gray-500 leading-relaxed">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Custom Styles for Supabase Auth UI */}
      <style jsx global>{`
        .auth-container {
          width: 100%;
        }
        
        .auth-button {
          background: white !important;
          color: black !important;
          font-weight: 600 !important;
          transition: all 0.2s !important;
        }
        
        .auth-button:hover {
          background: rgba(229, 229, 229, 1) !important;
        }
        
        .auth-input {
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(75, 85, 99, 1) !important;
          color: white !important;
        }
        
        .auth-input:hover {
          border-color: rgba(156, 163, 175, 1) !important;
        }
        
        .auth-input:focus {
          border-color: rgba(147, 51, 234, 1) !important;
          box-shadow: 0 0 0 1px rgba(147, 51, 234, 0.5) !important;
        }
        
        .auth-label {
          color: rgba(209, 213, 219, 1) !important;
          font-weight: 500 !important;
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image 
            src="/logo.png" 
            alt="GarliQ" 
            width={60} 
            height={60}
          />
        </motion.div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}