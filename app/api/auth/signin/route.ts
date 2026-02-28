import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRequestClient } from '@/lib/supabase/server';

// POST /api/auth/signin
// Body: { email: string, password: string }
// This proxies the sign-in through the server so the Supabase URL is never
// called directly from the client's browser.
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { supabase, responseHeaders } = createSupabaseRequestClient(request);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Build response and forward the session cookies Supabase set
    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });

    // Copy any Set-Cookie headers from the Supabase client
    responseHeaders.getSetCookie?.()?.forEach((cookie) => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}