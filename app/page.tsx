"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const HTML_DEMO = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      font-family: 'Georgia', serif;
      background: #faf9f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      text-align: center;
      padding: 3rem;
      max-width: 480px;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 400;
      letter-spacing: -0.02em;
      color: #111;
      margin-bottom: 0.5rem;
    }
    p {
      color: #666;
      line-height: 1.7;
      font-size: 1rem;
    }
    .badge {
      display: inline-block;
      background: #111;
      color: #fff;
      font-family: monospace;
      font-size: 0.7rem;
      padding: 0.25rem 0.6rem;
      border-radius: 2px;
      margin-top: 1.5rem;
      letter-spacing: 0.08em;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Sarah & James</h1>
    <p>Together with their families,<br/>
    joyfully invite you to celebrate<br/>
    their wedding on June 14, 2025.</p>
    <span class="badge">RSVP by May 1st</span>
  </div>
</body>
</html>`;

const PROMPTS = [
  "a wedding invitation for Sarah & James",
  "a product launch countdown timer",
  "a teacher's quiz on World War II",
  "an animated personal resume",
  "a startup landing page for a coffee brand",
];

export default function Home() {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Rotate prompts with typewriter effect
  useEffect(() => {
    const prompt = PROMPTS[currentPrompt];
    let i = 0;
    setDisplayed("");
    setTyping(true);

    const typeInterval = setInterval(() => {
      if (i < prompt.length) {
        setDisplayed(prompt.slice(0, i + 1));
        i++;
      } else {
        setTyping(false);
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentPrompt((prev) => (prev + 1) % PROMPTS.length);
        }, 2200);
      }
    }, 38);

    return () => clearInterval(typeInterval);
  }, [currentPrompt]);

  // Write HTML demo into iframe
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(HTML_DEMO);
        doc.close();
      }
    }
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8f7f4",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        color: "#111",
        overflowX: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,200;0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        ::selection { background: #111; color: #f8f7f4; }

        .nav-link {
          color: #555;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 400;
          letter-spacing: 0.01em;
          transition: color 0.15s;
        }
        .nav-link:hover { color: #111; }

        .btn-primary {
          background: #111;
          color: #f8f7f4;
          border: none;
          padding: 0.6rem 1.4rem;
          font-size: 0.875rem;
          font-family: inherit;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 3px;
          text-decoration: none;
          display: inline-block;
          transition: background 0.15s, transform 0.1s;
        }
        .btn-primary:hover { background: #222; transform: translateY(-1px); }

        .btn-ghost {
          background: transparent;
          color: #111;
          border: 1px solid #d4d2cc;
          padding: 0.6rem 1.4rem;
          font-size: 0.875rem;
          font-family: inherit;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          border-radius: 3px;
          text-decoration: none;
          display: inline-block;
          transition: border-color 0.15s, transform 0.1s;
        }
        .btn-ghost:hover { border-color: #999; transform: translateY(-1px); }

        .feature-card {
          background: #fff;
          border: 1px solid #e8e6e1;
          border-radius: 6px;
          padding: 2rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card:hover { border-color: #bbb; transform: translateY(-2px); }

        .demo-window {
          background: #fff;
          border: 1px solid #e8e6e1;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 40px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
        }

        .window-bar {
          background: #f0ede8;
          border-bottom: 1px solid #e8e6e1;
          padding: 0.7rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dot { width: 10px; height: 10px; border-radius: 50%; }

        .cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: #111;
          margin-left: 1px;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .fade-in {
          animation: fadeIn 0.6s ease both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .divider {
          border: none;
          border-top: 1px solid #e8e6e1;
          margin: 0;
        }

        .use-case-pill {
          display: inline-block;
          border: 1px solid #ddd;
          border-radius: 100px;
          padding: 0.35rem 0.9rem;
          font-size: 0.8rem;
          color: #555;
          background: #fff;
          letter-spacing: 0.01em;
        }

        .mono {
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          color: #888;
        }
      `}</style>

      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(248,247,244,0.88)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e8e6e1",
          padding: "0 2rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Image
            src="/logo.png"
            alt="Hyphertext"
            width={30}
            height={30}
            style={{ borderRadius: "50%" }}
          />
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.88rem",
              fontWeight: 400,
              letterSpacing: "0.01em",
              color: "#111",
            }}
          >
            hyphertext
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a href="#how" className="nav-link">How it works</a>
          <a href="#usecases" className="nav-link">Use cases</a>
          <Link href="/auth" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "7rem 2rem 5rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5rem",
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div className="fade-in">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#fff",
              border: "1px solid #e8e6e1",
              borderRadius: "100px",
              padding: "0.3rem 0.85rem",
              marginBottom: "2rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#2a9d5c",
                display: "inline-block",
              }}
            />
            <span className="mono" style={{ color: "#555", fontSize: "0.76rem" }}>
              HTML is enough
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              margin: "0 0 1.5rem",
              color: "#0f0f0f",
            }}
          >
            Describe it.<br />
            We build it.<br />
            <span style={{ color: "#888", fontStyle: "italic" }}>
              Instantly live.
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              color: "#555",
              lineHeight: 1.75,
              fontWeight: 300,
              margin: "0 0 2.5rem",
              maxWidth: "400px",
            }}
          >
            Type a prompt. An AI agent writes a complete HTML page — 
            styled, interactive, ready to share. No setup, no deployment, 
            no code required.
          </p>

          {/* Prompt input mock */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "6px",
              padding: "0.85rem 1.1rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span className="mono" style={{ color: "#bbb", userSelect: "none" }}>
              ~/
            </span>
            <span
              style={{
                fontSize: "0.9rem",
                color: "#333",
                flex: 1,
                fontWeight: 300,
                letterSpacing: "0.01em",
                minHeight: "1.3em",
              }}
            >
              {displayed}
              {typing && <span className="cursor" />}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/auth" className="btn-primary">
              Start building free
            </Link>
            <a href="#demo" className="btn-ghost">
              See demo
            </a>
          </div>

          <p
            style={{
              marginTop: "1.2rem",
              fontSize: "0.78rem",
              color: "#aaa",
              letterSpacing: "0.02em",
            }}
          >
            No credit card. Your page live in seconds.
          </p>
        </div>

        {/* Right — Browser window demo */}
        <div
          className="fade-in demo-window"
          style={{ animationDelay: "0.15s" }}
          id="demo"
        >
          <div className="window-bar">
            <div className="dot" style={{ background: "#f87171" }} />
            <div className="dot" style={{ background: "#fbbf24" }} />
            <div className="dot" style={{ background: "#4ade80" }} />
            <div
              style={{
                flex: 1,
                marginLeft: "0.75rem",
                background: "#fff",
                borderRadius: "3px",
                padding: "0.2rem 0.75rem",
                fontSize: "0.72rem",
                fontFamily: "'DM Mono', monospace",
                color: "#999",
                border: "1px solid #e8e6e1",
              }}
            >
              hyphertext.com/sarah/wedding-invite
            </div>
          </div>
          <iframe
            ref={iframeRef}
            style={{
              width: "100%",
              height: "340px",
              border: "none",
              display: "block",
            }}
            title="Demo page"
            sandbox="allow-scripts"
          />
        </div>
      </section>

      <hr className="divider" />

      {/* HOW IT WORKS */}
      <section
        id="how"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "6rem 2rem",
          textAlign: "center",
        }}
      >
        <p className="mono" style={{ marginBottom: "1rem" }}>how it works</p>
        <h2
          style={{
            fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
            fontWeight: 300,
            letterSpacing: "-0.025em",
            margin: "0 0 1rem",
          }}
        >
          Three steps. One URL.
        </h2>
        <p
          style={{
            color: "#777",
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth: "480px",
            margin: "0 auto 4rem",
          }}
        >
          From a thought in your head to a live page on the internet 
          — faster than opening a text editor.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            textAlign: "left",
          }}
        >
          {[
            {
              step: "01",
              title: "Describe",
              body: "Type what you want. An invitation, a quiz, a landing page, a portfolio. Plain English.",
            },
            {
              step: "02",
              title: "Generate",
              body: "Our agent writes complete HTML, CSS, and JS — one clean file, no dependencies.",
            },
            {
              step: "03",
              title: "Publish",
              body: "Hit publish. Your page is live instantly at your own URL. Share it anywhere.",
            },
          ].map((item) => (
            <div key={item.step} className="feature-card">
              <div
                className="mono"
                style={{ marginBottom: "1rem", color: "#ccc" }}
              >
                {item.step}
              </div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  margin: "0 0 0.6rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "#666",
                  lineHeight: 1.7,
                  margin: 0,
                  fontWeight: 300,
                }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* USE CASES */}
      <section
        id="usecases"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "6rem 2rem",
          textAlign: "center",
        }}
      >
        <p className="mono" style={{ marginBottom: "1rem" }}>use cases</p>
        <h2
          style={{
            fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
            fontWeight: 300,
            letterSpacing: "-0.025em",
            margin: "0 0 1rem",
          }}
        >
          HTML can be anything.
        </h2>
        <p
          style={{
            color: "#777",
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth: "480px",
            margin: "0 auto 3rem",
          }}
        >
          The browser is the most universal runtime ever built. 
          A single file of HTML, CSS, and JS can render virtually anything.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
            justifyContent: "center",
            marginBottom: "4rem",
          }}
        >
          {[
            "Wedding invitation",
            "Teacher's quiz",
            "Product launch page",
            "Animated resume",
            "Event RSVP",
            "Link in bio",
            "Countdown timer",
            "Menu card",
            "Pitch deck",
            "Portfolio",
            "Micro tool",
            "Photo gallery",
            "Sales one-pager",
            "Newsletter archive",
            "Documentation",
          ].map((item) => (
            <span key={item} className="use-case-pill">
              {item}
            </span>
          ))}
        </div>

        {/* Stat row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2rem",
            borderTop: "1px solid #e8e6e1",
            paddingTop: "3rem",
          }}
        >
          {[
            { value: "<10s", label: "from prompt to live page" },
            { value: "1 file", label: "HTML, CSS, JS — self-contained" },
            { value: "∞", label: "things you can build" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 300,
                  letterSpacing: "-0.03em",
                  marginBottom: "0.4rem",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{ fontSize: "0.82rem", color: "#888", fontWeight: 300 }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* CTA */}
      <section
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "7rem 2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
          }}
        >
          <Image
            src="/logo.png"
            alt="Hyphertext"
            width={40}
            height={40}
            style={{ borderRadius: "50%" }}
          />
        </div>
        <h2
          style={{
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            fontWeight: 300,
            letterSpacing: "-0.025em",
            margin: "0 0 1rem",
            lineHeight: 1.2,
          }}
        >
          The web is still the most powerful<br />
          <span style={{ color: "#888", fontStyle: "italic" }}>
            publishing platform ever built.
          </span>
        </h2>
        <p
          style={{
            color: "#777",
            fontWeight: 300,
            lineHeight: 1.7,
            margin: "0 auto 2.5rem",
            maxWidth: "420px",
          }}
        >
          You just needed an easier way in.
        </p>
        <Link href="/auth" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
          Start for free
        </Link>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid #e8e6e1",
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Image
            src="/logo.png"
            alt="Hyphertext"
            width={22}
            height={22}
            style={{ borderRadius: "50%", opacity: 0.6 }}
          />
          <span
            className="mono"
            style={{ color: "#aaa", fontSize: "0.78rem" }}
          >
            hyphertext.com
          </span>
        </div>
        <span
          style={{ fontSize: "0.78rem", color: "#bbb", fontWeight: 300 }}
        >
          © 2025 Hyphertext. All rights reserved.
        </span>
      </footer>
    </main>
  );
}