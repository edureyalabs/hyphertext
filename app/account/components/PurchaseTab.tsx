// app/account/components/PurchaseTab.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PurchaseTabProps {
  userId: string;
}

type PurchaseState = 'idle' | 'creating' | 'checkout' | 'verifying' | 'success' | 'error';

const APPROX_COST_PER_BUILD_USD = (4000 / 1_000_000) * 1.00 + (3000 / 1_000_000) * 3.20;

export default function PurchaseTab({ userId }: PurchaseTabProps) {
  const [dollarBalance, setDollarBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance]   = useState<number | null>(null);
  const [amountUSD, setAmountUSD]         = useState('5');
  const [state, setState]                 = useState<PurchaseState>('idle');
  const [error, setError]                 = useState('');
  const [lastCredited, setLastCredited]   = useState(0);
  const [loadingData, setLoadingData]     = useState(true);

  useEffect(() => { loadData(); }, [userId]);

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
    } catch { /* silent */ }
    finally { setLoadingData(false); }
  };

  const parsedAmount    = parseFloat(amountUSD) || 0;
  const isValidAmount   = parsedAmount >= 1;
  const estimatedBuilds = APPROX_COST_PER_BUILD_USD > 0 ? Math.floor(parsedAmount / APPROX_COST_PER_BUILD_USD) : 0;

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
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUSD: parsedAmount, userId }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || 'Failed to create order');
      if (!orderData.razorpayKeyId) throw new Error('Payment configuration error: missing key');

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
      }

      setState('checkout');

      await new Promise<void>((resolve, reject) => {
        const options = {
          key: orderData.razorpayKeyId, amount: orderData.order.amount,
          currency: orderData.order.currency, name: 'Hyphertext',
          description: `$${parsedAmount.toFixed(2)} USD credit`, order_id: orderData.order.id,
          handler: async (response: any) => {
            setState('verifying');
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
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
            } catch (err: any) { reject(err); }
          },
          modal: { ondismiss: () => { setState('idle'); resolve(); } },
          theme: { color: '#111111' }, prefill: {},
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#111', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 500 }}>credits</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.025em', margin: 0, color: '#111' }}>Purchase credits</h1>
      </div>

      {/* Two-column page-level layout */}
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>

        {/* LEFT — fixed width, all purchase action */}
        <div style={{ width: '460px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {/* Balance card */}
          <div style={{ background: '#111', borderRadius: '10px', padding: '1.5rem' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 0, marginBottom: '0.5rem', marginLeft: 0, marginRight: 0 }}>current balance</p>
            {loadingData ? (
              <div style={{ width: '120px', height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 300, color: '#f8f7f4', letterSpacing: '-0.03em', fontFamily: "'DM Mono', monospace" }}>
                  ${dollarBalance !== null ? fmtDollars(dollarBalance) : '—'}
                </p>
                {tokenBalance !== null && tokenBalance > 0 && (
                  <p style={{ marginTop: 0, marginBottom: '0.3rem', marginLeft: 0, marginRight: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono', monospace" }}>
                    / {fmtTokens(tokenBalance)} tokens
                  </p>
                )}
              </div>
            )}
            <p style={{ marginTop: '0.3rem', marginBottom: 0, marginLeft: 0, marginRight: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>
              dollar credits · billed per AI usage
            </p>
          </div>

          {/* Billing info strip */}
          <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2a9d5c', flexShrink: 0, marginTop: '0.35rem' }} />
            <div>
              <p style={{ marginTop: 0, marginBottom: '0.25rem', marginLeft: 0, marginRight: 0, fontSize: '0.88rem', color: '#222', fontWeight: 500 }}>Dollar-credit billing</p>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#666', fontWeight: 300, lineHeight: 1.65 }}>
                Credits are deducted based on actual AI model usage. Different models have different rates — simple edits cost less than full page builds.
              </p>
            </div>
          </div>

          {/* Purchase form card */}
          <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.5rem', boxSizing: 'border-box' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 0, marginBottom: '1.25rem', marginLeft: 0, marginRight: 0, fontWeight: 500 }}>amount</p>

            {/* Amount input */}
            <div style={{ position: 'relative', marginBottom: '1.1rem' }}>
              <span style={{
                position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                fontSize: '1rem', color: '#aaa', fontFamily: "'DM Mono', monospace", pointerEvents: 'none',
              }}>$</span>
              <input
                type="number" min="1" step="1" value={amountUSD}
                onChange={e => setAmountUSD(e.target.value)}
                disabled={isProcessing || state === 'success'}
                style={{
                  width: '100%', border: '1px solid #e0ddd8', borderRadius: '6px',
                  padding: '0.75rem 0.85rem 0.75rem 1.85rem', fontSize: '1.25rem',
                  fontFamily: "'DM Mono', monospace", fontWeight: 300, color: '#111',
                  background: '#fff', outline: 'none', transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                placeholder="5"
              />
            </div>

            {/* Preview */}
            <div style={{
              background: '#f8f7f4', border: '1px solid #ece9e4', borderRadius: '6px',
              padding: '0.9rem 1.1rem', marginBottom: '1.1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isValidAmount ? '0.55rem' : 0 }}>
                <span style={{ fontSize: '0.83rem', color: '#777', fontWeight: 300 }}>You receive</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 300, letterSpacing: '-0.02em', color: '#111', fontFamily: "'DM Mono', monospace" }}>
                  {isValidAmount ? `$${parsedAmount.toFixed(2)}` : '—'}
                  <span style={{ fontSize: '0.75rem', color: '#bbb', marginLeft: '0.4rem' }}>USD credit</span>
                </span>
              </div>
              {isValidAmount && (
                <div style={{ borderTop: '1px solid #ece9e4', paddingTop: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.77rem', color: '#999', fontWeight: 300 }}>≈ page builds</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.77rem', color: '#666' }}>
                    ~{estimatedBuilds.toLocaleString()} full builds
                  </span>
                </div>
              )}
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {[1, 5, 10, 25].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmountUSD(String(amt))}
                  disabled={isProcessing || state === 'success'}
                  style={{
                    flex: 1, padding: '0.45rem',
                    border: `1px solid ${amountUSD === String(amt) ? '#111' : '#e0ddd8'}`,
                    borderRadius: '4px',
                    background: amountUSD === String(amt) ? '#111' : 'transparent',
                    color: amountUSD === String(amt) ? '#f8f7f4' : '#666',
                    fontSize: '0.82rem', fontFamily: "'DM Mono', monospace",
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
                <span style={{ color: '#e05252', flexShrink: 0 }}>✗</span>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#c53030', fontWeight: 300 }}>{error}</p>
              </div>
            )}
            {state === 'success' && (
              <div style={{ background: '#f0faf4', border: '1px solid #b7e9ca', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#2a9d5c', flexShrink: 0 }}>✓</span>
                <div>
                  <p style={{ marginTop: 0, marginBottom: '0.2rem', marginLeft: 0, marginRight: 0, fontSize: '0.85rem', color: '#1a7a47', fontWeight: 500 }}>Payment successful</p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#2a9d5c', fontWeight: 300 }}>
                    ${Number(lastCredited).toFixed(2)} USD added to your balance.
                  </p>
                </div>
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePurchase}
              disabled={!isValidAmount || isProcessing || state === 'success' || !userId}
              style={{
                width: '100%', background: '#111', color: '#f8f7f4', border: 'none',
                padding: '0.75rem', borderRadius: '6px', fontSize: '0.88rem',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 400, letterSpacing: '0.02em',
                cursor: (isValidAmount && !isProcessing && state !== 'success') ? 'pointer' : 'not-allowed',
                opacity: (isValidAmount && !isProcessing && state !== 'success') ? 1 : 0.4,
                transition: 'opacity 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxSizing: 'border-box',
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

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#bbb', marginTop: '0.75rem', marginBottom: 0, marginLeft: 0, marginRight: 0, fontWeight: 300 }}>
              Secured by Razorpay · cards, UPI, net banking
            </p>
          </div>

        </div>

        {/* RIGHT — how credits work, fills remaining viewport space */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '2rem 2.25rem' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 0, marginBottom: '1.75rem', marginLeft: 0, marginRight: 0, fontWeight: 500 }}>how credits work</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {([
              ['Purchase',  'Add dollar credits to your account. Credits are charged at the actual cost of each AI model call.'],
              ['AI usage',  'Each page build or edit deducts a few cents based on the models and token counts used.'],
              ['No expiry', 'Your credit balance never expires. Unused balance carries forward indefinitely.'],
            ] as [string, string][]).map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8c5c0', flexShrink: 0, marginTop: '0.6rem' }} />
                <div>
                  <p style={{ marginTop: 0, marginBottom: '0.4rem', marginLeft: 0, marginRight: 0, fontSize: '0.95rem', fontWeight: 500, color: '#1a1a1a' }}>{title}</p>
                  <p style={{ margin: 0, fontSize: '0.87rem', color: '#666', fontWeight: 300, lineHeight: 1.75 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}