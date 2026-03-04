// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRequestClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { supabase, responseHeaders } = createSupabaseRequestClient(request);

    // Use host + x-forwarded-proto — always present on GET navigations
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
    const protocol = request.headers.get('x-forwarded-proto') ?? 'https';
    const origin = `${protocol}://${host}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data.url) {
      return NextResponse.json(
        { error: error?.message ?? 'Could not initiate Google login' },
        { status: 500 }
      );
    }

    const response = NextResponse.redirect(data.url);
    responseHeaders.getSetCookie?.()?.forEach((cookie) => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}