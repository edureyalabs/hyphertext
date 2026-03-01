// app/api/pages/[pageId]/realtime/route.ts
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300;

type Params = { params: Promise<{ pageId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { pageId } = await params;

  const authSupabase = await createSupabaseServerClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: page } = await authSupabase
    .from('pages')
    .select('owner_id')
    .eq('id', pageId)
    .single();

  if (!page || page.owner_id !== user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  const realtimeSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { /* client disconnected */ }
      };

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      const pageChannel = realtimeSupabase
        .channel(`sse-page-${pageId}-${Date.now()}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pages', filter: `id=eq.${pageId}` },
          (payload) => send('page_update', payload.new)
        )
        .subscribe();

      const chatChannel = realtimeSupabase
        .channel(`sse-chat-${pageId}-${Date.now()}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `page_id=eq.${pageId}` },
          (payload) => send('message_insert', payload.new)
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `page_id=eq.${pageId}` },
          (payload) => send('message_update', payload.new)
        )
        .subscribe();

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        realtimeSupabase.removeChannel(pageChannel);
        realtimeSupabase.removeChannel(chatChannel);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}