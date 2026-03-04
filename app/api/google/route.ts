// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRequestClient } from '@/lib/supabase/server';

// GET /api/auth/google
// Initiates the Google OAuth flow via Supabase
export async function GET(request: NextRequest) {
  try {
    const { supabase, responseHeaders } = createSupabaseRequestClient(request);
    const origin = request.headers.get('origin') ?? '';

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
      return NextResponse.json({ error: error?.message ?? 'Could not initiate Google login' }, { status: 500 });
    }

    // Redirect the browser to Google's OAuth consent screen
    const response = NextResponse.redirect(data.url);

    responseHeaders.getSetCookie?.()?.forEach((cookie) => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}