"use client";

import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main style={{ background: "#F4F2ED", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,200;0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #111; color: #F4F2ED; }
        :root {
          --bg: #F4F2ED;
          --border: #D8D3C8;
          --accent: #C85A1A;
          --accent-blue: #1A5AC8;
          --accent-green: #1A8A4A;
          --accent-purple: #6B3AC8;
        }
        .nav-link {
          font-size: 1rem; font-weight: 450; color: #444;
          text-decoration: none; letter-spacing: 0.005em; transition: color 0.15s;
        }
        .nav-link:hover { color: #111; }
        .contact-link {
          color: #111; text-decoration: underline;
          text-underline-offset: 3px; text-decoration-color: #bbb;
          transition: text-decoration-color 0.15s;
        }
        .contact-link:hover { text-decoration-color: #111; }
        .divider-bar { width: 32px; height: 2px; background: #111; }
        @media(max-width:700px) {
          .two-col { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(244,242,237,0.94)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border)",
        height: "62px", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 2.5rem"
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.65rem", textDecoration: "none" }}>
          <Image src="/logo.png" alt="Hyphertext" width={34} height={34} style={{ borderRadius: "50%" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "1rem", color: "#111", letterSpacing: "0.01em", fontWeight: 400 }}>
            hyphertext
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "2.25rem" }}>
          <Link href="/explore" className="nav-link">Explore</Link>
          <Link href="/auth" style={{
            background: "#111", color: "#F4F2ED",
            padding: "0.5rem 1.3rem", borderRadius: "4px",
            fontSize: "0.92rem", fontWeight: 500, textDecoration: "none", letterSpacing: "0.01em"
          }}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* ── HEADER ── */}
      <section style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ background: "#111", padding: "0.55rem 2.5rem" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.38)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 400 }}>
            hyphertext · about us
          </span>
        </div>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "6rem 2.5rem 5rem" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
            color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.6rem"
          }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            our story
          </div>
          <h1 style={{
            fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 300,
            lineHeight: 1.05, letterSpacing: "-0.04em", color: "#111", marginBottom: "2rem"
          }}>
            We believe the web<br />
            should be for{" "}
            <em style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 400, color: "#999" }}>
              everyone.
            </em>
          </h1>
          <p style={{ fontSize: "1.15rem", color: "#444", fontWeight: 300, lineHeight: 1.85, maxWidth: "620px" }}>
            Hyphertext was built on a simple conviction: publishing on the web has been needlessly complicated for far too long. We're here to fix that.
          </p>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "5rem 2.5rem" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "4rem", alignItems: "start" }}>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
                color: "var(--accent-blue)", letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-blue)", display: "inline-block" }} />
                what we believe
              </div>
              <div className="divider-bar" style={{ background: "var(--accent-blue)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
              {[
                { title: "HTML is the greatest creative medium ever made.", body: "A single file of HTML, CSS, and JS can be a game, a gallery, an RSVP form, a resume, a micro-app, or anything else imaginable. The browser is the most universal runtime in history. We think that's worth celebrating.", color: "var(--accent)" },
                { title: "The barrier to publishing has been too high for too long.", body: "Setting up a server, configuring deployment, buying a domain, managing a CMS — none of that should stand between someone with an idea and the world seeing it. We stripped all of that away.", color: "var(--accent-blue)" },
                { title: "AI and the web were made for each other.", body: "Agentic coding is the new paradigm. When an AI can write complete, functional HTML from a description, and that file can be live on the internet in seconds — the act of creation changes entirely. Hyphertext is where that happens.", color: "var(--accent-green)" },
                { title: "Vibe coding shouldn't be just for developers.", body: "Teachers, designers, artists, founders, students, couples planning weddings — everyone has ideas worth building. Hyphertext is the platform where anyone can become a web creator.", color: "var(--accent-purple)" },
              ].map((item) => (
                <div key={item.title} style={{ paddingLeft: "1.1rem", borderLeft: `2px solid ${item.color}` }}>
                  <h3 style={{ fontSize: "1.08rem", fontWeight: 500, color: "#111", marginBottom: "0.65rem", letterSpacing: "-0.01em", lineHeight: 1.4 }}>{item.title}</h3>
                  <p style={{ fontSize: "0.96rem", color: "#555", fontWeight: 300, lineHeight: 1.85 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT IS HYPHERTEXT ── */}
      <section style={{ background: "#111", color: "#F4F2ED", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "5rem 2.5rem" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "4rem" }}>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
                color: "rgba(200,90,26,0.9)", letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(200,90,26,0.9)", display: "inline-block" }} />
                the platform
              </div>
              <div style={{ width: "32px", height: "2px", background: "rgba(255,255,255,0.2)" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "2.4rem", fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.15, marginBottom: "1.5rem" }}>
                What is{" "}
                <em style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>
                  Hyphertext?
                </em>
              </h2>
              <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.62)", fontWeight: 300, lineHeight: 1.9, marginBottom: "1.25rem" }}>
                Hyphertext is a hyper-fast HTML hosting platform with an AI studio built in. Describe what you want to build, and the AI writes the HTML. Paste existing HTML to host it instantly. Edit live. Publish in one click.
              </p>
              <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.62)", fontWeight: 300, lineHeight: 1.9, marginBottom: "2.5rem" }}>
                Every page gets a real URL. Free accounts get one live site forever. Pro accounts can publish unlimited sites simultaneously — perfect for creators, educators, agencies, and anyone building for clients.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(255,255,255,0.09)", borderRadius: "6px", overflow: "hidden" }}>
                {[
                  ["AI Studio", "Describe. Generate. Iterate.", "var(--accent)"],
                  ["Instant Hosting", "Live URL in under 10 seconds.", "var(--accent-blue)"],
                  ["HTML Import", "Paste your code, we host it.", "var(--accent-green)"],
                  ["Public Profiles", "Share your creations with the world.", "var(--accent-purple)"],
                ].map(([title, desc, color]) => (
                  <div key={title as string} style={{ padding: "1.35rem 1.5rem", background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 500, color: color as string, marginBottom: "0.35rem" }}>{title}</div>
                    <div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.42)", fontWeight: 300 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPANY ── */}
      <section style={{ borderBottom: "1px solid var(--border)", background: "#FAF9F5" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "5rem 2.5rem" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "4rem" }}>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
                color: "var(--accent-green)", letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-green)", display: "inline-block" }} />
                company
              </div>
              <div className="divider-bar" style={{ background: "var(--accent-green)" }} />
            </div>
            <div>
              <p style={{ fontSize: "1rem", color: "#444", fontWeight: 300, lineHeight: 1.9, marginBottom: "1.5rem" }}>
                Hyphertext is an independent product built and operated from Bengaluru, India. We're a small, focused team obsessed with the idea that the next generation of web publishing should be instant, effortless, and open to everyone.
              </p>
              <p style={{ fontSize: "1rem", color: "#444", fontWeight: 300, lineHeight: 1.9 }}>
                We're early and moving fast. If you have feedback, ideas, or just want to say hello — we genuinely want to hear from you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "5rem 2.5rem" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "4rem" }}>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
                color: "var(--accent-purple)", letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-purple)", display: "inline-block" }} />
                contact
              </div>
              <div className="divider-bar" style={{ background: "var(--accent-purple)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", fontWeight: 500, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>email</div>
                <a href="mailto:support@hyphertext.com" className="contact-link" style={{ fontSize: "1.08rem", fontWeight: 400, color: "#111" }}>
                  support@hyphertext.com
                </a>
                <p style={{ fontSize: "0.88rem", color: "#777", fontWeight: 300, marginTop: "0.35rem" }}>For support, feedback, partnerships, or anything else.</p>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", fontWeight: 500, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>location</div>
                <div style={{ fontSize: "1rem", fontWeight: 400, color: "#222" }}>Bengaluru, Karnataka</div>
                <div style={{ fontSize: "0.9rem", color: "#777", fontWeight: 300, marginTop: "0.2rem" }}>India · 560078</div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", fontWeight: 500, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>response time</div>
                <div style={{ fontSize: "0.94rem", color: "#555", fontWeight: 300, lineHeight: 1.7 }}>We aim to reply within 24–48 hours on business days. We read every message.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#111", color: "#F4F2ED" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "5rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem", fontWeight: 500 }}>
              ready to build?
            </div>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 300, letterSpacing: "-0.035em", color: "#F4F2ED", marginBottom: "0.5rem", lineHeight: 1.15 }}>
              Your first site is{" "}
              <em style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "rgba(255,255,255,0.35)" }}>free.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Forever. No card required.</p>
          </div>
          <Link href="/auth" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "#F4F2ED", color: "#111",
            padding: "0.95rem 2rem", borderRadius: "4px",
            fontSize: "0.95rem", fontWeight: 600, textDecoration: "none",
            letterSpacing: "0.02em", whiteSpace: "nowrap"
          }}>
            Get started free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER (matches main page) ── */}
      <footer style={{ background: "#FAF9F5", borderTop: "1px solid var(--border)", padding: "2rem 2.5rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "1.5rem"
          }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.65rem", textDecoration: "none" }}>
              <Image src="/logo.png" alt="Hyphertext" width={28} height={28} style={{ borderRadius: "50%" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.95rem", color: "#333", letterSpacing: "0.03em", fontWeight: 400 }}>
                hyphertext
              </span>
            </Link>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#bbb", fontWeight: 400, letterSpacing: "0.02em" }}>
              © 2026 Hyphertext · All Rights Reserved
            </span>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {[["About", "/about"], ["Pricing", "/pricing"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([label, href]) => (
                <Link key={href} href={href}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#888", textDecoration: "none", letterSpacing: "0.01em", fontWeight: 400, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#222")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#888")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}