// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
      },
    });
  } catch (err) {
    return NextResponse.json({ session: null, error: 'Internal error' }, { status: 500 });
  }
}