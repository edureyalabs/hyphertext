// app/account/components/PurchaseTab.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PurchaseTabProps {
  userId: string;
}

type PurchaseState = 'idle' | 'creating' | 'checkout' | 'verifying' | 'success' | 'error';

// Model pricing reference (matches model_pricing table) — used only for the
// "estimated tokens" preview. Actual billing always goes through the DB.
const MODEL_PRICING: { label: string; inputPer1M: number; outputPer1M: number }[] = [
  { label: 'Llama 3.3 70B (Groq)',        inputPer1M: 0.59, outputPer1M: 0.79  },
  { label: 'GLM-5 (Together AI)',          inputPer1M: 1.00, outputPer1M: 3.20  },
  { label: 'GLM-4.7-Flash (Together AI)', inputPer1M: 0.00, outputPer1M: 0.00  },
  { label: 'Claude Haiku 4.5',            inputPer1M: 1.00, outputPer1M: 5.00  },
];

// For the "how far does $X go" estimate we use a blended average cost per page build.
// Rough estimate: a page build uses ~4000 input + ~3000 output tokens on GLM-5.
const APPROX_COST_PER_BUILD_USD = (4000 / 1_000_000) * 1.00 + (3000 / 1_000_000) * 3.20; // ~$0.0136

export default function PurchaseTab({ userId }: PurchaseTabProps) {
  const [dollarBalance, setDollarBalance]   = useState<number | null>(null);
  const [tokenBalance, setTokenBalance]     = useState<number | null>(null);
  const [amountUSD, setAmountUSD]           = useState('5');
  const [state, setState]                   = useState<PurchaseState>('idle');
  const [error, setError]                   = useState('');
  const [lastCredited, setLastCredited]     = useState(0);
  const [loadingData, setLoadingData]       = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      if (userId) {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('dollar_balance, token_balance')
          .eq('user_id', userId)
          .single();
        if (wallet) {
          setDollarBalance(Number(wallet.dollar_balance ?? 0));
          setTokenBalance(Number(wallet.token_balance ?? 0));
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingData(false);
    }
  };

  const parsedAmount  = parseFloat(amountUSD) || 0;
  const isValidAmount = parsedAmount >= 1;

  // Estimated page builds from this purchase
  const estimatedBuilds = APPROX_COST_PER_BUILD_USD > 0
    ? Math.floor(parsedAmount / APPROX_COST_PER_BUILD_USD)
    : 0;

  const fmtDollars = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  const fmtTokens = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toLocaleString();
  };

  const handlePurchase = async () => {
    if (!isValidAmount || !userId) return;
    setState('creating');
    setError('');

    try {
      // Step 1: create Razorpay order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUSD: parsedAmount, userId }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) throw new Error(orderData.error || 'Failed to create order');
      if (!orderData.razorpayKeyId) throw new Error('Payment configuration error: missing key');

      // Step 2: load Razorpay SDK
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload  = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
      }

      setState('checkout');

      // Step 3: open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const options = {
          key:         orderData.razorpayKeyId,
          amount:      orderData.order.amount,
          currency:    orderData.order.currency,
          name:        'Hyphertext',
          description: `$${parsedAmount.toFixed(2)} USD credit`,
          order_id:    orderData.order.id,
          handler: async (response: any) => {
            setState('verifying');
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id:  response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setLastCredited(verifyData.amountUSD ?? parsedAmount);
                setState('success');
                await loadData();
                setTimeout(() => setState('idle'), 5000);
                resolve();
              } else {
                throw new Error(verifyData.error || 'Payment verification failed');
              }
            } catch (err: any) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setState('idle');
              resolve();
            },
          },
          theme: { color: '#111111' },
          prefill: {},
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.on('payment.failed', (res: any) => {
          reject(new Error(res.error?.description || 'Payment failed'));
        });
        razorpay.open();
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  const isProcessing = state === 'creating' || state === 'verifying';

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>credits</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.025em', margin: 0, color: '#111' }}>Purchase credits</h1>
      </div>

      {/* Balance card */}
      <div style={{
        background: '#111', borderRadius: '10px', padding: '1.5rem',
        marginBottom: '1rem',
      }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>current balance</p>
        {loadingData ? (
          <div style={{ width: '120px', height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 300, color: '#f8f7f4', letterSpacing: '-0.03em', fontFamily: "'DM Mono', monospace" }}>
              ${dollarBalance !== null ? fmtDollars(dollarBalance) : '—'}
            </p>
            {tokenBalance !== null && tokenBalance > 0 && (
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
                / {fmtTokens(tokenBalance)} tokens
              </p>
            )}
          </div>
        )}
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>
          dollar credits · billed per AI usage
        </p>
      </div>

      {/* How billing works info strip */}
      <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2a9d5c', flexShrink: 0, marginTop: '0.35rem' }} />
        <div>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.8rem', color: '#333', fontWeight: 500 }}>Dollar-credit billing</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#888', fontWeight: 300, lineHeight: 1.6 }}>
            Credits are deducted based on actual AI model usage. Different models have different rates — simple edits cost less than full page builds.
          </p>
        </div>
      </div>

      {/* Purchase form */}
      <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 1.25rem' }}>amount</p>

        {/* Amount input */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <span style={{
            position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', color: '#aaa', fontFamily: "'DM Mono', monospace", pointerEvents: 'none',
          }}>$</span>
          <input
            type="number"
            min="1"
            step="1"
            value={amountUSD}
            onChange={e => setAmountUSD(e.target.value)}
            disabled={isProcessing || state === 'success'}
            style={{
              width: '100%', border: '1px solid #e0ddd8', borderRadius: '6px',
              padding: '0.75rem 0.85rem 0.75rem 1.8rem', fontSize: '1.2rem',
              fontFamily: "'DM Mono', monospace", fontWeight: 300, color: '#111',
              background: '#fff', outline: 'none', transition: 'border-color 0.15s',
            }}
            placeholder="5"
          />
        </div>

        {/* Credit preview */}
        <div style={{
          background: '#f8f7f4', border: '1px solid #ece9e4', borderRadius: '6px',
          padding: '1rem 1.25rem', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isValidAmount ? '0.6rem' : 0 }}>
            <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 300 }}>You receive</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 300, letterSpacing: '-0.02em', color: '#111', fontFamily: "'DM Mono', monospace" }}>
              {isValidAmount ? `$${parsedAmount.toFixed(2)}` : '—'}
              <span style={{ fontSize: '0.75rem', color: '#bbb', marginLeft: '0.4rem' }}>USD credit</span>
            </span>
          </div>
          {isValidAmount && (
            <div style={{ borderTop: '1px solid #ece9e4', paddingTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.73rem', color: '#aaa', fontWeight: 300 }}>≈ page builds</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.73rem', color: '#888' }}>
                ~{estimatedBuilds.toLocaleString()} full builds
              </span>
            </div>
          )}
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {[1, 5, 10, 25].map(amt => (
            <button
              key={amt}
              onClick={() => setAmountUSD(String(amt))}
              disabled={isProcessing || state === 'success'}
              style={{
                flex: 1, padding: '0.4rem',
                border: `1px solid ${amountUSD === String(amt) ? '#111' : '#e0ddd8'}`,
                borderRadius: '4px',
                background: amountUSD === String(amt) ? '#111' : 'transparent',
                color: amountUSD === String(amt) ? '#f8f7f4' : '#888',
                fontSize: '0.78rem', fontFamily: "'DM Mono', monospace",
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              ${amt}
            </button>
          ))}
        </div>

        {/* Status messages */}
        {state === 'error' && (
          <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#e05252', flexShrink: 0, marginTop: '1px' }}>✗</span>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#c53030', fontWeight: 300 }}>{error}</p>
          </div>
        )}

        {state === 'success' && (
          <div style={{ background: '#f0faf4', border: '1px solid #b7e9ca', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#2a9d5c', flexShrink: 0, marginTop: '1px' }}>✓</span>
            <div>
              <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', color: '#1a7a47', fontWeight: 500 }}>Payment successful</p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#2a9d5c', fontWeight: 300 }}>
                ${Number(lastCredited).toFixed(2)} USD added to your credit balance.
              </p>
            </div>
          </div>
        )}

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={!isValidAmount || isProcessing || state === 'success' || !userId}
          style={{
            width: '100%', background: '#111', color: '#f8f7f4', border: 'none',
            padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 400, letterSpacing: '0.02em',
            cursor: (isValidAmount && !isProcessing && state !== 'success') ? 'pointer' : 'not-allowed',
            opacity: (isValidAmount && !isProcessing && state !== 'success') ? 1 : 0.4,
            transition: 'opacity 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          {isProcessing && (
            <div style={{ width: '14px', height: '14px', border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#f8f7f4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          )}
          {state === 'creating'  && 'Creating order…'}
          {state === 'verifying' && 'Verifying payment…'}
          {state === 'checkout'  && 'Complete in Razorpay…'}
          {state === 'success'   && '✓ Purchase complete'}
          {(state === 'idle' || state === 'error') && `Pay $${parsedAmount.toFixed(2)} USD →`}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#ccc', marginTop: '0.75rem', fontWeight: 300 }}>
          Secured by Razorpay · cards, UPI, net banking supported
        </p>
      </div>

      {/* Model pricing reference */}
      <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 1rem' }}>model pricing</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {MODEL_PRICING.map(m => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f5f3ef' }}>
              <span style={{ fontSize: '0.78rem', color: '#555', fontWeight: 300 }}>{m.label}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: m.inputPer1M === 0 ? '#2a9d5c' : '#888' }}>
                {m.inputPer1M === 0
                  ? 'free'
                  : `$${m.inputPer1M.toFixed(2)} / $${m.outputPer1M.toFixed(2)} per 1M`}
              </span>
            </div>
          ))}
        </div>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.7rem', color: '#bbb', fontWeight: 300, lineHeight: 1.6 }}>
          Input / output price per 1M tokens. Most edits use a mix of models automatically chosen by the agent.
        </p>
      </div>

      {/* How credits work */}
      <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.5rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 1rem' }}>how credits work</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[
            ['Purchase',    'Add dollar credits to your account. Credits are charged at the actual cost of each AI model call.'],
            ['AI usage',    'Each page build or edit deducts a few cents based on the models and token counts used.'],
            ['No expiry',   'Your credit balance never expires. Unused balance carries forward indefinitely.'],
            ['Free models', 'Some lightweight models (e.g. GLM-4.7-Flash) are free and produce no charge.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ddd', flexShrink: 0, marginTop: '0.45rem' }} />
              <div>
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', fontWeight: 500, color: '#333' }}>{title}</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#999', fontWeight: 300, lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}