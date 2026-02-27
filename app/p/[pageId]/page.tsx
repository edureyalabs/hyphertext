// app/p/[pageId]/page.tsx
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

// Server-side fetch — no auth needed, uses anon key
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PublishedPage({ params }: { params: { pageId: string } }) {
  const { data: page } = await supabasePublic
    .from('pages')
    .select('html_content, title, is_published')
    .eq('id', params.pageId)
    .eq('is_published', true)
    .single();

  if (!page) notFound();

  // Serve the raw HTML directly — full browser page
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