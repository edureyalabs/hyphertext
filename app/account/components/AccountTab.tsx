// app/account/components/AccountTab.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ApiUser } from '@/lib/api';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface AccountTabProps {
  user: ApiUser | null;
}

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function AccountTab({ user }: AccountTabProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Form fields
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Username availability
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChecked = useRef('');

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setUsername(data.username ?? '');
          setDisplayName(data.display_name ?? '');
          setAvatarUrl(data.avatar_url ?? null);
        }
        setLoading(false);
      });
  }, [user?.id]);

  // Username validation + debounced availability check
  const handleUsernameChange = useCallback((val: string) => {
    setUsername(val);
    setSaved(false);

    if (usernameTimer.current) clearTimeout(usernameTimer.current);

    const trimmed = val.trim().toLowerCase();

    if (!trimmed) {
      setUsernameState('idle');
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameState('invalid');
      return;
    }

    // If same as current profile username, no need to check
    if (trimmed === profile?.username) {
      setUsernameState('idle');
      return;
    }

    setUsernameState('checking');

    usernameTimer.current = setTimeout(async () => {
      if (trimmed === lastChecked.current) return;
      lastChecked.current = trimmed;

      const { data } = await supabase.rpc('check_username_available', {
        p_username: trimmed,
        p_current_user_id: user?.id ?? null,
      });

      setUsernameState(data === true ? 'available' : 'taken');
    }, 500);
  }, [profile?.username, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (usernameState === 'taken' || usernameState === 'invalid' || usernameState === 'checking') return;

    setSaving(true);
    setSaveError('');

    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim().toLowerCase() || null,
        display_name: displayName.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      // Unique constraint violation
      if (error.code === '23505') {
        setSaveError('That username is already taken.');
        setUsernameState('taken');
      } else {
        setSaveError(error.message);
      }
    } else {
      setSaved(true);
      setUsernameState('idle');
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    const res = await fetch('/api/profiles/upload-avatar', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    setUploading(false);

    if (!data.success) {
      setUploadError(data.error ?? 'Upload failed');
    } else {
      setAvatarUrl(data.url + '?t=' + Date.now()); // bust cache
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const usernameHint = () => {
    switch (usernameState) {
      case 'checking': return { color: '#aaa', text: 'Checking…' };
      case 'available': return { color: '#2a9d5c', text: '✓ Available' };
      case 'taken': return { color: '#e05252', text: '✗ Already taken' };
      case 'invalid': return { color: '#e05252', text: 'Letters, numbers, underscores only. 3–20 chars.' };
      default: return null;
    }
  };

  const hint = usernameHint();

  const canSave =
    !saving &&
    usernameState !== 'taken' &&
    usernameState !== 'invalid' &&
    usernameState !== 'checking';

  if (loading) {
    return (
      <div style={{ padding: '3rem 0', display: 'flex', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '20px', height: '20px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const initials = (displayName || user?.email || '?')[0].toUpperCase();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>account</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.025em', margin: 0, color: '#111' }}>Account settings</h1>
      </div>

      {/* ── Avatar ── */}
      <section style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 1rem' }}>profile photo</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Avatar preview */}
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #e8e6e1', flexShrink: 0, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.2rem', color: '#bbb' }}>{initials}</span>
            )}
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '16px', height: '16px', border: '1.5px solid #ddd', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                background: 'transparent', border: '1px solid #ddd', borderRadius: '5px',
                padding: '0.45rem 0.9rem', fontSize: '0.8rem', color: '#555',
                fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                transition: 'border-color 0.13s, color 0.13s',
                opacity: uploading ? 0.5 : 1,
              }}
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <p style={{ fontSize: '0.75rem', color: '#bbb', margin: '0.4rem 0 0', fontWeight: 300 }}>JPG, PNG, GIF, WEBP · max 5 MB</p>
            {uploadError && <p style={{ fontSize: '0.75rem', color: '#e05252', margin: '0.3rem 0 0' }}>{uploadError}</p>}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleAvatarUpload}
        />
      </section>

      {/* ── Profile info ── */}
      <section style={{ background: '#fff', border: '1px solid #e8e6e1', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 1.25rem' }}>profile</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Email — read only */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              style={{ ...inputStyle, background: '#fafaf9', color: '#aaa', cursor: 'not-allowed' }}
            />
            <p style={hintBase}>Your sign-in email. Cannot be changed here.</p>
          </div>

          {/* Display name */}
          <div>
            <label style={labelStyle}>Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setSaved(false); }}
              placeholder="Your full name or alias"
              style={inputStyle}
              maxLength={60}
            />
          </div>

          {/* Username */}
          <div>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              placeholder="e.g. janedoe"
              style={{
                ...inputStyle,
                borderColor: usernameState === 'taken' || usernameState === 'invalid' ? '#e05252'
                  : usernameState === 'available' ? '#2a9d5c' : undefined,
              }}
              maxLength={20}
            />
            {hint && (
              <p style={{ ...hintBase, color: hint.color, marginTop: '0.35rem' }}>{hint.text}</p>
            )}
            {!hint && (
              <p style={hintBase}>Letters, numbers, underscores only. 3–20 characters.</p>
            )}
          </div>

        </div>
      </section>

      {/* ── Save button ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            background: '#111', color: '#f8f7f4', border: 'none',
            padding: '0.6rem 1.4rem', borderRadius: '5px', fontSize: '0.83rem',
            fontFamily: "'DM Sans', sans-serif", cursor: canSave ? 'pointer' : 'not-allowed',
            opacity: canSave ? 1 : 0.4, transition: 'opacity 0.15s',
          }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span style={{ fontSize: '0.8rem', color: '#2a9d5c', fontFamily: "'DM Mono', monospace" }}>
            ✓ Saved
          </span>
        )}
        {saveError && (
          <span style={{ fontSize: '0.8rem', color: '#e05252' }}>{saveError}</span>
        )}
      </div>
    </div>
  );
}

// Shared micro-styles
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 500,
  color: '#555',
  marginBottom: '0.35rem',
  letterSpacing: '0.01em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e0ddd8',
  borderRadius: '5px',
  padding: '0.6rem 0.85rem',
  fontSize: '0.85rem',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 300,
  color: '#111',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const hintBase: React.CSSProperties = {
  fontSize: '0.72rem',
  color: '#bbb',
  margin: '0.3rem 0 0',
  fontWeight: 300,
};