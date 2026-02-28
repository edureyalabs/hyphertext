// app/p/[pageId]/page.tsx
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

// Server-only client — this code runs only on Vercel, never in the browser
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Prefer service role for server-to-server reads if available
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export default async function PublishedPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;

  const { data: page } = await supabaseServer
    .from('pages')
    .select('html_content, title, is_published')
    .eq('id', pageId)
    .eq('is_published', true)
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