// app/api/pages/[pageId]/realtime/route.ts
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
// Keep the connection alive for up to 5 minutes (Vercel Pro/Enterprise supports longer)
export const maxDuration = 300;

type Params = { params: Promise<{ pageId: string }> };

// GET /api/pages/[pageId]/realtime
// Returns a Server-Sent Events stream. The client connects once and receives
// all page and chat_messages changes without ever touching Supabase directly.
export async function GET(request: NextRequest, { params }: Params) {
  const { pageId } = await params;

  // Auth check using the user's session cookie
  const authSupabase = await createSupabaseServerClient();
  const { data: { session } } = await authSupabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify ownership
  const { data: page } = await authSupabase
    .from('pages')
    .select('owner_id')
    .eq('id', pageId)
    .single();

  if (!page || page.owner_id !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  // Use a service-role or anon client for the realtime subscription
  // This client is only server-side — credentials never leave Vercel
  const realtimeSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Use service role key if available for server-to-server realtime, else anon
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
    }
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected
        }
      };

      // Send a heartbeat every 25s to keep the connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      // Subscribe to page updates
      const pageChannel = realtimeSupabase
        .channel(`sse-page-${pageId}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pages', filter: `id=eq.${pageId}` },
          (payload) => send('page_update', payload.new)
        )
        .subscribe();

      // Subscribe to chat message inserts and updates
      const chatChannel = realtimeSupabase
        .channel(`sse-chat-${pageId}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `page_id=eq.${pageId}` },
          (payload) => send('message_insert', payload.new)
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `page_id=eq.${pageId}` },
          (payload) => send('message_update', payload.new)
        )
        .subscribe();

      // Clean up when the client disconnects
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
      'X-Accel-Buffering': 'no', // Disable Nginx buffering on Vercel
    },
  });
}