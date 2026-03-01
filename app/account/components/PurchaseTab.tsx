// app/account/components/PurchaseTab.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PurchaseTabProps {
  userId: string;
}

type PurchaseState = 'idle' | 'creating' | 'checkout' | 'verifying' | 'success' | 'error';

export default function PurchaseTab({ userId }: PurchaseTabProps) {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [tokensPerDollar, setTokensPerDollar] = useState(100000);
  const [amountUSD, setAmountUSD] = useState('5');
  const [state, setState] = useState<PurchaseState>('idle');
  const [error, setError] = useState('');
  const [lastPurchased, setLastPurchased] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Load wallet
      if (userId) {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('token_balance')
          .eq('user_id', userId)
          .single();
        if (wallet) setWalletBalance(wallet.token_balance);
      }
      // Load token price
      const res = await fetch('/api/wallet/price');
      const data = await res.json();
      if (data.data) setTokensPerDollar(data.data);
    } catch {
      // silent
    } finally {
      setLoadingData(false);
    }
  };

  const parsedAmount = parseFloat(amountUSD) || 0;
  const tokenPreview = Math.floor(parsedAmount * tokensPerDollar);
  const isValidAmount = parsedAmount >= 1;

  const formatTokens = (n: number) =>
    n >= 1_000_000
      ? (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
      : n >= 1_000
      ? (n / 1_000).toFixed(0) + 'K'
      : n.toLocaleString();

  const handlePurchase = async () => {
    if (!isValidAmount || !userId) return;
    setState('creating');
    setError('');

    try {
      // Step 1: create order
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
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
      }

      setState('checkout');

      // Step 3: open Razorpay
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'Hyphertext',
          description: `${formatTokens(tokenPreview)} tokens`,
          order_id: orderData.order.id,
          handler: async (response: any) => {
            setState('verifying');
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setLastPurchased(tokenPreview);
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
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>tokens</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.025em', margin: 0, color: '#111' }}>Purchase tokens</h1>
      </div>

      {/* Wallet balance card */}
      <div style={{
        background: '#111', borderRadius: '10px', padding: '1.5rem',
        marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>current balance</p>
          {loadingData ? (
            <div style={{ width: '80px', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
          ) : (
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 300, color: '#f8f7f4', letterSpacing: '-0.02em', fontFamily: "'DM Mono', monospace" }}>
              {walletBalance !== null ? formatTokens(walletBalance) : '—'}
            </p>
          )}
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>tokens available</p>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Rate info */}
      <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2a9d5c', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', fontWeight: 300 }}>
          Current rate: <strong style={{ fontWeight: 500, color: '#111' }}>{tokensPerDollar.toLocaleString()} tokens</strong> per $1 USD
        </p>
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
              background: '#fff', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            placeholder="5"
          />
        </div>

        {/* Token preview */}
        <div style={{
          background: '#f8f7f4', border: '1px solid #ece9e4', borderRadius: '6px',
          padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 300 }}>You receive</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 300, letterSpacing: '-0.02em', color: '#111', fontFamily: "'DM Mono', monospace" }}>
            {isValidAmount ? formatTokens(tokenPreview) : '—'}
            <span style={{ fontSize: '0.75rem', color: '#bbb', marginLeft: '0.4rem' }}>tokens</span>
          </span>
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {[1, 5, 10, 25].map(amt => (
            <button
              key={amt}
              onClick={() => setAmountUSD(String(amt))}
              disabled={isProcessing || state === 'success'}
              style={{
                flex: 1, padding: '0.4rem', border: `1px solid ${amountUSD === String(amt) ? '#111' : '#e0ddd8'}`,
                borderRadius: '4px', background: amountUSD === String(amt) ? '#111' : 'transparent',
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
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#2a9d5c', fontWeight: 300 }}>{formatTokens(lastPurchased)} tokens added to your account.</p>
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
            transition: 'opacity 0.15s, background 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          {isProcessing && (
            <div style={{ width: '14px', height: '14px', border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#f8f7f4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          )}
          {state === 'creating' && 'Creating order…'}
          {state === 'verifying' && 'Verifying payment…'}
          {state === 'checkout' && 'Complete in Razorpay…'}
          {state === 'success' && '✓ Purchase complete'}
          {(state === 'idle' || state === 'error') && `Pay $${parsedAmount.toFixed(2)} USD →`}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#ccc', marginTop: '0.75rem', fontWeight: 300 }}>
          Secured by Razorpay · cards, UPI, net banking supported
        </p>
      </div>

      {/* How tokens work */}
      <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.5rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 1rem' }}>how tokens work</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[
            ['Purchase', 'Buy tokens at the current rate. Token price can change over time.'],
            ['AI usage', 'Tokens are consumed each time the AI agent edits or generates a page.'],
            ['No expiry', 'Your tokens never expire. Unused balance carries forward indefinitely.'],
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