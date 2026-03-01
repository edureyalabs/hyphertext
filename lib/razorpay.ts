// lib/razorpay.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';

function createRazorpayClient() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/** Convert USD to INR at a fixed rate */
export function convertUSDtoINR(usd: number): number {
  const rate = 83;
  return Math.round(usd * rate);
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
  amountUSD: number,
  userId: string,
  tokensPerDollar: number,
  currency: 'USD' | 'INR' = 'USD'
) {
  try {
    const razorpay = createRazorpayClient();

    let amountInSmallestUnit: number;
    let displayAmount: number;

    if (currency === 'INR') {
      const amountINR = convertUSDtoINR(amountUSD);
      amountInSmallestUnit = amountINR * 100; // paisa
      displayAmount = amountINR;
    } else {
      amountInSmallestUnit = Math.round(amountUSD * 100); // cents
      displayAmount = amountUSD;
    }

    const tokenAmount = Math.floor(amountUSD * tokensPerDollar);

    const order = await razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        user_id: userId,
        amount_usd: amountUSD.toFixed(2),
        tokens_per_dollar: tokensPerDollar.toString(),
        token_amount: tokenAmount.toString(),
        product: 'tokens',
        display_amount: displayAmount.toString(),
      },
    });

    return { success: true, order, amountUSD, tokenAmount };
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return { success: false, error: error.message || 'Failed to create Razorpay order' };
  }
}

/**
 * Verify Razorpay payment signature — CRITICAL security check
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) throw new Error('Razorpay secret not configured');

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay for verification
 */
export async function fetchPaymentDetails(paymentId: string) {
  try {
    const razorpay = createRazorpayClient();
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error: any) {
    console.error('Fetch payment details error:', error);
    return { success: false, error: error.message };
  }
}

/** Calculate tokens from USD amount */
export function calculateTokens(amountUSD: number, tokensPerDollar: number): number {
  return Math.floor(amountUSD * tokensPerDollar);
}