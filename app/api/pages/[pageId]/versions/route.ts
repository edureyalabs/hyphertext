import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ pageId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: page } = await supabase
      .from('pages')
      .select('owner_id')
      .eq('id', pageId)
      .single();

    if (!page || page.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: versions, error } = await supabase
      .from('page_versions')
      .select('id, version_num, trigger_type, created_at')
      .eq('page_id', pageId)
      .order('version_num', { ascending: false })
      .limit(15);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ versions: versions ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: page } = await supabase
      .from('pages')
      .select('owner_id')
      .eq('id', pageId)
      .single();

    if (!page || page.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, html_content, version_id } = body;

    if (action === 'sync') {
      if (!html_content) {
        return NextResponse.json({ error: 'html_content required' }, { status: 400 });
      }

      const { data: existing } = await supabase
        .from('page_versions')
        .select('version_num')
        .eq('page_id', pageId)
        .order('version_num', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = existing ? existing.version_num + 1 : 1;

      await supabase.from('page_versions').insert({
        page_id: pageId,
        html_snapshot: html_content,
        version_num: nextVersion,
        trigger_type: 'manual_sync',
      });

      const { data: updatedPage, error } = await supabase
        .from('pages')
        .update({
          html_content,
          html_summary: '',
          component_map: [],
          page_source: 'import',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json({ page: updatedPage, version_num: nextVersion });
    }

    if (action === 'revert') {
      if (!version_id) {
        return NextResponse.json({ error: 'version_id required' }, { status: 400 });
      }

      const { data: version } = await supabase
        .from('page_versions')
        .select('html_snapshot, version_num')
        .eq('id', version_id)
        .eq('page_id', pageId)
        .single();

      if (!version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }

      const { data: latest } = await supabase
        .from('page_versions')
        .select('version_num')
        .eq('page_id', pageId)
        .order('version_num', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = latest ? latest.version_num + 1 : 1;

      await supabase.from('page_versions').insert({
        page_id: pageId,
        html_snapshot: version.html_snapshot,
        version_num: nextVersion,
        trigger_type: 'revert',
      });

      const { data: updatedPage, error } = await supabase
        .from('pages')
        .update({
          html_content: version.html_snapshot,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json({ page: updatedPage, reverted_to: version.version_num });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}