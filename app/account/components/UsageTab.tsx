// app/account/components/UsageTab.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UsageTabProps {
  userId: string;
}

interface Wallet {
  id: string;
  token_balance: number;
  lifetime_tokens_purchased: number;
  lifetime_tokens_used: number;
  dollar_balance: number;
  lifetime_dollars_purchased: number;
  lifetime_dollars_used: number;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'credit' | 'debit';
  description: string;
  balance_after: number;
  reference_id: string | null;
  created_at: string;
  dollar_amount: number | null;
  dollar_balance_after: number | null;
  model_id: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

const PAGE_SIZE = 20;

export default function UsageTab({ userId }: UsageTabProps) {
  const [wallet, setWallet]             = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [hasMore, setHasMore]           = useState(true);
  const [walletId, setWalletId]         = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    loadInitial();
  }, [userId]);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const { data: w } = await supabase
        .from('user_wallets')
        .select(
          'id, token_balance, lifetime_tokens_purchased, lifetime_tokens_used, ' +
          'dollar_balance, lifetime_dollars_purchased, lifetime_dollars_used'
        )
        .eq('user_id', userId)
        .single();

      if (w) {
        const row = w as unknown as Wallet;
        setWallet({
          ...row,
          dollar_balance:             Number(row.dollar_balance             ?? 0),
          lifetime_dollars_purchased: Number(row.lifetime_dollars_purchased ?? 0),
          lifetime_dollars_used:      Number(row.lifetime_dollars_used      ?? 0),
        });
        setWalletId(row.id);

        const { data: txns } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('wallet_id', row.id)
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1);

        const mapped = (txns ?? []).map((t: any) => ({
          ...t,
          dollar_amount:        t.dollar_amount        != null ? Number(t.dollar_amount)        : null,
          dollar_balance_after: t.dollar_balance_after != null ? Number(t.dollar_balance_after) : null,
        }));
        setTransactions(mapped);
        setHasMore(mapped.length === PAGE_SIZE);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !walletId) return;
    setLoadingMore(true);
    try {
      const { data: txns } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .range(transactions.length, transactions.length + PAGE_SIZE - 1);

      const mapped = (txns ?? []).map((t: any) => ({
        ...t,
        dollar_amount:        t.dollar_amount        != null ? Number(t.dollar_amount)        : null,
        dollar_balance_after: t.dollar_balance_after != null ? Number(t.dollar_balance_after) : null,
      }));
      setTransactions(prev => [...prev, ...mapped]);
      setHasMore(mapped.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, walletId, transactions.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      {
        root: scrollRef.current,
        threshold: 0.1,
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const fmtTokens = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
  };

  const fmtDollars = (n: number, places = 4) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: places });

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return (
      dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' +
      dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const shortModel = (modelId: string | null) => {
    if (!modelId) return null;
    const map: Record<string, string> = {
      'together/glm-5':         'GLM-5',
      'together/glm-4.7-flash': 'GLM-Flash',
      'groq/llama-3.3-70b':     'Llama 70B',
      'groq/llama-3.1-8b':      'Llama 8B',
      'anthropic/haiku':        'Haiku',
    };
    return map[modelId] ?? modelId;
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '4rem', display: 'flex', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const dollarUsedRatio = wallet && wallet.lifetime_dollars_purchased > 0
    ? Math.min(wallet.lifetime_dollars_used / wallet.lifetime_dollars_purchased, 1)
    : 0;

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#111', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 500 }}>usage</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.025em', margin: 0, color: '#111' }}>Usage & credits</h1>
      </div>

      {!wallet ? (
        <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#999', margin: 0 }}>no wallet found</p>
          <p style={{ fontSize: '0.82rem', color: '#aaa', fontWeight: 300, marginTop: '0.4rem', marginBottom: 0 }}>Purchase credits to get started.</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {[
              {
                label: 'Balance',
                primary: fmtDollars(wallet.dollar_balance),
                secondary: fmtTokens(wallet.token_balance) + ' tokens',
                accent: wallet.dollar_balance < 0.001 ? '#e05252' : '#111',
              },
              {
                label: 'Purchased',
                primary: fmtDollars(wallet.lifetime_dollars_purchased),
                secondary: fmtTokens(wallet.lifetime_tokens_purchased) + ' tokens',
                accent: '#111',
              },
              {
                label: 'Used',
                primary: fmtDollars(wallet.lifetime_dollars_used),
                secondary: fmtTokens(wallet.lifetime_tokens_used) + ' tokens',
                accent: '#111',
              },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.1rem 1.25rem' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 0, marginBottom: '0.5rem', marginLeft: 0, marginRight: 0 }}>{stat.label}</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.15rem', fontWeight: 300, color: stat.accent, marginTop: 0, marginBottom: '0.15rem', marginLeft: 0, marginRight: 0, letterSpacing: '-0.01em' }}>
                  {stat.primary}
                </p>
                <p style={{ fontSize: '0.68rem', color: '#999', margin: 0, fontWeight: 300, fontFamily: "'DM Mono', monospace" }}>
                  {stat.secondary}
                </p>
              </div>
            ))}
          </div>

          {/* Utilisation bar */}
          {wallet.lifetime_dollars_purchased > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#444', fontWeight: 400 }}>Lifetime credit utilisation</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#666' }}>
                  {fmtDollars(wallet.lifetime_dollars_used)} / {fmtDollars(wallet.lifetime_dollars_purchased)} &nbsp;
                  ({Math.round(dollarUsedRatio * 100)}%)
                </span>
              </div>
              <div style={{ height: '4px', background: '#f0ede8', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${dollarUsedRatio * 100}%`, background: '#111', borderRadius: '2px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )}

          {/* Transactions — fixed-height scrollable container */}
          <div style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>recent transactions</p>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: '#999' }}>{transactions.length} loaded</span>
            </div>

            {transactions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#aaa', margin: 0 }}>no transactions yet</p>
              </div>
            ) : (
              /* Fixed-height scrollable list with infinite scroll */
              <div
                ref={scrollRef}
                style={{
                  height: 'min(420px, 55vh)',
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                }}
              >
                {transactions.map((txn, idx) => {
                  const hasDollar = txn.dollar_amount != null && txn.dollar_amount !== 0;
                  const dollarSign = txn.transaction_type === 'credit' ? '+' : '-';
                  const tokenAmt = txn.amount ?? 0;

                  return (
                    <div
                      key={txn.id}
                      style={{
                        padding: '0.85rem 1.5rem',
                        borderBottom: idx < transactions.length - 1 ? '1px solid #f8f7f4' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
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
                          <p style={{ marginTop: 0, marginBottom: '0.1rem', marginLeft: 0, marginRight: 0, fontSize: '0.8rem', color: '#333', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {txn.description}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#999' }}>
                              {fmtDate(txn.created_at)}
                            </p>
                            {shortModel(txn.model_id) && (
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#888', background: '#f5f3ef', borderRadius: '3px', padding: '0.05rem 0.35rem' }}>
                                {shortModel(txn.model_id)}
                              </span>
                            )}
                            {txn.transaction_type === 'debit' && (txn.input_tokens || txn.output_tokens) ? (
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#aaa' }}>
                                {fmtTokens((txn.input_tokens ?? 0) + (txn.output_tokens ?? 0))} tokens
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {hasDollar ? (
                          <>
                            <p style={{
                              marginTop: 0, marginBottom: '0.1rem', marginLeft: 0, marginRight: 0,
                              fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', fontWeight: 500,
                              color: txn.transaction_type === 'credit' ? '#2a9d5c' : '#e05252',
                            }}>
                              {dollarSign}{fmtDollars(Math.abs(txn.dollar_amount!), 4).replace('$', '')}
                            </p>
                            {txn.dollar_balance_after != null && (
                              <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#999' }}>
                                bal. {fmtDollars(txn.dollar_balance_after, 2)}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p style={{
                              marginTop: 0, marginBottom: '0.1rem', marginLeft: 0, marginRight: 0,
                              fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', fontWeight: 400,
                              color: txn.transaction_type === 'credit' ? '#2a9d5c' : '#e05252',
                            }}>
                              {txn.transaction_type === 'credit' ? '+' : '-'}{fmtTokens(Math.abs(tokenAmt))}
                            </p>
                            <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#999' }}>
                              tokens
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Sentinel element for intersection observer */}
                <div ref={sentinelRef} style={{ height: '1px' }} />

                {/* Loading more indicator */}
                {loadingMore && (
                  <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '16px', height: '16px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}

                {/* End of list indicator */}
                {!hasMore && transactions.length > 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#ccc' }}>
                      all {transactions.length} transactions loaded
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}