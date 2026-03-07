// app/api/profiles/[username]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const PAGE_SIZE = 10;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  // 1. Resolve profile
  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at')
    .eq('username', username.toLowerCase())
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 2. Fetch paginated feed pages (published + show_on_profile + active)
  const { data: pages } = await supabaseServer
    .from('pages')
    .select('id, title, caption, created_at, updated_at, hosting_status, page_source, show_on_profile')
    .eq('owner_id', profile.id)
    .eq('is_published', true)
    .eq('show_on_profile', true)
    .eq('hosting_status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  // 3. Total count for "has more" detection
  const { count } = await supabaseServer
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', profile.id)
    .eq('is_published', true)
    .eq('show_on_profile', true)
    .eq('hosting_status', 'active');

  return NextResponse.json({
    profile,
    pages: pages ?? [],
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + PAGE_SIZE,
  });
}

// PATCH — owner updates caption, title, or show_on_profile for a page
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const body = await req.json();
  const { pageId, caption, title, show_on_profile, userId } = body;

  if (!pageId || !userId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Verify ownership via profiles table
  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  if (!profile || profile.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (caption !== undefined) updates.caption = caption?.slice(0, 1000) ?? null;
  if (title !== undefined && title.trim()) updates.title = title.trim();
  if (show_on_profile !== undefined) updates.show_on_profile = show_on_profile;

  const { data: updated, error } = await supabaseServer
    .from('pages')
    .update(updates)
    .eq('id', pageId)
    .eq('owner_id', userId)
    .select('id, title, caption, show_on_profile')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: updated });
}