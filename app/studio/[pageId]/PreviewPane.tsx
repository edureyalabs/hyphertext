// app/studio/[pageId]/PreviewPane.tsx
'use client';
import dynamic from 'next/dynamic';

type ViewMode = 'preview' | 'mobile' | 'code';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface PreviewPaneProps {
  viewMode: ViewMode;
  htmlContent: string;
  editedCode: string;
  hasUnsyncedChanges: boolean;
  syncing: boolean;
  syncDone: boolean;
  onCodeChange: (val: string) => void;
  onSyncCode: () => void;
  pageId?: string;
  isPublished?: boolean;
}

export default function PreviewPane({
  viewMode,
  htmlContent,
  editedCode,
  hasUnsyncedChanges,
  syncing,
  syncDone,
  onCodeChange,
  onSyncCode,
  pageId,
  isPublished,
}: PreviewPaneProps) {
  const publishUrl = pageId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${pageId}`
    : '';

  const addressBarText = isPublished && pageId
    ? publishUrl
    : 'draft · not published';

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: '#e0ddd8',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {viewMode === 'preview' && (
        <div style={{
          position: 'absolute',
          inset: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow:
            '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 20px 56px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.07)',
        }}>
          {/* Browser chrome */}
          <div style={{
            height: '38px',
            minHeight: '38px',
            background: '#f5f3ef',
            borderBottom: '1px solid #e8e6e1',
            display: 'flex',
            alignItems: 'center',
            padding: '0 0.75rem',
            gap: '0.6rem',
            flexShrink: 0,
          }}>
            {/* Traffic lights */}
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
            </div>
            {/* Address bar */}
            <div style={{
              flex: 1,
              background: '#fff',
              border: '1px solid #e0ddd8',
              borderRadius: '5px',
              padding: '0.2rem 0.65rem',
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.65rem',
              color: '#999',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {addressBarText}
            </div>
          </div>
          {/* iframe */}
          <iframe
            key={htmlContent}
            srcDoc={htmlContent || ''}
            style={{ flex: 1, border: 'none', display: 'block', background: '#fff' }}
            title="Page preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      {viewMode === 'mobile' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{
            width: '375px',
            height: '812px',
            maxHeight: '90%',
            background: '#fff',
            borderRadius: '40px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.1)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '28px', background: '#111', borderRadius: '0 0 20px 20px', zIndex: 10 }} />
            <iframe
              key={htmlContent}
              srcDoc={htmlContent || ''}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title="Mobile preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}

      {viewMode === 'code' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e1e1e' }}>
          {hasUnsyncedChanges && (
            <div style={{
              background: '#1a1a2e',
              borderBottom: '1px solid #2d2d4e',
              padding: '0.4rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#6b7280' }}>
                unsaved changes
              </span>
              <button
                onClick={onSyncCode}
                disabled={syncing}
                style={{
                  background: syncDone ? '#2a9d5c' : '#0047AB',
                  color: '#fff',
                  border: 'none',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'background 0.15s',
                  opacity: syncing ? 0.5 : 1,
                }}
              >
                {syncing ? 'Saving...' : syncDone ? '✓ Saved' : 'Sync & save'}
              </button>
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <MonacoEditor
              height="100%"
              language="html"
              theme="vs-dark"
              value={editedCode}
              onChange={(val) => onCodeChange(val ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                fontFamily: "'DM Mono', 'Fira Code', monospace",
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}