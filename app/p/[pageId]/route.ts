import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  const { data: page } = await supabaseServer
    .from('pages')
    .select('html_content, title, is_published, hosting_status')
    .eq('id', pageId)
    .eq('is_published', true)
    .eq('hosting_status', 'active')
    .single();

  if (!page) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(page.html_content, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}