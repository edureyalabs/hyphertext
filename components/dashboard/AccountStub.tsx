export default function AccountStub() {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease both' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.7rem',
          color: '#bbb',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}>
          account
        </p>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
          fontWeight: 300,
          letterSpacing: '-0.025em',
          margin: 0,
          color: '#111',
        }}>
          Your account
        </h1>
      </div>

      <div style={{
        background: '#fff',
        border: '1px dashed #e0ddd8',
        borderRadius: '8px',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.72rem',
          color: '#ccc',
          marginBottom: '0.6rem',
        }}>
          in development
        </p>
        <h2 style={{
          fontSize: '1.1rem',
          fontWeight: 300,
          letterSpacing: '-0.02em',
          color: '#444',
          margin: '0 0 0.4rem',
        }}>
          Account settings coming soon.
        </h2>
        <p style={{
          fontSize: '0.85rem',
          color: '#aaa',
          fontWeight: 300,
          margin: 0,
          lineHeight: 1.6,
        }}>
          Profile, username, avatar, and billing will live here.
        </p>
      </div>
    </div>
  );
}