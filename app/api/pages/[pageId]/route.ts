// app/api/pages/[pageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ pageId: string }> };

// GET /api/pages/[pageId]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Ensure user owns the page
    if (page.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ page });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PATCH /api/pages/[pageId]
// Body: Partial<{ title, html_content, is_published }>
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership first
    const { data: existing } = await supabase
      .from('pages')
      .select('owner_id')
      .eq('id', pageId)
      .single();

    if (!existing || existing.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    // Only allow safe fields to be updated
    const allowed = ['title', 'html_content', 'is_published'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: page, error } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', pageId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ page });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/pages/[pageId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('pages')
      .select('owner_id')
      .eq('id', pageId)
      .single();

    if (!existing || existing.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}