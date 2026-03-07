// app/studio/[pageId]/PreviewPane.tsx
'use client';
import { useEffect, useRef, useCallback } from 'react';
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
}: PreviewPaneProps) {
  const iframeRef     = useRef<HTMLIFrameElement | null>(null);
  const htmlRef       = useRef(htmlContent);

  const writeToIframe = useCallback((html: string, iframe: HTMLIFrameElement | null) => {
    if (!iframe || !html) return;
    const doc = iframe.contentDocument;
    if (doc) { doc.open(); doc.write(html); doc.close(); }
  }, []);

  const iframeRefCallback = useCallback((iframe: HTMLIFrameElement | null) => {
    iframeRef.current = iframe;
    writeToIframe(htmlRef.current, iframe);
  }, [writeToIframe]);

  useEffect(() => {
    if (!htmlContent) return;
    htmlRef.current = htmlContent;
    if (viewMode !== 'code') writeToIframe(htmlContent, iframeRef.current);
  }, [htmlContent, viewMode, writeToIframe]);

  return (
    <div style={{
      flex: '0 0 72%',
      borderRight: '1px solid #e8e6e1',
      background: viewMode === 'code' ? '#1e1e1e' : '#e8e6e1',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {viewMode === 'preview' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
          <iframe
            ref={iframeRefCallback}
            style={{ flex: 1, border: 'none', display: 'block', background: '#fff' }}
            title="Page preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      {viewMode === 'mobile' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#e0ddd8' }}>
          <div style={{ width: '375px', height: '812px', maxHeight: '90%', background: '#fff', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.1)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '28px', background: '#111', borderRadius: '0 0 20px 20px', zIndex: 10 }} />
            <iframe
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              srcDoc={htmlContent || ''}
              title="Mobile preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}

      {viewMode === 'code' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {hasUnsyncedChanges && (
            <div style={{ background: '#1a1a2e', borderBottom: '1px solid #2d2d4e', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#6b7280' }}>unsaved changes</span>
              <button
                onClick={onSyncCode}
                disabled={syncing}
                style={{ background: syncDone ? '#2a9d5c' : '#0047AB', color: '#fff', border: 'none', padding: '0.25rem 0.65rem', borderRadius: '3px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s', opacity: syncing ? 0.5 : 1 }}
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