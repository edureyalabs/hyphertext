'use client';
import { useState } from 'react';

export default function ProjectsGrid() {
  const [projects] = useState<any[]>([]); // will be populated from Supabase later

  return (
    <div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .create-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #111;
          color: #f8f7f4;
          border: none;
          padding: 0.6rem 1.2rem;
          font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 3px;
          transition: background 0.15s, transform 0.1s;
        }
        .create-btn:hover { background: #222; transform: translateY(-1px); }
        .create-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .project-card {
          background: #fff;
          border: 1px solid #e8e6e1;
          border-radius: 6px;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .project-card:hover {
          border-color: #bbb;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
      `}</style>

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '2.5rem',
        animation: 'fadeIn 0.4s ease both',
      }}>
        <div>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.7rem',
            color: '#bbb',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>
            projects
          </p>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
            fontWeight: 300,
            letterSpacing: '-0.025em',
            margin: 0,
            color: '#111',
          }}>
            Your pages
          </h1>
        </div>

        <button className="create-btn" disabled title="Coming soon">
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
          New page
        </button>
      </div>

      {/* Projects grid or empty state */}
      {projects.length === 0 ? (
        <div style={{
          background: '#fff',
          border: '1px dashed #e0ddd8',
          borderRadius: '8px',
          padding: '5rem 2rem',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease 0.1s both',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '1.5px dashed #ddd',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ddd',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.72rem',
            color: '#ccc',
            marginBottom: '0.6rem',
          }}>
            no pages yet
          </p>

          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            color: '#444',
            margin: '0 0 0.4rem',
          }}>
            Your canvas is empty.
          </h2>

          <p style={{
            fontSize: '0.85rem',
            color: '#aaa',
            fontWeight: 300,
            margin: '0 0 2rem',
            lineHeight: 1.6,
          }}>
            Create your first page — a resume, an invitation,<br />
            a landing page, a quiz, anything.
          </p>

          <button className="create-btn" disabled>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
            New page
          </button>
          <p style={{
            marginTop: '0.9rem',
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.68rem',
            color: '#ddd',
          }}>
            coming soon
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}>
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              {/* preview thumbnail placeholder */}
              <div style={{
                height: '140px',
                background: '#f8f7f4',
                borderBottom: '1px solid #e8e6e1',
              }} />
              <div style={{ padding: '0.9rem 1rem' }}>
                <p style={{ margin: '0 0 0.2rem', fontWeight: 500, fontSize: '0.875rem', color: '#111' }}>
                  {project.title}
                </p>
                <p style={{
                  margin: 0,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.7rem',
                  color: '#bbb',
                }}>
                  {project.is_published ? '● live' : '○ draft'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}