// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRequestClient } from '@/lib/supabase/server';

// GET /api/auth/google
// Initiates the Google OAuth flow via Supabase
export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') ?? 'https';
    const origin = `${protocol}://${host}`;

    const { supabase } = createSupabaseRequestClient(request);

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

    return NextResponse.redirect(data.url);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}