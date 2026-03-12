// app/api/pages/[pageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ pageId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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

    if (page.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ page });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('pages')
      .select('owner_id, is_published, hosting_status')
      .eq('id', pageId)
      .single();

    if (!existing || existing.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Check hosting limit when publishing for the first time
    if (body.is_published === true && !existing.is_published) {
      const { data: canPublish } = await supabase.rpc('check_can_publish', {
        p_user_id: user.id,
        p_page_id: pageId,
      });

      if (canPublish && !canPublish.allowed) {
        return NextResponse.json({
          error: `You have reached your hosting limit of ${canPublish.site_limit} published site${canPublish.site_limit === 1 ? '' : 's'} on your current plan. Upgrade to host more sites.`,
          code: 'hosting_limit_reached',
          tier: canPublish.tier,
          site_limit: canPublish.site_limit,
          published_count: canPublish.published_count,
        }, { status: 403 });
      }
    }

    const allowed = [
      'title',
      'html_content',
      'is_published',
      'html_summary',
      'caption',
      'show_on_profile',
      'inference_mode',
    ] as const;

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
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('pages')
      .select('owner_id')
      .eq('id', pageId)
      .single();

    if (!existing || existing.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Collect all storage paths for this page's assets (including child assets
    // like extracted images from PDFs) BEFORE deleting the page row.
    // The CASCADE on page_assets.page_id → pages.id will auto-delete the DB
    // rows, so we must grab the paths first or they're lost forever.
    const { data: assets } = await supabase
      .from('page_assets')
      .select('storage_path')
      .eq('page_id', pageId);

    const storagePaths = (assets ?? [])
      .map(a => a.storage_path)
      .filter(Boolean) as string[];

    // Delete all storage objects in one batched call.
    // Done before the page delete: a partial storage cleanup is better than
    // skipping it entirely. If storage errors, we still proceed with DB cleanup.
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('page-assets')
        .remove(storagePaths);

      if (storageError) {
        console.error('[page delete] storage cleanup error:', storageError.message);
      }
    }

    // Delete the page row. Postgres CASCADE removes all page_assets rows.
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}