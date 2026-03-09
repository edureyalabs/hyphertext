// app/api/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0);

    const { data, error, count } = await supabase
      .from('pages')
      .select('id, title, is_published, hosting_status, page_source, created_at, updated_at', { count: 'exact' })
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      pages: data ?? [],
      total: count ?? 0,
      limit,
      offset,
      hasMore: (count ?? 0) > offset + limit,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: canCreate } = await supabase.rpc('check_can_create_page', { p_user_id: user.id });
    if (canCreate && !canCreate.allowed) {
      return NextResponse.json({
        error: `You have reached the maximum of ${canCreate.page_limit} pages. Delete some pages to create new ones.`,
        code: 'page_limit_reached'
      }, { status: 403 });
    }

    const body = await request.json();
    const { title, html_content, page_source } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const source = page_source === 'import' ? 'import' : 'agent';

    const { data: page, error } = await supabase
      .from('pages')
      .insert({
        owner_id: user.id,
        title: title.trim(),
        html_content: html_content ?? '',
        is_published: false,
        hosting_status: 'active',
        page_source: source,
      })
      .select()
      .single();

    if (error || !page) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create page' }, { status: 400 });
    }

    return NextResponse.json({ page }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}