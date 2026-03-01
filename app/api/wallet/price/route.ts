// app/api/wallet/price/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[wallet/price] Missing env vars:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
      // Return default rather than 500 so the UI still works
      return NextResponse.json({ data: 100000 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_token_price');

    if (!rpcError && rpcData) {
      return NextResponse.json({ data: rpcData });
    }

    if (rpcError) {
      console.warn('[wallet/price] RPC failed, trying table fallback:', rpcError.message);
    }

    // Fallback: read directly from app_settings table
    const { data: setting, error: tableError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'tokens_per_dollar')
      .single();

    if (!tableError && setting?.value) {
      return NextResponse.json({ data: parseInt(setting.value, 10) });
    }

    if (tableError) {
      console.warn('[wallet/price] Table fallback failed:', tableError.message);
    }

    // Last resort: hardcoded default
    return NextResponse.json({ data: 100000 });

  } catch (error: any) {
    console.error('[wallet/price] Unexpected error:', error);
    // Never return 500 for price — just use the default
    return NextResponse.json({ data: 100000 });
  }
}