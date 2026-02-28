// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRequestClient } from '@/lib/supabase/server';

// POST /api/auth/signup
// Body: { email: string, password: string }
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { supabase, responseHeaders } = createSupabaseRequestClient(request);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // The email confirmation link will hit /auth/confirm which is already server-side
        emailRedirectTo: `${request.headers.get('origin')}/auth/confirm`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const response = NextResponse.json({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      // If email confirmation is required, session will be null
      requiresConfirmation: !data.session,
    });

    responseHeaders.getSetCookie?.()?.forEach((cookie) => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}