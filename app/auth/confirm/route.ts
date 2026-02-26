import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This route handler processes email confirmation and password reset links
// Using the modern Supabase approach with token_hash and verifyOtp()
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next');

    console.log('🔍 Auth confirm - Params:', { 
      hasTokenHash: !!token_hash, 
      type, 
      next,
      host: request.headers.get('host')
    });

    if (!token_hash || !type) {
      console.error('❌ Missing token_hash or type');
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      return NextResponse.redirect(`${protocol}://${host}/auth/error?error=Missing+authentication+token`);
    }

    // Get cookies (async in Next.js 15)
    const cookieStore = await cookies();

    // Create a Supabase client with proper cookie handling for server-side
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting errors
              console.error('Cookie set error:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.error('Cookie remove error:', error);
            }
          },
        },
      }
    );

    // Verify the OTP token - this exchanges the token for a session
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      console.error('❌ Verification error:', error.message);
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      return NextResponse.redirect(
        `${protocol}://${host}/auth/error?error=${encodeURIComponent(error.message)}`
      );
    }

    // ✅ FIXED - Check if user exists before accessing user.id
    if (!data.user) {
      console.error('❌ No user data after verification');
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      return NextResponse.redirect(
        `${protocol}://${host}/auth/error?error=Authentication+failed`
      );
    }

    console.log('✅ Token verified successfully');
    console.log('✅ Session created:', !!data.session);
    console.log('✅ User:', data.user?.email);

    // ✅ UPDATED - Default redirect destinations
    const defaultNext = type === 'recovery' 
      ? '/auth/reset-password' 
      : '/dashboard';
    const redirectTo = next?.startsWith('/') ? next : defaultNext;

    // Get the host from headers
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const redirectUrl = `${protocol}://${host}${redirectTo}`;
    
    console.log('🔗 Full redirect URL:', redirectUrl);

    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl);

    // Manually set the session cookies in the response
    // This ensures the browser receives the cookies
    if (data.session) {
      response.cookies.set({
        name: 'sb-access-token',
        value: data.session.access_token,
        path: '/',
        sameSite: 'lax',
        secure: protocol === 'https',
        httpOnly: true,
      });

      response.cookies.set({
        name: 'sb-refresh-token', 
        value: data.session.refresh_token,
        path: '/',
        sameSite: 'lax',
        secure: protocol === 'https',
        httpOnly: true,
      });
    }

    return response;

  } catch (err) {
    console.error('❌ Exception in auth confirm:', err);
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(
      `${protocol}://${host}/auth/error?error=An+unexpected+error+occurred`
    );
  }
}