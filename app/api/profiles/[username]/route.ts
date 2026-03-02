// app/api/profile/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check env vars
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[profile] Missing env vars:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceKey });
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { username: rawUsername } = await params;
    const username = rawUsername.toLowerCase().trim();

    console.log('[profile] Looking up username:', JSON.stringify(username));

    // First try WITHOUT bio in case column doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, created_at')
      .eq('username', username)
      .single();

    console.log('[profile] Query result:', { 
      profile: profile ? { id: profile.id, username: profile.username } : null, 
      error: profileError?.message,
      errorCode: profileError?.code,
      errorDetails: profileError?.details,
    });

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Profile not found',
        debug: profileError?.message 
      }, { status: 404 });
    }

    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, title, html_content, is_published, hosting_status, page_source, created_at, updated_at')
      .eq('owner_id', profile.id)
      .eq('is_published', true)
      .eq('hosting_status', 'active')
      .order('updated_at', { ascending: false });

    if (pagesError) {
      console.error('[profile] Pages error:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    return NextResponse.json({ profile, pages: pages ?? [] });

  } catch (err: any) {
    console.error('[profile] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error', debug: err.message }, { status: 500 });
  }
}