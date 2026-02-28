import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET /api/auth/session — returns current session user (or null)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({ session: null, error: error.message }, { status: 400 });
    }

    if (!session) {
      return NextResponse.json({ session: null });
    }

    // Only return safe user fields — never expose the raw session token to the client
    return NextResponse.json({
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
        },
      },
    });
  } catch (err) {
    return NextResponse.json({ session: null, error: 'Internal error' }, { status: 500 });
  }
}