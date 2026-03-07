// app/studio/[pageId]/VersionsPanel.tsx
'use client';

import { type PageVersion } from '@/lib/api';

function triggerTypeLabel(t: string): string {
  switch (t) {
    case 'agent_complete': return 'AI edit';
    case 'manual_sync':    return 'Manual sync';
    case 'revert':         return 'Reverted';
    default:               return t;
  }
}

interface VersionsPanelProps {
  versions: PageVersion[];
  revertingId: string | null;
  onRevert: (versionId: string) => void;
  onClose: () => void;
}

export default function VersionsPanel({ versions, revertingId, onRevert, onClose }: VersionsPanelProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '42px',
      right: 0,
      width: '260px',
      background: '#fff',
      border: '1px solid #e8e6e1',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      zIndex: 100,
      overflow: 'hidden',
      animation: 'fadeUp 0.15s ease both',
    }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
          version history
        </p>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0, display: 'flex' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {versions.length === 0 ? (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#ccc', textAlign: 'center', padding: '1.5rem' }}>
            no versions yet
          </p>
        ) : versions.map((v, i) => (
          <div
            key={v.id}
            style={{ padding: '0.6rem 1rem', borderBottom: i < versions.length - 1 ? '1px solid #f8f7f4' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#333', fontWeight: 400 }}>
                v{v.version_num} — {triggerTypeLabel(v.trigger_type)}
              </p>
              <p style={{ margin: '0.1rem 0 0', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb' }}>
                {new Date(v.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                {' '}
                {new Date(v.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {i === 0 ? (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#2a9d5c' }}>current</span>
            ) : (
              <button
                onClick={() => onRevert(v.id)}
                disabled={revertingId === v.id}
                style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '3px', padding: '0.2rem 0.5rem', fontSize: '0.68rem', color: '#666', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0, transition: 'border-color 0.12s, color 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#666'; }}
              >
                {revertingId === v.id ? '...' : 'Restore'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}