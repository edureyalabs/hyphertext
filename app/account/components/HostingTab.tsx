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

const TIER_ORDER = ['free', 'starter', 'builder', 'studio', 'agency'];

export default function HostingTab({ userId }: HostingTabProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
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

  const handleUpgrade = async (tier: string) => {
    if (tier === 'free') return;
    setPaying(tier);
    setPayError('');
    setPaySuccess('');

    const { order, razorpayKeyId, amountUSD, error } = await createSubscriptionOrder(tier);
    if (error || !order) {
      setPayError(error || 'Failed to create order');
      setPaying(null);
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
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan - 1 month`,
        order_id: order.id,
        handler: async (response: any) => {
          const result = await verifyAndUpgradeSubscription(
            tier,
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
          if (result.success) {
            setPaySuccess(`Successfully upgraded to ${tier} plan.`);
            await loadData();
          } else {
            setPayError(result.error || 'Verification failed');
          }
          setPaying(null);
          resolve();
        },
        modal: {
          ondismiss: () => {
            setPaying(null);
            resolve();
          },
        },
        theme: { color: '#111111' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (res: any) => {
        setPayError(res.error?.description || 'Payment failed');
        setPaying(null);
        resolve();
      });
      rzp.open();
    });
  };

  const currentTierIndex = TIER_ORDER.indexOf(subscription?.tier || 'free');

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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

      {subscription && (
        <div style={{ background: '#111', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>current plan</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 0.2rem', fontSize: '1.6rem', fontWeight: 300, color: '#f8f7f4', letterSpacing: '-0.02em', fontFamily: "'DM Mono', monospace" }}>
                {subscription.label}
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>
                {subscription.site_limit} site{subscription.site_limit === 1 ? '' : 's'} - {subscription.page_limit} total pages
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 0.2rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                {subscription.price_usd === 0 ? 'free forever' : `$${subscription.price_usd}/month`}
              </p>
              {subscription.current_period_end && subscription.tier !== 'free' && (
                <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                  renews {formatDate(subscription.current_period_end)}
                </p>
              )}
              {subscription.status === 'expired' && (
                <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#f59e0b' }}>
                  expired - some sites may be suspended
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {paySuccess && (
        <div style={{ background: '#f0faf4', border: '1px solid #b7e9ca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#2a9d5c' }}>Done.</span>
          <span style={{ fontSize: '0.82rem', color: '#1a7a47', fontWeight: 300 }}>{paySuccess}</span>
        </div>
      )}

      {payError && (
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#c53030', fontWeight: 300 }}>{payError}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
        {tiers.map(tier => {
          const tierIndex = TIER_ORDER.indexOf(tier.tier);
          const isCurrent = subscription?.tier === tier.tier;
          const isDowngrade = tierIndex < currentTierIndex;
          const isUpgrade = tierIndex > currentTierIndex;
          const isProcessing = paying === tier.tier;

          return (
            <div
              key={tier.tier}
              style={{
                background: '#fff',
                border: isCurrent ? '2px solid #111' : '1px solid #e8e6e1',
                borderRadius: '10px',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: '#111' }}>{tier.label}</p>
                  {isCurrent && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#2a9d5c', background: '#f0faf4', border: '1px solid #b7e9ca', borderRadius: '3px', padding: '0.1rem 0.4rem' }}>current</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#888', fontWeight: 300 }}>
                  {tier.site_limit} hosted site{tier.site_limit === 1 ? '' : 's'} - {tier.page_limit} total pages
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: '0 0 0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.95rem', fontWeight: 400, color: '#111' }}>
                  {tier.price_usd === 0 ? 'Free' : `$${tier.price_usd}/mo`}
                </p>
                {!isCurrent && tier.tier !== 'free' && (
                  <button
                    onClick={() => handleUpgrade(tier.tier)}
                    disabled={!!paying || isDowngrade}
                    style={{
                      background: isUpgrade ? '#111' : 'transparent',
                      color: isUpgrade ? '#f8f7f4' : '#bbb',
                      border: `1px solid ${isUpgrade ? '#111' : '#ddd'}`,
                      borderRadius: '5px',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: (isDowngrade || !!paying) ? 'not-allowed' : 'pointer',
                      opacity: (isDowngrade || (!!paying && !isProcessing)) ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isProcessing ? 'Processing...' : isDowngrade ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.25rem 1.5rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.85rem' }}>how hosting works</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            ['Monthly billing', 'Pay once a month. No automatic renewals. You get a reminder before expiry.'],
            ['Site limits', 'Your published site count is checked at publish time. Most recently updated sites stay active if you downgrade.'],
            ['Suspended sites', 'If your plan expires, sites beyond your limit are paused. They restore automatically when you renew.'],
            ['Page limit', 'All tiers allow up to 500 total pages (published and drafts combined) per account.'],
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