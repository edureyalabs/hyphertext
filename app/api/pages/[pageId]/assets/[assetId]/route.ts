// app/api/pages/[pageId]/assets/[assetId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ pageId: string; assetId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { pageId, assetId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: asset } = await supabase
      .from('page_assets')
      .select('*, page:pages(owner_id)')
      .eq('id', assetId)
      .eq('page_id', pageId)
      .single();

    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    if (asset.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: children } = await supabase
      .from('page_assets')
      .select('storage_path')
      .eq('parent_asset_id', assetId);

    if (children && children.length > 0) {
      const childPaths = children.map((c: { storage_path: string }) => c.storage_path).filter(Boolean);
      if (childPaths.length > 0) {
        await supabase.storage.from('page-assets').remove(childPaths);
      }
    }

    await supabase.from('page_assets').delete().eq('parent_asset_id', assetId);

    if (asset.storage_path) {
      await supabase.storage.from('page-assets').remove([asset.storage_path]);
    }

    const { error } = await supabase.from('page_assets').delete().eq('id', assetId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { pageId, assetId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: asset, error } = await supabase
      .from('page_assets')
      .select('*')
      .eq('id', assetId)
      .eq('page_id', pageId)
      .single();

    if (error || !asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    if (asset.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ asset });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}