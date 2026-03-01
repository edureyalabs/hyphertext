// app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyRazorpaySignature, fetchPaymentDetails } from '@/lib/razorpay';

/**
 * POST /api/payments/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId }
 */
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Payment verification failed — invalid signature' }, { status: 400 });
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

    // Idempotency
    if (existingOrder.status === 'completed') {
      return NextResponse.json({ success: true, status: 'already_completed', tokens: existingOrder.token_amount });
    }

    // Step 3: Verify with Razorpay API
    const paymentDetailsResult = await fetchPaymentDetails(razorpay_payment_id);
    if (!paymentDetailsResult.success || !paymentDetailsResult.payment) {
      return NextResponse.json({ error: 'Failed to verify payment with Razorpay' }, { status: 500 });
    }

    const paymentDetails = paymentDetailsResult.payment;
    if (paymentDetails.status !== 'captured') {
      return NextResponse.json({ error: `Payment status is ${paymentDetails.status}, not captured` }, { status: 400 });
    }

    // Step 4: Complete — credit tokens atomically
    const { data, error: completeError } = await supabase.rpc('complete_payment_order', {
      p_razorpay_order_id: razorpay_order_id,
      p_razorpay_payment_id: razorpay_payment_id,
      p_razorpay_signature: razorpay_signature,
      p_payment_method: paymentDetails.method,
      p_metadata: paymentDetails,
    });

    if (completeError) {
      if (completeError.message?.includes('already processed')) {
        const { data: updatedOrder } = await supabase
          .from('payment_orders')
          .select('token_amount')
          .eq('razorpay_order_id', razorpay_order_id)
          .single();
        return NextResponse.json({ success: true, status: 'already_completed', tokens: updatedOrder?.token_amount || existingOrder.token_amount });
      }
      console.error('complete_payment_order error:', completeError);
      return NextResponse.json({ error: 'Failed to complete payment' }, { status: 500 });
    }

    // Get fresh balance
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      status: 'completed',
      tokens: existingOrder.token_amount,
      newBalance: wallet?.token_balance ?? 0,
    });

  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed', success: false }, { status: 500 });
  }
}