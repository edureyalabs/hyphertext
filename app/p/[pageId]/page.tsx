import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export default async function PublishedPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;

  const { data: page } = await supabaseServer
    .from('pages')
    .select('html_content, title, is_published, hosting_status')
    .eq('id', pageId)
    .eq('is_published', true)
    .eq('hosting_status', 'active')
    .single();

  if (!page) notFound();

  return (
    <html>
      <head>
        <title>{page.title}</title>
      </head>
      <body
        style={{ margin: 0, padding: 0 }}
        dangerouslySetInnerHTML={{ __html: page.html_content }}
      />
    </html>
  );
}