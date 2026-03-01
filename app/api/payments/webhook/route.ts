// app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchPaymentDetails } from '@/lib/razorpay';

/**
 * POST /api/payments/webhook
 * Razorpay webhook — handles payment.captured, payment.failed
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Webhook received:', event.event);

    switch (event.event) {
      case 'payment.captured':
        return await handlePaymentCaptured(event);
      case 'payment.failed':
        return await handlePaymentFailed(event);
      default:
        return NextResponse.json({ received: true });
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentCaptured(event: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;

  const paymentDetailsResult = await fetchPaymentDetails(paymentId);
  if (!paymentDetailsResult.success) {
    throw new Error('Failed to fetch payment details');
  }

  const { error } = await supabase.rpc('complete_payment_order', {
    p_razorpay_order_id: orderId,
    p_razorpay_payment_id: paymentId,
    p_razorpay_signature: 'webhook_verified',
    p_payment_method: payment.method,
    p_metadata: paymentDetailsResult.payment,
  });

  if (error && !error.message?.includes('already processed')) {
    console.error('Webhook complete_payment_order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, status: 'completed' });
}

async function handlePaymentFailed(event: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const payment = event.payload.payment.entity;

  await supabase
    .from('payment_orders')
    .update({
      status: 'failed',
      failed_at: new Date().toISOString(),
      failure_reason: payment.error_description || 'Payment failed',
    })
    .eq('razorpay_order_id', payment.order_id);

  return NextResponse.json({ received: true, status: 'failed' });
}