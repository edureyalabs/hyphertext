'use client';
import { useState, useEffect } from 'react';
import {
  getSubscription,
  createSubscriptionOrder,
  verifyAndUpgradeSubscription,
  type Subscription,
  type SubscriptionTier,
} from '@/lib/api';

interface HostingTabProps {
  userId: string;
}

export default function HostingTab({ userId }: HostingTabProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const { subscription: sub, tiers: t } = await getSubscription();
    setSubscription(sub);
    setTiers(t);
    setLoading(false);
  };

  const handleUpgradeToPro = async () => {
    setPaying(true);
    setPayError('');
    setPaySuccess('');

    const { order, razorpayKeyId, amountUSD, error } = await createSubscriptionOrder('pro');
    if (error || !order) {
      setPayError(error || 'Failed to create order');
      setPaying(false);
      return;
    }

    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.body.appendChild(script);
      });
    }

    await new Promise<void>((resolve) => {
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Hyphertext',
        description: 'Pro Plan — 1 month unlimited hosting',
        order_id: order.id,
        handler: async (response: any) => {
          const result = await verifyAndUpgradeSubscription(
            'pro',
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
          if (result.success) {
            setPaySuccess('Successfully upgraded to Pro. All your sites are now live!');
            await loadData();
          } else {
            setPayError(result.error || 'Verification failed');
          }
          setPaying(false);
          resolve();
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            resolve();
          },
        },
        theme: { color: '#111111' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (res: any) => {
        setPayError(res.error?.description || 'Payment failed');
        setPaying(false);
        resolve();
      });
      rzp.open();
    });
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isOnPro = subscription?.tier === 'pro';
  const isExpired = subscription?.status === 'expired';

  if (loading) {
    return (
      <div style={{ paddingTop: '4rem', display: 'flex', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>hosting</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.025em', margin: 0, color: '#111' }}>Hosting plan</h1>
      </div>

      {/* Current plan card */}
      {subscription && (
        <div style={{ background: '#111', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>current plan</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 300, color: '#f8f7f4', letterSpacing: '-0.02em', fontFamily: "'DM Mono', monospace" }}>
                  {isOnPro ? 'Pro' : 'Free'}
                </p>
                {isOnPro && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '3px', padding: '0.1rem 0.45rem' }}>
                    active
                  </span>
                )}
                {isExpired && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '3px', padding: '0.1rem 0.45rem' }}>
                    expired
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>
                {isOnPro
                  ? 'Unlimited hosted sites · 5,000 total pages'
                  : '1 hosted site · 5,000 total pages'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 0.2rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                {isOnPro ? '$5/month' : 'free forever'}
              </p>
              {isOnPro && subscription.current_period_end && (
                <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                  renews {formatDate(subscription.current_period_end)}
                </p>
              )}
              {isExpired && (
                <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#f59e0b' }}>
                  expired · some sites may be suspended
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success / Error banners */}
      {paySuccess && (
        <div style={{ background: '#f0faf4', border: '1px solid #b7e9ca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#2a9d5c', fontSize: '0.9rem' }}>✓</span>
          <span style={{ fontSize: '0.82rem', color: '#1a7a47', fontWeight: 300 }}>{paySuccess}</span>
        </div>
      )}
      {payError && (
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#c53030', fontWeight: 300 }}>{payError}</p>
        </div>
      )}

      {/* Plan comparison cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>

        {/* Free tier card */}
        <div style={{
          background: '#fff',
          border: !isOnPro ? '2px solid #111' : '1px solid #e8e6e1',
          borderRadius: '10px',
          padding: '1.25rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#111' }}>Free</p>
              {!isOnPro && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#2a9d5c', background: '#f0faf4', border: '1px solid #b7e9ca', borderRadius: '3px', padding: '0.1rem 0.4rem' }}>current</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', fontWeight: 300 }}>1 published site · 5,000 total pages</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: 400, color: '#111' }}>Free</p>
          </div>
        </div>

        {/* Pro tier card */}
        <div style={{
          background: isOnPro ? '#111' : '#fff',
          border: isOnPro ? '2px solid #111' : '1px solid #e8e6e1',
          borderRadius: '10px',
          padding: '1.25rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          transition: 'all 0.2s',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: isOnPro ? '#f8f7f4' : '#111' }}>Pro</p>
              {isOnPro && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '3px', padding: '0.1rem 0.4rem' }}>current</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: isOnPro ? 'rgba(255,255,255,0.45)' : '#888', fontWeight: 300 }}>
              Unlimited published sites · 5,000 total pages
            </p>
            {!isOnPro && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#2a9d5c', fontWeight: 400 }}>
                ✓ Publish as many sites as you want
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ margin: '0 0 0.55rem', fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: 400, color: isOnPro ? '#f8f7f4' : '#111' }}>
              $5/mo
            </p>
            {!isOnPro && (
              <button
                onClick={handleUpgradeToPro}
                disabled={paying}
                style={{
                  background: '#111',
                  color: '#f8f7f4',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '0.45rem 1.1rem',
                  fontSize: '0.8rem',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: paying ? 'not-allowed' : 'pointer',
                  opacity: paying ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {paying && (
                  <div style={{ width: '11px', height: '11px', border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                )}
                {paying ? 'Processing...' : isExpired ? 'Renew Pro' : 'Upgrade to Pro'}
              </button>
            )}
            {isOnPro && (
              <button
                onClick={handleUpgradeToPro}
                disabled={paying}
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '5px',
                  padding: '0.35rem 0.9rem',
                  fontSize: '0.75rem',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: paying ? 'not-allowed' : 'pointer',
                  opacity: paying ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {paying ? 'Processing...' : 'Renew early'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How hosting works */}
      <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.25rem 1.5rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.85rem' }}>how hosting works</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {([
            ['Monthly billing', 'Pay $5 once a month. No automatic renewals — you get a reminder before expiry.'],
            ['Free tier', 'One published site, always free. Perfect for a personal page or portfolio.'],
            ['Pro tier', 'Publish unlimited sites simultaneously. All previously suspended sites restore immediately on upgrade.'],
            ['Expired plan', 'When Pro expires you revert to Free. Your most recently updated site stays live; the rest are paused until you renew.'],
            ['Page limit', 'All accounts can create up to 5,000 pages (published + drafts combined).'],
          ] as [string, string][]).map(([title, desc]) => (
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