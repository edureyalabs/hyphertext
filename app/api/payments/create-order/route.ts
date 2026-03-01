// app/api/payments/create-order/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRazorpayOrder } from '@/lib/razorpay';
import { detectCountry } from '@/lib/geo';

/**
 * POST /api/payments/create-order
 * Body: { amountUSD: number, userId: string }
 */
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[create-order] Missing Supabase env vars:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
      return NextResponse.json(
        { error: 'Server configuration error: missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Check Razorpay keys before doing anything else
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[create-order] Missing Razorpay env vars:', {
        hasKeyId: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        hasSecret: !!process.env.RAZORPAY_KEY_SECRET,
      });
      return NextResponse.json(
        { error: 'Server configuration error: missing Razorpay credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { amountUSD, userId } = body;

    if (!amountUSD || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: amountUSD, userId' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountUSD);
    if (isNaN(amount) || amount < 1) {
      return NextResponse.json(
        { error: 'Minimum purchase amount is $1 USD' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error('[create-order] User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Detect currency
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = (forwardedFor?.split(',')[0] || realIp || 'unknown').trim();
    const country = await detectCountry(ip);
    const currency = country === 'IN' ? 'INR' : 'USD';

    // Get token price — try RPC, fall back to table, then hardcode
    let tokensPerDollar = 100000;
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_current_token_price');
      if (!rpcErr && rpcData) {
        tokensPerDollar = rpcData;
      } else {
        const { data: setting } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'tokens_per_dollar')
          .single();
        if (setting?.value) tokensPerDollar = parseInt(setting.value, 10);
      }
    } catch (e) {
      console.warn('[create-order] Price fetch failed, using default 100000');
    }

    const tokenAmount = Math.floor(amount * tokensPerDollar);

    console.log('[create-order] Creating order:', { amount, userId, currency, tokensPerDollar, tokenAmount });

    // Create Razorpay order
    const razorpayResult = await createRazorpayOrder(amount, userId, tokensPerDollar, currency);

    if (!razorpayResult.success || !razorpayResult.order) {
      console.error('[create-order] Razorpay failed:', razorpayResult.error);
      return NextResponse.json(
        { error: razorpayResult.error || 'Failed to create payment order' },
        { status: 500 }
      );
    }

    const razorpayOrder = razorpayResult.order;

    // Save order to DB
    const { error: dbError } = await supabase.rpc('create_payment_order', {
      p_user_id: userId,
      p_amount_usd: amount,
      p_razorpay_order_id: razorpayOrder.id,
      p_ip_address: ip,
      p_user_agent: request.headers.get('user-agent') || 'unknown',
    });

    if (dbError) {
      console.error('[create-order] DB save failed:', dbError);
      return NextResponse.json({ error: 'Failed to save order to database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
      tokens: { tokensPerDollar, tokenAmount, amountUSD: amount },
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error('[create-order] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order', success: false },
      { status: 500 }
    );
  }
}