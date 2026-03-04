// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This route handles the redirect back from Google → Supabase → your app.
// Supabase appends ?code=... to the redirectTo URL you specified.
// We exchange that code for a session here on the server.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const error_description = searchParams.get('error_description');

    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') ?? 'https';
    const base = `${protocol}://${host}`;

    // If Google/Supabase returned an error, surface it
    if (error_description) {
      return NextResponse.redirect(
        `${base}/auth/error?error=${encodeURIComponent(error_description)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${base}/auth/error?error=${encodeURIComponent('Missing authorization code')}`
      );
    }

    const cookieStore = await cookies();

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

    // Exchange the OAuth code for a Supabase session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ OAuth code exchange error:', error.message);
      return NextResponse.redirect(
        `${base}/auth/error?error=${encodeURIComponent(error.message)}`
      );
    }

    console.log('✅ Google OAuth successful, user:', data.user?.email);

    // Build the redirect response
    const redirectTo = next.startsWith('/') ? next : '/dashboard';
    const response = NextResponse.redirect(`${base}${redirectTo}`);

    // Set session cookies explicitly so the browser has them immediately
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
    console.error('❌ Exception in auth callback:', err);
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') ?? 'https';
    return NextResponse.redirect(
      `${protocol}://${host}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`
    );
  }
}