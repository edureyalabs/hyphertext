// app/auth/callback/route.ts 
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard/projects';
    const error_description = searchParams.get('error_description');

    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') ?? 'https';
    const base = `${protocol}://${host}`;

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
    const redirectTo = next.startsWith('/') ? next : '/dashboard/projects';
    const response = NextResponse.redirect(`${base}${redirectTo}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ OAuth code exchange error:', error.message);
      return NextResponse.redirect(
        `${base}/auth/error?error=${encodeURIComponent(error.message)}`
      );
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