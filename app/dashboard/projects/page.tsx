'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { INITIAL_BOILERPLATE } from '@/lib/boilerplate';

interface Page {
  id: string;
  title: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('pages')
      .select('id, title, is_published, created_at, updated_at')
      .order('updated_at', { ascending: false });

    setPages(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
  if (!newTitle.trim()) return;
  setCreating(true);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    setCreating(false);
    return;
  }

  // Insert page directly using the auth user id as owner_id
  // profiles.id = auth.users.id, so no separate lookup needed
  const { data: page, error } = await supabase
    .from('pages')
    .insert({
      owner_id: session.user.id,
      title: newTitle.trim(),
      html_content: INITIAL_BOILERPLATE,
      is_published: false,
    })
    .select()
    .single();

  if (error || !page) {
    console.error('Insert error:', error?.message, error?.details, error?.hint);
    setCreating(false);
    return;
  }

  setCreating(false);
  setShowModal(false);
  setNewTitle('');
  router.push(`/studio/${page.id}`);
};

  return (
    <div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        .create-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: #111; color: #f8f7f4; border: none;
          padding: 0.6rem 1.2rem; font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif; font-weight: 400;
          letter-spacing: 0.02em; cursor: pointer; border-radius: 3px;
          transition: background 0.15s, transform 0.1s;
        }
        .create-btn:hover { background: #222; transform: translateY(-1px); }
        .create-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .project-card {
          background: #fff; border: 1px solid #e8e6e1;
          border-radius: 6px; overflow: hidden;
          transition: border-color 0.2s, transform 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .project-card:hover { border-color: #bbb; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.06); }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .modal {
          background: #fff; border: 1px solid #e8e6e1;
          border-radius: 8px; padding: 2rem;
          width: 100%; max-width: 420px;
          animation: modalIn 0.2s ease both;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
        }
        .modal-input {
          width: 100%; border: 1px solid #ddd; border-radius: 4px;
          padding: 0.7rem 0.9rem; font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif; font-weight: 300;
          color: #111; background: #fafaf9; outline: none;
          transition: border-color 0.15s;
          margin-top: 0.75rem;
        }
        .modal-input:focus { border-color: #111; }
        .modal-input::placeholder { color: #bbb; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', animation: 'fadeIn 0.4s ease both' }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>projects</p>
          <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, letterSpacing: '-0.025em', margin: 0, color: '#111' }}>Your pages</h1>
        </div>
        <button className="create-btn" onClick={() => setShowModal(true)}>
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
          New page
        </button>
      </div>

      {/* Pages grid or empty state */}
      {loading ? (
        <div style={{ color: '#ccc', fontSize: '0.85rem', fontFamily: "'DM Mono', monospace" }}>loading...</div>
      ) : pages.length === 0 ? (
        <div style={{ background: '#fff', border: '1px dashed #e0ddd8', borderRadius: '8px', padding: '5rem 2rem', textAlign: 'center', animation: 'fadeIn 0.5s ease 0.1s both' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#ccc', marginBottom: '0.6rem' }}>no pages yet</p>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 300, letterSpacing: '-0.02em', color: '#444', margin: '0 0 0.4rem' }}>Your canvas is empty.</h2>
          <p style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 300, margin: '0 0 2rem', lineHeight: 1.6 }}>Create your first page — a resume, an invitation,<br />a landing page, a quiz, anything.</p>
          <button className="create-btn" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
            New page
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {pages.map(page => (
            <div key={page.id} className="project-card" onClick={() => router.push(`/studio/${page.id}`)}>
              <div style={{ height: '120px', background: '#f8f7f4', borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#ddd' }}>preview</span>
              </div>
              <div style={{ padding: '0.85rem 1rem' }}>
                <p style={{ margin: '0 0 0.3rem', fontWeight: 500, fontSize: '0.875rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: page.is_published ? '#2a9d5c' : '#bbb' }}>
                    {page.is_published ? '● live' : '○ draft'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#ccc' }}>
                    {new Date(page.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Page Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>new page</p>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#111', margin: '0 0 0.25rem' }}>Name your project</h2>
            <p style={{ fontSize: '0.82rem', color: '#aaa', fontWeight: 300, margin: 0 }}>You can change this later.</p>
            <input
              className="modal-input"
              type="text"
              placeholder="e.g. Wedding Invite, My Portfolio, Quiz..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowModal(false); }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: '1px solid #ddd', color: '#777', padding: '0.55rem 1rem', borderRadius: '3px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button className="create-btn" onClick={handleCreate} disabled={!newTitle.trim() || creating}>
                {creating ? 'Creating...' : 'Create & open →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}