// app/account/components/UsageTab.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UsageTabProps {
  userId: string;
}

interface Wallet {
  id: string;
  token_balance: number;
  lifetime_tokens_purchased: number;
  lifetime_tokens_used: number;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'credit' | 'debit';
  description: string;
  balance_after: number;
  reference_id: string | null;
  created_at: string;
}

export default function UsageTab({ userId }: UsageTabProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: w } = await supabase
        .from('user_wallets')
        .select('id, token_balance, lifetime_tokens_purchased, lifetime_tokens_used')
        .eq('user_id', userId)
        .single();

      if (w) {
        setWallet(w);

        const { data: txns } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('wallet_id', w.id)
          .order('created_at', { ascending: false })
          .limit(20);

        setTransactions(txns ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · '
      + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '4rem', display: 'flex', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const usedRatio = wallet && wallet.lifetime_tokens_purchased > 0
    ? Math.min(wallet.lifetime_tokens_used / wallet.lifetime_tokens_purchased, 1)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>usage</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.025em', margin: 0, color: '#111' }}>Usage metrics</h1>
      </div>

      {!wallet ? (
        <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#ccc' }}>no wallet found</p>
          <p style={{ fontSize: '0.82rem', color: '#bbb', fontWeight: 300, marginTop: '0.4rem' }}>Purchase tokens to get started.</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Balance', value: fmt(wallet.token_balance), sub: 'available', accent: wallet.token_balance < 0 ? '#e05252' : '#111' },
              { label: 'Purchased', value: fmt(wallet.lifetime_tokens_purchased), sub: 'lifetime', accent: '#111' },
              { label: 'Used', value: fmt(wallet.lifetime_tokens_used), sub: 'lifetime', accent: '#111' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.1rem 1.25rem' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#ccc', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>{stat.label}</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.3rem', fontWeight: 300, color: stat.accent, margin: '0 0 0.2rem', letterSpacing: '-0.01em' }}>{stat.value}</p>
                <p style={{ fontSize: '0.7rem', color: '#ccc', margin: 0, fontWeight: 300 }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Usage bar */}
          {wallet.lifetime_tokens_purchased > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#555', fontWeight: 400 }}>Lifetime utilisation</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#888' }}>{Math.round(usedRatio * 100)}%</span>
              </div>
              <div style={{ height: '4px', background: '#f0ede8', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${usedRatio * 100}%`, background: '#111', borderRadius: '2px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )}

          {/* Transactions */}
          <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>recent transactions</p>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#ddd' }}>last 20</span>
            </div>

            {transactions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#ccc', margin: 0 }}>no transactions yet</p>
              </div>
            ) : (
              <div>
                {transactions.map((txn, idx) => (
                  <div
                    key={txn.id}
                    style={{
                      padding: '0.85rem 1.5rem',
                      borderBottom: idx < transactions.length - 1 ? '1px solid #f8f7f4' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                      {/* Type badge */}
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: txn.transaction_type === 'credit' ? '#f0faf4' : '#fff5f5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${txn.transaction_type === 'credit' ? '#b7e9ca' : '#fecaca'}`,
                      }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          {txn.transaction_type === 'credit' ? (
                            <path d="M5 1v8M1 5h8" stroke="#2a9d5c" strokeWidth="1.5" strokeLinecap="round"/>
                          ) : (
                            <path d="M1 5h8" stroke="#e05252" strokeWidth="1.5" strokeLinecap="round"/>
                          )}
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: '0 0 0.15rem', fontSize: '0.8rem', color: '#333', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {txn.description}
                        </p>
                        <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb' }}>
                          {fmtDate(txn.created_at)}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{
                        margin: '0 0 0.15rem', fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', fontWeight: 400,
                        color: txn.transaction_type === 'credit' ? '#2a9d5c' : '#e05252',
                      }}>
                        {txn.transaction_type === 'credit' ? '+' : '-'}{fmt(Math.abs(txn.amount))}
                      </p>
                      <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#ccc' }}>
                        bal. {fmt(txn.balance_after)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}