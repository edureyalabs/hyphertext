// app/studio/[pageId]/StudioNav.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { updatePage, type Page } from '@/lib/api';

type ViewMode = 'preview' | 'mobile' | 'code';
type InferenceMode = 'economy' | 'speed';

interface StudioNavProps {
  page: Page;
  pageId: string;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  isAgentRunning: boolean;
  inferenceMode: InferenceMode;
  hasUnsyncedChanges: boolean;
  syncing: boolean;
  syncDone: boolean;
  onSyncCode: () => void;
  onDeleteClick: () => void;
  onPageUpdate: (updated: Partial<Page>) => void;
}

export default function StudioNav({
  page,
  pageId,
  viewMode,
  onViewModeChange,
  isAgentRunning,
  inferenceMode,
  hasUnsyncedChanges,
  syncing,
  syncDone,
  onSyncCode,
  onDeleteClick,
  onPageUpdate,
}: StudioNavProps) {
  const router = useRouter();

  const isLive      = page.is_published && page.hosting_status === 'active';
  const isSuspended = page.is_published && page.hosting_status === 'suspended';

  const publishUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${pageId}`
    : `/p/${pageId}`;

  // ── Publish panel state ───────────────────────────────────────────────────
  const [publishOpen, setPublishOpen]       = useState(false);
  const [caption, setCaption]               = useState(page.caption ?? '');
  const [showOnProfile, setShowOnProfile]   = useState(page.show_on_profile ?? true);
  const [publishing, setPublishing]         = useState(false);
  const [unpublishing, setUnpublishing]     = useState(false);
  const [savingMeta, setSavingMeta]         = useState(false);
  const [metaSaved, setMetaSaved]           = useState(false);
  const [publishError, setPublishError]     = useState('');
  const [urlCopied, setUrlCopied]           = useState(false);
  const publishPanelRef = useRef<HTMLDivElement>(null);

  // Sync page prop changes into panel state
  useEffect(() => {
    setCaption(page.caption ?? '');
    setShowOnProfile(page.show_on_profile ?? true);
  }, [page.caption, page.show_on_profile]);

  // Close publish panel on outside click
  useEffect(() => {
    if (!publishOpen) return;
    const handler = (e: MouseEvent) => {
      if (publishPanelRef.current && !publishPanelRef.current.contains(e.target as Node)) {
        setPublishOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [publishOpen]);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(publishUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError('');
    const { page: updated, error, code, site_limit, tier } = await updatePage(pageId, {
      is_published: true,
      caption: caption.trim() || null,
      show_on_profile: showOnProfile,
    } as any);
    setPublishing(false);
    if (error) {
      if (code === 'hosting_limit_reached') {
        setPublishError(`Limit reached (${site_limit} site${site_limit === 1 ? '' : 's'} on ${tier} plan).`);
      } else {
        setPublishError(error);
      }
      return;
    }
    if (updated) {
      onPageUpdate({ is_published: true, caption: caption.trim() || null, show_on_profile: showOnProfile, ...updated });
      setPublishOpen(false);
    }
  };

  const handleUnpublish = async () => {
    setUnpublishing(true);
    const { page: updated } = await updatePage(pageId, { is_published: false } as any);
    setUnpublishing(false);
    if (updated) onPageUpdate({ is_published: false });
    setPublishOpen(false);
  };

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    const { page: updated } = await updatePage(pageId, {
      caption: caption.trim() || null,
      show_on_profile: showOnProfile,
    } as any);
    setSavingMeta(false);
    if (updated) onPageUpdate({ caption: caption.trim() || null, show_on_profile: showOnProfile });
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 2000);
  };

  const handleToggleProfile = async () => {
    const next = !(page.show_on_profile ?? true);
    const { page: updated } = await updatePage(pageId, { show_on_profile: next } as any);
    if (updated) onPageUpdate({ show_on_profile: next });
  };

  return (
    <nav style={{
      height: '48px',
      background: '#fff',
      borderBottom: '1px solid #e8e6e1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1rem',
      flexShrink: 0,
      gap: '1rem',
    }}>
      <style>{`
        .snav-tab { background: transparent; border: none; padding: 0.35rem 0.75rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; font-weight: 400; color: #999; cursor: pointer; border-radius: 3px; transition: background 0.12s, color 0.12s; }
        .snav-tab:hover { background: #f0ede8; color: #111; }
        .snav-tab.active { background: #111; color: #f8f7f4; }

        .snav-btn { display: inline-flex; align-items: center; gap: 0.4rem; background: transparent; border: 1px solid #ddd; padding: 0.35rem 0.75rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; font-weight: 400; color: #bbb; cursor: pointer; border-radius: 3px; transition: all 0.15s; }
        .snav-btn:hover { border-color: #e57373; color: #e57373; }

        .snav-sync { display: inline-flex; align-items: center; gap: 0.4rem; background: #0047AB; color: #fff; border: none; padding: 0.35rem 0.85rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; cursor: pointer; border-radius: 3px; transition: background 0.15s; }
        .snav-sync:hover { background: #003a8c; }
        .snav-sync:disabled { opacity: 0.5; cursor: not-allowed; }
        .snav-sync.done { background: #2a9d5c; }

        .snav-icon-btn { background: transparent; border: 1px solid #e8e6e1; border-radius: 3px; padding: 0.3rem 0.5rem; cursor: pointer; color: #aaa; display: flex; align-items: center; justify-content: center; transition: all 0.13s; }
        .snav-icon-btn:hover { border-color: #bbb; color: #555; background: #faf9f7; }

        .publish-trigger-live { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(42,157,92,0.06); border: 1px solid #2a9d5c; padding: 0.35rem 0.85rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; font-weight: 400; color: #2a9d5c; cursor: pointer; border-radius: 3px; transition: all 0.15s; }
        .publish-trigger-live:hover { background: rgba(42,157,92,0.12); }

        .publish-trigger-draft { display: inline-flex; align-items: center; gap: 0.4rem; background: #111; border: none; padding: 0.35rem 0.85rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; font-weight: 400; color: #f8f7f4; cursor: pointer; border-radius: 3px; transition: background 0.15s; }
        .publish-trigger-draft:hover { background: #333; }

        .publish-trigger-suspended { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(245,158,11,0.06); border: 1px solid #fde68a; padding: 0.35rem 0.85rem; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; color: #92400e; cursor: pointer; border-radius: 3px; }

        .pub-panel { position: absolute; top: calc(100% + 8px); right: 0; width: 290px; background: #fff; border: 1px solid #e8e6e1; border-radius: 8px; box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04); z-index: 300; overflow: hidden; animation: pubDrop 0.15s ease both; }
        @keyframes pubDrop { from { opacity: 0; transform: translateY(-5px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .pub-url-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: transparent; border: 1px solid #e0ddd8; border-radius: 4px; padding: 0.2rem 0.5rem; font-size: 0.7rem; font-family: 'DM Sans', sans-serif; color: #666; cursor: pointer; transition: all 0.13s; text-decoration: none; white-space: nowrap; }
        .pub-url-btn:hover { background: #f8f7f4; border-color: #bbb; color: #111; }
        .pub-url-btn.copied { border-color: #2a9d5c; color: #2a9d5c; }

        .toggle-row { display: flex; align-items: center; justify-content: space-between; }
        .toggle-switch { width: 34px; height: 18px; border-radius: 9px; border: none; background: #e0ddd8; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .toggle-switch.on { background: #111; }
        .toggle-knob { width: 12px; height: 12px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .toggle-switch.on .toggle-knob { left: 19px; }

        .pub-action-primary { background: #111; color: #f8f7f4; border: none; padding: 0.42rem 1rem; border-radius: 4px; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.12s; }
        .pub-action-primary:hover { background: #333; }
        .pub-action-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .pub-action-secondary { background: transparent; color: #999; border: 1px solid #ddd; padding: 0.42rem 0.85rem; border-radius: 4px; font-size: 0.78rem; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.12s; }
        .pub-action-secondary:hover { border-color: #e57373; color: #e57373; }
        .pub-action-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

        .profile-toggle-btn { display: inline-flex; align-items: center; gap: 0.35rem; background: transparent; border: 1px solid #e8e6e1; border-radius: 3px; padding: 0.3rem 0.6rem; font-size: 0.72rem; font-family: 'DM Mono', monospace; color: #aaa; cursor: pointer; transition: all 0.15s; }
        .profile-toggle-btn:hover { border-color: #bbb; color: #555; background: #faf9f7; }
        .profile-toggle-btn.visible { border-color: #111; color: #111; background: #f5f3ef; }
      `}</style>

      {/* ── Left: logo + title + agent status ───────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
        <Link href="/dashboard/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', flexShrink: 0 }}>
          <Image src="/logo.png" alt="Hyphertext" width={22} height={22} style={{ borderRadius: '50%' }} />
        </Link>
        <span style={{ color: '#ddd', fontSize: '0.75rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
          {page.title}
        </span>
        {isAgentRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '100px', padding: '0.2rem 0.6rem' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#888' }}>generating</span>
            {inferenceMode === 'speed' && <span style={{ fontSize: '0.65rem' }}>⚡</span>}
          </div>
        )}
        {isSuspended && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '100px', padding: '0.2rem 0.6rem' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#92400e' }}>hosting suspended</span>
          </div>
        )}
      </div>

      {/* ── Centre: view mode tabs ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.2rem', background: '#f8f7f4', border: '1px solid #e8e6e1', borderRadius: '5px', padding: '0.2rem' }}>
        {(['preview', 'mobile', 'code'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            className={`snav-tab${viewMode === mode ? ' active' : ''}`}
            onClick={() => onViewModeChange(mode)}
          >
            {mode === 'preview' ? 'desktop' : mode}
          </button>
        ))}
      </div>

      {/* ── Right: actions ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>

        {/* Sync code button (code view only) */}
        {viewMode === 'code' && hasUnsyncedChanges && (
          <button
            className={`snav-sync${syncDone ? ' done' : ''}`}
            onClick={onSyncCode}
            disabled={syncing}
          >
            {syncing ? 'Saving...' : syncDone ? '✓ Saved' : 'Sync code'}
          </button>
        )}

        {/* Live URL actions (when live) */}
        {isLive && (
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button className={`pub-url-btn${urlCopied ? ' copied' : ''}`} onClick={handleCopyUrl}>
              {urlCopied
                ? <><svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#2a9d5c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied</>
                : <><svg width="10" height="10" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M3 10H2a1 1 0 01-1-1V2a1 1 0 011-1h7a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> Copy URL</>
              }
            </button>
            <a href={publishUrl} target="_blank" rel="noopener noreferrer" className="pub-url-btn">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M5.5 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8.5M8 1h5m0 0v5m0-5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Open
            </a>
          </div>
        )}

        {/* Profile visibility toggle */}
        <button
          className={`profile-toggle-btn${(page.show_on_profile ?? true) ? ' visible' : ''}`}
          onClick={handleToggleProfile}
          title={(page.show_on_profile ?? true) ? 'Visible on profile — click to hide' : 'Hidden from profile — click to show'}
        >
          {(page.show_on_profile ?? true) ? (
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M1 7s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M1 7s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
          <span style={{ fontSize: '0.68rem' }}>
            {(page.show_on_profile ?? true) ? 'on profile' : 'hidden'}
          </span>
        </button>

        {/* Version history button — passed as slot via children or handled in parent */}
        {/* Delete */}
        <button className="snav-btn" onClick={onDeleteClick}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1 3.5H13M5.5 3.5V2.5C5.5 2 5.5 1.5 6.5 1.5H7.5C8.5 1.5 8.5 2 8.5 2.5V3.5M6 6V10.5M8 6V10.5M2.5 3.5L3 11.5C3 12 3.5 12.5 4 12.5H10C10.5 12.5 11 12 11 11.5L11.5 3.5H2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete
        </button>

        {/* Publish panel */}
        <div style={{ position: 'relative' }} ref={publishPanelRef}>
          {isSuspended ? (
            <button className="publish-trigger-suspended" onClick={() => router.push('/account?tab=hosting')}>
              Upgrade plan
            </button>
          ) : isLive ? (
            <button className="publish-trigger-live" onClick={() => setPublishOpen(v => !v)}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2a9d5c', display: 'inline-block' }} />
              live
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ transition: 'transform 0.15s', transform: publishOpen ? 'rotate(180deg)' : 'none' }}>
                <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          ) : (
            <button className="publish-trigger-draft" onClick={() => setPublishOpen(v => !v)}>
              Publish
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ transition: 'transform 0.15s', transform: publishOpen ? 'rotate(180deg)' : 'none' }}>
                <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {publishOpen && (
            <div className="pub-panel">
              <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid #f0ede8' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.8rem' }}>
                  {isLive ? 'publishing settings' : 'publish site'}
                </p>

                {/* Caption */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.28rem' }}>
                    <label style={{ fontSize: '0.72rem', color: '#555', fontWeight: 400 }}>Caption</label>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: caption.length > 900 ? '#e05252' : '#ccc' }}>
                      {caption.length}/1000
                    </span>
                  </div>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value.slice(0, 1000))}
                    placeholder="What's this site about? (optional)"
                    rows={3}
                    style={{ width: '100%', border: '1px solid #e0ddd8', borderRadius: '4px', padding: '0.45rem 0.6rem', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: '#333', background: '#fafaf9', outline: 'none', resize: 'none', lineHeight: 1.5, transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#111'}
                    onBlur={e => e.target.style.borderColor = '#e0ddd8'}
                  />
                </div>

                {/* Show on profile toggle */}
                <div className="toggle-row">
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#333', fontWeight: 400 }}>Show on profile</p>
                    <p style={{ margin: '0.1rem 0 0', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb' }}>
                      visible on your public profile
                    </p>
                  </div>
                  <button
                    className={`toggle-switch${showOnProfile ? ' on' : ''}`}
                    onClick={() => setShowOnProfile(v => !v)}
                    aria-label="Toggle show on profile"
                  >
                    <div className="toggle-knob" />
                  </button>
                </div>
              </div>

              {/* Error */}
              {publishError && (
                <div style={{ padding: '0.5rem 1rem', background: '#fff5f5', borderBottom: '1px solid #fecaca' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#c53030', fontWeight: 300 }}>{publishError}</p>
                  <button onClick={() => router.push('/account?tab=hosting')} style={{ marginTop: '0.25rem', background: '#111', color: '#fff', border: 'none', borderRadius: '3px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Upgrade
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ padding: '0.7rem 1rem', display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                {isLive ? (
                  <>
                    <button className="pub-action-secondary" onClick={handleUnpublish} disabled={unpublishing}>
                      {unpublishing ? 'Unpublishing…' : 'Unpublish'}
                    </button>
                    <button className="pub-action-primary" onClick={handleSaveMeta} disabled={savingMeta}>
                      {metaSaved ? '✓ Saved' : savingMeta ? 'Saving…' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button className="pub-action-primary" onClick={handlePublish} disabled={publishing} style={{ width: '100%' }}>
                    {publishing ? 'Publishing…' : '↑ Publish site'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}