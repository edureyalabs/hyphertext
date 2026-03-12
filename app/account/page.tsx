'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSession, type ApiUser } from '@/lib/api';
import AccountTab from './components/AccountTab';
import PurchaseTab from './components/PurchaseTab';
import UsageTab from './components/UsageTab';
import HostingTab from './components/HostingTab';

type Tab = 'account' | 'purchase' | 'usage' | 'hosting';

const Spinner = () => (
  <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('account');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null;
    if (tabParam && ['account', 'purchase', 'usage', 'hosting'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.replace('/auth');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) return <Spinner />;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'hosting',
      label: 'Hosting',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="3" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="1" y="9" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="3.5" cy="5" r="0.7" fill="currentColor"/>
          <circle cx="3.5" cy="11" r="0.7" fill="currentColor"/>
        </svg>
      ),
    },
    {
      id: 'purchase',
      label: 'Tokens',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 2h2l2.4 7.6a1 1 0 00.96.73h5.28a1 1 0 00.96-.72L15 5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6.5" cy="13.5" r="1" fill="currentColor"/>
          <circle cx="12.5" cy="13.5" r="1" fill="currentColor"/>
        </svg>
      ),
    },
    {
      id: 'usage',
      label: 'Usage',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 13V7M6 13V4M10 13V9M14 13V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #111; color: #f8f7f4; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
        .back-btn {
          display: inline-flex; align-items: center; gap: 0.45rem;
          background: transparent; border: 1px solid #e8e6e1; border-radius: 5px;
          padding: 0.32rem 0.75rem 0.32rem 0.6rem; font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif; font-weight: 400; color: #777;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.13s, color 0.13s, background 0.13s;
        }
        .back-btn:hover { border-color: #ccc; color: #111; background: #fff; }
        .tab-btn {
          display: flex; align-items: center; gap: 0.55rem;
          width: 100%; padding: 0.6rem 0.85rem; border: none;
          background: transparent; border-radius: 6px; font-size: 0.83rem;
          font-family: 'DM Sans', sans-serif; font-weight: 400;
          color: #888; cursor: pointer; text-align: left;
          transition: background 0.12s, color 0.12s;
          border-left: 2px solid transparent;
        }
        .tab-btn:hover { background: #f5f3ef; color: #444; }
        .tab-btn.active { background: #f0ede8; color: #111; font-weight: 500; border-left-color: #111; }
      `}</style>

      <header style={{ height: '52px', background: '#fff', borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/dashboard/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Hyphertext" width={26} height={26} style={{ borderRadius: '50%' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: '#111', letterSpacing: '0.01em' }}>hyphertext</span>
        </Link>
        <Link href="/dashboard/projects" className="back-btn">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to dashboard
        </Link>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 52px)' }}>
        <aside style={{ width: '220px', flexShrink: 0, background: '#fff', borderRight: '1px solid #e8e6e1', display: 'flex', flexDirection: 'column', padding: '1.75rem 0.75rem', gap: '0.1rem' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#ccc', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.85rem 0.35rem' }}>settings</p>

          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f0ede8' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#ccc', margin: '0 0 0.25rem 0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>signed in as</p>
            <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 0 0.35rem', fontWeight: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </aside>

        <main style={{ flex: 1, overflow: 'auto', padding: '2.5rem' }}>
          <div style={{ maxWidth: '640px', animation: 'fadeIn 0.3s ease both' }}>
            {activeTab === 'account'  && <AccountTab user={user} />}
            {activeTab === 'hosting'  && <HostingTab userId={user?.id ?? ''} />}
            {activeTab === 'purchase' && <PurchaseTab userId={user?.id ?? ''} />}
            {activeTab === 'usage'    && <UsageTab userId={user?.id ?? ''} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AccountContent />
    </Suspense>
  );
}