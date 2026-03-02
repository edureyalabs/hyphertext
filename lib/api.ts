import { supabase } from '@/lib/supabase';

export interface ApiUser {
  id: string;
  email: string;
}

export interface Session {
  user: ApiUser;
}

export interface Page {
  id: string;
  owner_id: string;
  title: string;
  html_content: string;
  is_published: boolean;
  hosting_status: 'active' | 'suspended';
  page_source: 'agent' | 'import';
  html_summary: string;
  component_map: any[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  page_id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message_type: 'chat' | 'thinking' | 'clarification';
  model_id: string | null;
  meta: Record<string, any>;
  created_at: string;
}

export interface PageAsset {
  id: string;
  page_id: string;
  owner_id: string;
  file_name: string;
  original_file_name: string;
  file_type: string;
  asset_type: 'image' | 'document' | 'extracted_image';
  storage_path: string;
  public_url: string | null;
  extracted_text: string | null;
  extracted_summary: string | null;
  vision_description: string | null;
  vision_tags: string[] | null;
  vision_suggested_use: string | null;
  vision_alt_text: string | null;
  vision_contains_text: boolean;
  vision_extracted_text: string | null;
  dominant_colors: string[] | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number;
  parent_asset_id: string | null;
  processing_status: 'pending' | 'processing' | 'ready' | 'failed';
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageVersion {
  id: string;
  version_num: number;
  trigger_type: string;
  created_at: string;
}

export interface SubscriptionTier {
  tier: string;
  label: string;
  price_usd: number;
  site_limit: number;
  page_limit: number;
  sort_order: number;
}

export interface Subscription {
  tier: string;
  status: string;
  site_limit: number;
  page_limit: number;
  current_period_start: string | null;
  current_period_end: string | null;
  label: string;
  price_usd: number;
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return { user: { id: session.user.id, email: session.user.email ?? '' } };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function listPages(): Promise<Page[]> {
  const res = await fetch('/api/pages');
  if (!res.ok) return [];
  const data = await res.json();
  return data.pages ?? [];
}

export async function createPage(title: string, html_content: string, page_source: 'agent' | 'import' = 'agent'): Promise<{ page: Page | null; error: string | null }> {
  const res = await fetch('/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, html_content, page_source }),
  });
  const data = await res.json();
  if (!res.ok) return { page: null, error: data.error ?? 'Failed to create page' };
  return { page: data.page, error: null };
}

export async function getPage(pageId: string): Promise<Page | null> {
  const res = await fetch(`/api/pages/${pageId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.page ?? null;
}

export async function updatePage(pageId: string, updates: Partial<Pick<Page, 'title' | 'html_content' | 'is_published' | 'html_summary'>>): Promise<{ page: Page | null; error: string | null; code?: string; site_limit?: number; tier?: string }> {
  const res = await fetch(`/api/pages/${pageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) return { page: null, error: data.error ?? 'Failed to update', code: data.code, site_limit: data.site_limit, tier: data.tier };
  return { page: data.page, error: null };
}

export async function deletePage(pageId: string): Promise<{ error: string | null }> {
  const res = await fetch(`/api/pages/${pageId}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    return { error: data.error ?? 'Failed to delete' };
  }
  return { error: null };
}

export async function getMessages(pageId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/pages/${pageId}/messages`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages ?? [];
}

export async function sendMessage(pageId: string, content: string, model_id?: string): Promise<{ error: string | null }> {
  const res = await fetch(`/api/pages/${pageId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, model_id }),
  });
  if (!res.ok) {
    const data = await res.json();
    return { error: data.error ?? 'Failed to send' };
  }
  return { error: null };
}

export async function listAssets(pageId: string): Promise<PageAsset[]> {
  const res = await fetch(`/api/pages/${pageId}/assets`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.assets ?? [];
}

export async function uploadAsset(
  pageId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ asset: PageAsset | null; error: string | null }> {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/pages/${pageId}/assets`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ asset: data.asset, error: null });
        } else {
          resolve({ asset: null, error: data.error ?? 'Upload failed' });
        }
      } catch {
        resolve({ asset: null, error: 'Upload failed' });
      }
    });

    xhr.addEventListener('error', () => resolve({ asset: null, error: 'Upload failed' }));
    xhr.send(formData);
  });
}

export async function deleteAsset(pageId: string, assetId: string): Promise<{ error: string | null }> {
  const res = await fetch(`/api/pages/${pageId}/assets/${assetId}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    return { error: data.error ?? 'Failed to delete' };
  }
  return { error: null };
}

export async function getPageVersions(pageId: string): Promise<PageVersion[]> {
  const res = await fetch(`/api/pages/${pageId}/versions`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.versions ?? [];
}

export async function syncPageCode(pageId: string, html_content: string): Promise<{ page: Page | null; error: string | null }> {
  const res = await fetch(`/api/pages/${pageId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sync', html_content }),
  });
  const data = await res.json();
  if (!res.ok) return { page: null, error: data.error ?? 'Sync failed' };
  return { page: data.page, error: null };
}

export async function revertPageVersion(pageId: string, version_id: string): Promise<{ page: Page | null; error: string | null }> {
  const res = await fetch(`/api/pages/${pageId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'revert', version_id }),
  });
  const data = await res.json();
  if (!res.ok) return { page: null, error: data.error ?? 'Revert failed' };
  return { page: data.page, error: null };
}

export async function getSubscription(): Promise<{ subscription: Subscription | null; tiers: SubscriptionTier[] }> {
  const res = await fetch('/api/subscription');
  if (!res.ok) return { subscription: null, tiers: [] };
  const data = await res.json();
  return { subscription: data.subscription, tiers: data.tiers ?? [] };
}

export async function createSubscriptionOrder(tier: string): Promise<{ order: any; razorpayKeyId: string; amountUSD: number; error?: string }> {
  const res = await fetch('/api/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_order', tier }),
  });
  const data = await res.json();
  if (!res.ok) return { order: null, razorpayKeyId: '', amountUSD: 0, error: data.error };
  return { order: data.order, razorpayKeyId: data.razorpayKeyId, amountUSD: data.amountUSD };
}

export async function verifyAndUpgradeSubscription(tier: string, razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify_and_upgrade', tier, razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data.error };
  return { success: true };
}

// FIX: removed redundant dynamic re-import, using top-level supabase
export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

// FIX: added requiresConfirmation, removed redundant dynamic re-import
export async function signUp(email: string, password: string): Promise<{ requiresConfirmation: boolean; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { requiresConfirmation: false, error: error.message };
  const requiresConfirmation = !data.session;
  return { requiresConfirmation, error: null };
}

// FIX: guarded window.location.origin for SSR safety, removed redundant dynamic re-import
export async function forgotPassword(email: string): Promise<{ error: string | null }> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });
  if (error) return { error: error.message };
  return { error: null };
}

// FIX: removed redundant dynamic re-import, using top-level supabase
export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { error: null };
}