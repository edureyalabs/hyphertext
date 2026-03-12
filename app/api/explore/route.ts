// app/api/explore/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { searchParams } = new URL(request.url);
    const q      = searchParams.get('q')?.trim() ?? '';
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? String(PAGE_SIZE)), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0);

    if (q.length > 0) {
      // Search profiles by username or display_name
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .not('username', 'is', null)
        .limit(10);

      // Search pages by title, joined with owner profile
      const { data: pages } = await supabase
        .from('pages')
        .select('id, title, html_content, updated_at, owner_id, profiles!pages_owner_id_fkey(username, display_name, avatar_url)')
        .eq('is_published', true)
        .eq('hosting_status', 'active')
        .ilike('title', `%${q}%`)
        .order('updated_at', { ascending: false })
        .limit(20);

      return NextResponse.json({
        profiles: profiles ?? [],
        pages:    pages ?? [],
        hasMore:  false, // search results are not paginated
        query:    q,
      });
    }

    // No query — return paginated recent published pages
    const { data: pages, count } = await supabase
      .from('pages')
      .select('id, title, html_content, updated_at, owner_id, profiles!pages_owner_id_fkey(username, display_name, avatar_url)', { count: 'exact' })
      .eq('is_published', true)
      .eq('hosting_status', 'active')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      profiles: [],
      pages:    pages ?? [],
      hasMore:  (count ?? 0) > offset + limit,
      total:    count ?? 0,
      query:    '',
    });
  } catch (err: any) {
    console.error('[explore] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}