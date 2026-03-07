// app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyRazorpaySignature, fetchPaymentDetails } from '@/lib/razorpay';

/**
 * POST /api/payments/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId }
 *
 * On success:
 *   1. Verifies Razorpay signature
 *   2. Calls complete_payment_order (legacy — keeps token_amount credited for backward compat)
 *   3. Calls credit_dollar_balance to credit the dollar amount to the wallet
 */
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );
    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed — invalid signature' },
        { status: 400 },
      );
    }

    // Step 2: Check order exists and belongs to user
    const { data: existingOrder, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single();

    if (orderError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotency — already fully processed
    if (existingOrder.status === 'completed') {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('dollar_balance, token_balance')
        .eq('user_id', userId)
        .single();

      return NextResponse.json({
        success: true,
        status: 'already_completed',
        amountUSD: existingOrder.amount_usd,
        newDollarBalance: wallet?.dollar_balance ?? 0,
        newTokenBalance: wallet?.token_balance ?? 0,
      });
    }

    // Step 3: Verify with Razorpay API — confirm payment was actually captured
    const paymentDetailsResult = await fetchPaymentDetails(razorpay_payment_id);
    if (!paymentDetailsResult.success || !paymentDetailsResult.payment) {
      return NextResponse.json(
        { error: 'Failed to verify payment with Razorpay' },
        { status: 500 },
      );
    }

    const paymentDetails = paymentDetailsResult.payment;
    if (paymentDetails.status !== 'captured') {
      return NextResponse.json(
        { error: `Payment status is ${paymentDetails.status}, not captured` },
        { status: 400 },
      );
    }

    // Step 4: Mark the order as completed (legacy path — also credits tokens for backward compat)
    const { data: completeData, error: completeError } = await supabase.rpc(
      'complete_payment_order',
      {
        p_razorpay_order_id: razorpay_order_id,
        p_razorpay_payment_id: razorpay_payment_id,
        p_razorpay_signature: razorpay_signature,
        p_payment_method: paymentDetails.method,
        p_metadata: paymentDetails,
      },
    );

    if (completeError) {
      // Handle idempotency edge case
      if (completeError.message?.includes('already processed')) {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('dollar_balance, token_balance')
          .eq('user_id', userId)
          .single();

        return NextResponse.json({
          success: true,
          status: 'already_completed',
          amountUSD: existingOrder.amount_usd,
          newDollarBalance: wallet?.dollar_balance ?? 0,
          newTokenBalance: wallet?.token_balance ?? 0,
        });
      }
      console.error('[verify] complete_payment_order error:', completeError);
      return NextResponse.json({ error: 'Failed to complete payment' }, { status: 500 });
    }

    // Step 5: Credit the dollar balance — this is the primary billing currency
    const amountUSD: number = Number(existingOrder.amount_usd);
    const { data: creditData, error: creditError } = await supabase.rpc(
      'credit_dollar_balance',
      {
        p_user_id: userId,
        p_amount_usd: amountUSD,
        p_description: `Credit purchase — $${amountUSD.toFixed(2)} USD`,
        p_reference_id: razorpay_order_id,
      },
    );

    if (creditError) {
      // Dollar credit failed — log it but don't fail the whole response.
      // The order is already marked completed so the user isn't double-charged.
      // An admin can reconcile from the payment_orders table.
      console.error('[verify] credit_dollar_balance error:', creditError);
    }

    // Fetch fresh wallet state for the response
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('dollar_balance, token_balance')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      status: 'completed',
      amountUSD,
      newDollarBalance: wallet?.dollar_balance ?? 0,
      newTokenBalance: wallet?.token_balance ?? 0,
    });
  } catch (error: any) {
    console.error('[verify] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed', success: false },
      { status: 500 },
    );
  }
}