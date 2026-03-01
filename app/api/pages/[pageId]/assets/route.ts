// app/api/pages/[pageId]/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ pageId: string }> };

// File size limits (bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_DOC_SIZE   = 10 * 1024 * 1024;  // 10 MB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALL_ALLOWED = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

// GET /api/pages/[pageId]/assets
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // verify ownership
    const { data: page } = await supabase
      .from('pages')
      .select('owner_id')
      .eq('id', pageId)
      .single();

    if (!page || page.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: assets, error } = await supabase
      .from('page_assets')
      .select('*')
      .eq('page_id', pageId)
      .is('parent_asset_id', null)  // top-level assets only; extracted children fetched separately if needed
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ assets: assets ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/pages/[pageId]/assets
// Accepts multipart/form-data with a single field: "file"
// This route ONLY uploads to storage and creates the DB record.
// Processing (vision / document parsing) is triggered later when the user sends a message.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { pageId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // verify ownership
    const { data: page } = await supabase
      .from('pages')
      .select('owner_id')
      .eq('id', pageId)
      .single();

    if (!page || page.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // type check
    if (!ALL_ALLOWED.includes(file.type)) {
      return NextResponse.json({
        error: `File type not supported. Allowed: images (JPG, PNG, GIF, WebP, SVG), PDF, DOC, DOCX`
      }, { status: 400 });
    }

    // size check
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;
    if (file.size > maxSize) {
      const limitMB = maxSize / (1024 * 1024);
      return NextResponse.json({
        error: `File too large. Maximum size for ${isImage ? 'images' : 'documents'} is ${limitMB} MB.`
      }, { status: 400 });
    }

    // build storage path:  {owner_id}/{page_id}/{timestamp}-{filename}
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${session.user.id}/${pageId}/${Date.now()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('page-assets')
      .upload(storagePath, fileBytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('page-assets')
      .getPublicUrl(storagePath);

    // determine asset_type
    const assetType = isImage ? 'image' : 'document';

    const { data: asset, error: dbError } = await supabase
      .from('page_assets')
      .insert({
        page_id: pageId,
        owner_id: session.user.id,
        file_name: safeName,
        original_file_name: file.name,
        file_type: file.type,
        asset_type: assetType,
        storage_path: storagePath,
        public_url: isImage ? publicUrl : null,  // docs don't need a public URL
        file_size_bytes: file.size,
        processing_status: 'pending',
      })
      .select()
      .single();

    if (dbError || !asset) {
      // clean up storage if DB insert fails
      await supabase.storage.from('page-assets').remove([storagePath]);
      return NextResponse.json({ error: dbError?.message ?? 'Failed to save asset' }, { status: 400 });
    }

    return NextResponse.json({ asset }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}