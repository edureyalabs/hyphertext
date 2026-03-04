"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LiveBuildDemo from "@/app/components/LiveBuildDemo";

const WORDS = ["Imagine it.", "Describe it.", "It's live."];

export default function Home() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "erasing">("typing");

  useEffect(() => {
    const word = WORDS[wordIdx];
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (displayed.length < word.length) timer = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 55);
      else timer = setTimeout(() => setPhase("holding"), 1400);
    } else if (phase === "holding") {
      timer = setTimeout(() => setPhase("erasing"), 600);
    } else {
      if (displayed.length > 0) timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 28);
      else { setWordIdx(v => (v + 1) % WORDS.length); setPhase("typing"); }
    }
    return () => clearTimeout(timer);
  }, [displayed, phase, wordIdx]);

  return (
    <main style={{ background: "#F4F2ED", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#111", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,200;0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #111; color: #F4F2ED; }
        :root {
          --bg: #F4F2ED;
          --border: #D8D3C8;
          --text-muted: #555;
          --text-dim: #888;
          --accent: #C85A1A;
          --accent-blue: #1A5AC8;
          --accent-green: #1A8A4A;
          --accent-purple: #6B3AC8;
        }

        .cursor-blink {
          display: inline-block; width: 3px; height: 0.82em;
          background: #111; margin-left: 2px; vertical-align: middle;
          animation: blink 0.9s step-end infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .nav-link {
          font-size: 1rem;
          font-weight: 450;
          color: var(--text-muted);
          text-decoration: none;
          letter-spacing: 0.005em;
          transition: color 0.15s;
        }
        .nav-link:hover { color: #111; }

        .cta-primary {
          background: #111; color: #F4F2ED;
          text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.9rem 2rem; font-size: 0.95rem; font-weight: 500;
          letter-spacing: 0.01em; border-radius: 4px;
          transition: background 0.15s, transform 0.1s;
        }
        .cta-primary:hover { background: #1f1f1f; transform: translateY(-1px); }

        .cta-ghost {
          background: transparent; color: #555;
          text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.9rem 1.6rem; font-size: 0.92rem;
          border: 1px solid #C0BAB0; border-radius: 4px; transition: all 0.15s;
        }
        .cta-ghost:hover { border-color: #888; color: #111; }

        .feature-cell {
          padding: 2.5rem 2.5rem;
          border-right: 1px solid var(--border);
        }
        .feature-cell:last-child { border-right: none; }

        .marquee-track {
          display: flex; gap: 0; white-space: nowrap;
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .pill-tag {
          display: inline-block; border: 1px solid #C8C3B8;
          border-radius: 100px; padding: 0.38rem 1rem;
          font-size: 0.85rem; color: #555; background: #fff;
          white-space: nowrap; transition: border-color 0.15s, color 0.15s;
        }
        .pill-tag:hover { border-color: #888; color: #222; }

        .scroll-fade { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .scroll-fade.visible { opacity: 1; transform: translateY(0); }

        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }

        .accent-orange { color: var(--accent); }
        .accent-blue { color: var(--accent-blue); }
        .accent-green { color: var(--accent-green); }
        .accent-purple { color: var(--accent-purple); }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feature-row { grid-template-columns: 1fr !important; }
          .feature-cell { border-right: none !important; border-bottom: 1px solid var(--border); }
          .hero-right { display: none !important; }
        }
      `}</style>

      <ScrollObserver />

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(244,242,237,0.94)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border)",
        height: "62px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2.5rem"
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.65rem", textDecoration: "none" }}>
          <Image src="/logo.png" alt="Hyphertext" width={34} height={34} style={{ borderRadius: "50%" }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "1rem",
            color: "#111",
            letterSpacing: "0.01em",
            fontWeight: 400
          }}>
            hyphertext
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "2.25rem" }}>
          <Link href="/explore" className="nav-link">Explore</Link>
          <Link href="/auth" style={{
            background: "#111",
            color: "#F4F2ED",
            padding: "0.5rem 1.3rem",
            borderRadius: "4px",
            fontSize: "0.92rem",
            fontWeight: 500,
            textDecoration: "none",
            letterSpacing: "0.01em"
          }}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--border)", minHeight: "88vh", display: "flex", alignItems: "stretch" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "0 1.5rem", width: "100%" }}>
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "38fr 62fr", minHeight: "88vh", alignItems: "stretch" }}>

            {/* Left — 45% */}
            <div style={{
              padding: "3.5rem 2rem 3.5rem 0",
              
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.78rem",
                  color: "var(--accent)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontWeight: 500
                }}>
                  <span style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "inline-block"
                  }} />
                  the new era of web publishing
                </div>

                <h1 style={{
                  fontSize: "clamp(2.6rem, 3.7vw, 4.4rem)",
                  fontWeight: 300,
                  lineHeight: 1.08,
                  letterSpacing: "-0.04em",
                  marginBottom: "1rem",
                  color: "#0d0d0d"
                }}>
                  The fastest way to put <em style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#bbb"
                  }}>
                    anything
                  </em><br />
                  on the web.
                </h1>

                <div style={{ height: "2.75rem", display: "flex", alignItems: "center", marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 300, color: "#555", letterSpacing: "-0.01em" }}>
                    {displayed}
                    <span className="cursor-blink" />
                  </span>
                </div>

                <p style={{
                  fontSize: "1.05rem",
                  color: "#666",
                  fontWeight: 300,
                  lineHeight: 1.75,
                  maxWidth: "380px",
                  marginBottom: "1.75rem"
                }}>
                  Describe what you want — a mission dashboard, an invitation, a game, a quiz, a micro-app. AI writes the HTML. One click and it's live.
                </p>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                  <Link href="/auth" className="cta-primary">
                    Start building free
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Link>
                  <Link href="/explore" className="cta-ghost">Browse live sites</Link>
                </div>
              </div>

              {/* Stats — horizontal row */}
              <div style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "1.25rem",
                display: "flex",
                flexDirection: "row",
                gap: "0"
              }}>
                {[
                  ["instant", "prompt to live page", "var(--accent)"],
                  ["zero setup", "no server, ever", "var(--accent-blue)"],
                  ["∞", "things you can build", "var(--accent-green)"]
                ].map(([val, sub, color], i) => (
                  <div key={val} style={{
                    flex: 1,
                    paddingRight: i < 2 ? "1.5rem" : "0",
                    marginRight: i < 2 ? "1.5rem" : "0",
                    borderRight: i < 2 ? "1px solid var(--border)" : "none"
                  }}>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "1.05rem",
                      fontWeight: 450,
                      color: color as string,
                      letterSpacing: "-0.02em"
                    }}>
                      {val}
                    </div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.65rem",
                      color: "#999",
                      marginTop: "0.25rem",
                      letterSpacing: "0.02em",
                      fontWeight: 400,
                      lineHeight: 1.4
                    }}>
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — 56% — 16:9 laptop-style window with breathing room */}
            <div className="hero-right" style={{
              padding: "2rem 1.5rem 2rem 2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* 16:9 landscape window, floats centered with space around */}
              <div style={{
                width: "min(900px, 98%)",
                aspectRatio: "16 / 11",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 24px 72px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid var(--border)"
              }}>
                <LiveBuildDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────────────────── */}
      <div style={{ background: "#111", overflow: "hidden", padding: "0.9rem 0", borderBottom: "1px solid #1a1a1a" }}>
        <div className="marquee-track">
          {Array(2).fill(["cricket scorecards", "movie watchlists", "music players", "payment screens", "wedding RSVPs", "space dashboards", "finance trackers", "game prototypes", "community events", "countdowns", "portfolios", "quiz apps", "landing pages", "link in bio", "resumes", "research tools"]).flat().map((t, i) => (
            <span key={i} style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0 2rem",
              borderRight: "1px solid rgba(255,255,255,0.07)",
              fontWeight: 400
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--border)" }} className="scroll-fade">
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2.5rem" }}>
          <div style={{
            padding: "4.5rem 0 2.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem"
          }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.8rem",
              color: "#888",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              fontWeight: 500
            }}>
              how it works
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid var(--border)" }} className="feature-row">
            {[
              { n: "01", title: "Describe", body: "Type what you want in plain English. A space dashboard. A cricket scorecard. A game. A quiz. Anything.", accentColor: "var(--accent)" },
              { n: "02", title: "Generate", body: "AI writes complete HTML — styled, interactive, self-contained. One file, no dependencies, no boilerplate.", accentColor: "var(--accent-blue)" },
              { n: "03", title: "Publish", body: "Hit publish. Your page is live instantly at a real URL. Copy the link. Share it anywhere on the internet.", accentColor: "var(--accent-green)" },
            ].map((item) => (
              <div key={item.n} className="feature-cell">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.72rem",
                    color: item.accentColor as string,
                    letterSpacing: "0.1em",
                    fontWeight: 500
                  }}>
                    {item.n}
                  </span>
                </div>
                <h3 style={{ fontSize: "2rem", fontWeight: 300, letterSpacing: "-0.03em", color: "#111", marginBottom: "1rem" }}>{item.title}</h3>
                <p style={{ fontSize: "0.98rem", color: "#666", lineHeight: 1.85, fontWeight: 300 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIBE CODING ─────────────────────────────────────────────── */}
      <section style={{ background: "#111", color: "#f4f2ed", borderBottom: "1px solid #1a1a1a" }} className="scroll-fade">
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "7rem 2.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7rem", alignItems: "center" }}>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.8rem",
                color: "rgba(200,90,26,0.8)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "2rem",
                fontWeight: 500
              }}>
                vibe coding · for everyone
              </div>
              <h2 style={{
                fontSize: "clamp(2.5rem, 4vw, 3.8rem)",
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: "-0.035em",
                marginBottom: "1.75rem"
              }}>
                The web belongs<br />
                to <em style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.3)"
                }}>everyone</em><br />
                now.
              </h2>
              <p style={{
                fontSize: "1.02rem",
                color: "rgba(255,255,255,0.45)",
                fontWeight: 300,
                lineHeight: 1.9,
                maxWidth: "360px",
                marginBottom: "2.5rem"
              }}>
                Where agentic AI meets the browser. Imagine it, describe it, the AI builds it, you own it. No IDE, no terminal, no stack decisions.
              </p>
              <Link href="/auth" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#F4F2ED",
                color: "#111",
                padding: "0.9rem 1.8rem",
                borderRadius: "4px",
                fontSize: "0.92rem",
                fontWeight: 500,
                textDecoration: "none"
              }}>
                Try it free →
              </Link>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)"
            }}>
              {[
                { who: "teacher", made: "a 10-question WW2 quiz with live scoring", color: "rgba(200,90,26,0.7)" },
                { who: "cricket fan", made: "a live IPL scorecard with ball-by-ball", color: "rgba(26,90,200,0.7)" },
                { who: "couple", made: "a wedding RSVP with countdown timer", color: "rgba(200,26,100,0.7)" },
                { who: "founder", made: "a product waitlist with email capture", color: "rgba(26,138,74,0.7)" },
                { who: "student", made: "JEE physics flashcards with flip animation", color: "rgba(107,58,200,0.7)" },
                { who: "designer", made: "an animated portfolio with case studies", color: "rgba(200,90,26,0.7)" },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: "1.1rem 1.5rem",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem"
                }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.7rem",
                    color: item.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                    fontWeight: 500
                  }}>
                    a {item.who}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", fontWeight: 300 }}>
                    built {item.made}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── USE CASES ───────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--border)" }} className="scroll-fade">
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "7rem 2.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "3rem", marginBottom: "4rem" }}>
            <h2 style={{
              fontSize: "clamp(2rem, 3.5vw, 3rem)",
              fontWeight: 300,
              letterSpacing: "-0.035em",
              color: "#111",
              lineHeight: 1.15,
              flexShrink: 0
            }}>
              HTML can be<br />
              <em style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#aaa" }}>anything.</em>
            </h2>
            <div style={{ flex: 1, borderTop: "1px solid var(--border)", marginBottom: "0.5rem" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
            {["Cricket scorecards", "Football live scores", "Movie watchlists", "Lo-fi music players", "Finance trackers", "Space dashboards", "Wedding RSVPs", "Teacher quizzes", "Product launches", "Animated resumes", "Event RSVPs", "Link in bio", "Countdown timers", "Restaurant menus", "Game prototypes", "Portfolios", "Micro SaaS tools", "Photo galleries", "Research tools", "Community events", "Feedback forms", "JEE flashcards", "Micro courses"].map((item) => (
              <span key={item} className="pill-tag">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPORT / SHARE ──────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--border)", background: "#FAF9F5" }} className="scroll-fade">
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "5.5rem 4rem 5.5rem 0", borderRight: "1px solid var(--border)" }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                color: "var(--accent-blue)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
                fontWeight: 500
              }}>
                already have html?
              </div>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.15, marginBottom: "1.25rem", color: "#111" }}>
                Paste it.<br />It's live.
              </h2>
              <p style={{ fontSize: "0.98rem", color: "#666", fontWeight: 300, lineHeight: 1.9, marginBottom: "2rem" }}>
                Already have an HTML file? Paste it and Hyphertext hosts it instantly. Then iterate with AI — no setup required.
              </p>
              <Link href="/auth" className="cta-ghost">Import your HTML →</Link>
            </div>
            <div style={{ padding: "5.5rem 0 5.5rem 4rem" }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                color: "var(--accent-green)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
                fontWeight: 500
              }}>
                your url. instantly.
              </div>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.15, marginBottom: "1.25rem", color: "#111" }}>
                Share your<br />work live.
              </h2>
              <p style={{ fontSize: "0.98rem", color: "#666", fontWeight: 300, lineHeight: 1.9, marginBottom: "2rem" }}>
                Every page gets a real URL. Share it on social, in messages, embed it anywhere. No domain setup, no deployment.
              </p>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.84rem",
                color: "#888",
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "0.75rem 1rem",
                display: "inline-block"
              }}>
                hyphertext.com/p/<span style={{ color: "var(--accent)" }}>your-page-id</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background: "#111", color: "#F4F2ED" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "9rem 2.5rem", textAlign: "center" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "3rem",
            fontWeight: 500
          }}>
            the web. reimagined.
          </div>
          <h2 style={{
            fontSize: "clamp(3rem, 6vw, 5.5rem)",
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            marginBottom: "2rem",
            maxWidth: "800px",
            margin: "0 auto 2rem"
          }}>
            Your idea deserves<br />
            to be <em style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.3)"
            }}>alive</em>.
          </h2>
          <p style={{
            fontSize: "1.05rem",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 300,
            lineHeight: 1.8,
            marginBottom: "3.5rem"
          }}>
            No code required. No server. No friction. Just build.
          </p>
          <Link href="/auth" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.55rem",
            background: "#F4F2ED",
            color: "#111",
            padding: "1.1rem 2.8rem",
            borderRadius: "4px",
            fontSize: "0.98rem",
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "0.02em"
          }}>
            Start building — it's free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <p style={{
            marginTop: "1.1rem",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.2)",
            fontWeight: 400
          }}>
            1 free hosted site forever · no card required
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ background: "#0a0a0a", borderTop: "1px solid #1f1f1f", padding: "3rem 2.5rem" }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <Image
              src="/logo.png"
              alt="Hyphertext"
              width={26}
              height={26}
              style={{ borderRadius: "50%", opacity: 0.65 }}
            />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.04em",
              fontWeight: 400
            }}>
              hyphertext
            </span>
          </div>
          <div style={{ display: "flex", gap: "2.25rem", flexWrap: "wrap" }}>
            {[["Explore", "/explore"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.38)",
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                  fontWeight: 400,
                  transition: "color 0.15s"
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}
              >
                {label}
              </Link>
            ))}
          </div>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.22)",
            fontWeight: 400,
            letterSpacing: "0.02em"
          }}>
            © 2025 Hyphertext · All Rights Reserved
          </span>
        </div>
      </footer>
    </main>
  );
}

/* ── Scroll observer ─────────────────────────────────────────────────────── */
function ScrollObserver() {
  useEffect(() => {
    const els = document.querySelectorAll(".scroll-fade");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return null;
}