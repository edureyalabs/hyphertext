// lib/api.ts
// All Supabase interactions are now proxied through our Next.js API routes.
// Client components import from here — never from @supabase/* directly.

export interface ApiUser {
  id: string;
  email?: string;
  created_at?: string;
}

export interface ApiSession {
  user: ApiUser;
}

export interface Page {
  id: string;
  title: string;
  html_content: string;
  is_published: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  page_id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message_type: string;
  model_id?: string;
  meta: Record<string, unknown>;
  created_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function getSession(): Promise<ApiSession | null> {
  const res = await fetch('/api/auth/session', { credentials: 'include' });
  if (!res.ok) return null;
  const { session } = await res.json();
  return session ?? null;
}

export async function signIn(email: string, password: string): Promise<{ user?: ApiUser; error?: string }> {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? 'Sign in failed' };
  return { user: data.user };
}

export async function signUp(email: string, password: string): Promise<{ requiresConfirmation?: boolean; error?: string }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? 'Sign up failed' };
  return { requiresConfirmation: data.requiresConfirmation };
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
}

export async function forgotPassword(email: string): Promise<{ error?: string }> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error };
  return {};
}

export async function updatePassword(password: string): Promise<{ error?: string }> {
  const res = await fetch('/api/auth/update-password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error };
  return {};
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export async function listPages(): Promise<Page[]> {
  const res = await fetch('/api/pages', { credentials: 'include' });
  if (!res.ok) return [];
  const { pages } = await res.json();
  return pages;
}

export async function createPage(title: string, html_content: string): Promise<{ page?: Page; error?: string }> {
  const res = await fetch('/api/pages', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, html_content }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? 'Failed to create page' };
  return { page: data.page };
}

export async function getPage(pageId: string): Promise<Page | null> {
  const res = await fetch(`/api/pages/${pageId}`, { credentials: 'include' });
  if (!res.ok) return null;
  const { page } = await res.json();
  return page;
}

export async function updatePage(
  pageId: string,
  updates: Partial<Pick<Page, 'title' | 'html_content' | 'is_published'>>
): Promise<{ page?: Page; error?: string }> {
  const res = await fetch(`/api/pages/${pageId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error };
  return { page: data.page };
}

export async function deletePage(pageId: string): Promise<{ error?: string }> {
  const res = await fetch(`/api/pages/${pageId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error };
  return {};
}

// ─── Chat Messages ───────────────────────────────────────────────────────────

export async function getMessages(pageId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/pages/${pageId}/messages`, { credentials: 'include' });
  if (!res.ok) return [];
  const { messages } = await res.json();
  return messages;
}

export async function sendMessage(
  pageId: string,
  content: string,
  model_id: string
): Promise<{ message?: ChatMessage; error?: string }> {
  const res = await fetch(`/api/pages/${pageId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, model_id }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? 'Failed to send message' };
  return { message: data.message };
}

// ─── Realtime (SSE) ──────────────────────────────────────────────────────────

export type SSEPageUpdateHandler = (page: Partial<Page>) => void;
export type SSEMessageHandler = (msg: ChatMessage, event: 'insert' | 'update') => void;

/**
 * Opens a Server-Sent Events connection to our SSE proxy route.
 * The browser connects to Vercel — Vercel connects to Supabase Realtime.
 * Returns a cleanup function to close the connection.
 */
export function subscribeToPage(
  pageId: string,
  onPageUpdate: SSEPageUpdateHandler,
  onMessage: SSEMessageHandler
): () => void {
  const eventSource = new EventSource(`/api/pages/${pageId}/realtime`, {
    withCredentials: true,
  });

  eventSource.addEventListener('page_update', (e: MessageEvent) => {
    try {
      onPageUpdate(JSON.parse(e.data));
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('message_insert', (e: MessageEvent) => {
    try {
      onMessage(JSON.parse(e.data), 'insert');
    } catch { /* ignore */ }
  });

  eventSource.addEventListener('message_update', (e: MessageEvent) => {
    try {
      onMessage(JSON.parse(e.data), 'update');
    } catch { /* ignore */ }
  });

  eventSource.onerror = () => {
    // EventSource auto-reconnects on error — no manual handling needed
  };

  return () => eventSource.close();
}