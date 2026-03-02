import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { createRazorpayOrder } from '@/lib/razorpay';
import { verifyRazorpaySignature, fetchPaymentDetails } from '@/lib/razorpay';

const TIER_PRICES: Record<string, number> = {
  pro: 5,
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase.rpc('get_user_subscription', { p_user_id: user.id });

    const { data: tiers } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('sort_order');

    return NextResponse.json({ subscription: data, tiers: tiers ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, tier, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (action === 'create_order') {
      if (!tier || !TIER_PRICES[tier]) {
        return NextResponse.json({ error: 'Invalid tier. Only "pro" is available.' }, { status: 400 });
      }

      const amountUSD = TIER_PRICES[tier];

      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
      }

      // tokensPerDollar = 1 as a placeholder (subscriptions don't credit tokens)
      const result = await createRazorpayOrder(amountUSD, user.id, 1, 'USD');

      if (!result.success || !result.order) {
        return NextResponse.json({ error: result.error || 'Failed to create order' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        order: {
          id: result.order.id,
          amount: result.order.amount,
          currency: result.order.currency,
        },
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        tier,
        amountUSD,
      });
    }

    if (action === 'verify_and_upgrade') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tier) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      if (!TIER_PRICES[tier]) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }

      const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }

      const paymentResult = await fetchPaymentDetails(razorpay_payment_id);
      if (!paymentResult.success || paymentResult.payment?.status !== 'captured') {
        return NextResponse.json({ error: 'Payment not captured' }, { status: 400 });
      }

      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );

      const { data, error } = await adminSupabase.rpc('upgrade_subscription', {
        p_user_id:             user.id,
        p_tier:                tier,
        p_razorpay_order_id:   razorpay_order_id,
        p_razorpay_payment_id: razorpay_payment_id,
        p_amount_usd:          TIER_PRICES[tier],
      });

      if (error) {
        console.error('upgrade_subscription error:', error);
        return NextResponse.json({ error: 'Failed to upgrade subscription' }, { status: 500 });
      }

      return NextResponse.json({ success: true, result: data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Subscription route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}