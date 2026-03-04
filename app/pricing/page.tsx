"use client";

import Image from "next/image";
import Link from "next/link";

const FREE_FEATURES = [
  "1 published site — always live",
  "5,000 total pages (drafts + published)",
  "AI studio with token-based editing",
  "HTML import & instant hosting",
  "Real public URL",
  "Public profile page",
];

const PRO_FEATURES = [
  "Unlimited published sites simultaneously",
  "5,000 total pages (drafts + published)",
  "AI studio with token-based editing",
  "HTML import & instant hosting",
  "Real public URL",
  "Public profile page",
  "Paused sites restore instantly on renewal",
];

const TOKEN_TIERS = [
  { amount: "$1", tokens: "100K", label: "Quick top-up", color: "var(--accent)" },
  { amount: "$5", tokens: "500K", label: "Most popular", color: "var(--accent-blue)", highlight: true },
  { amount: "$10", tokens: "1M", label: "Power user", color: "var(--accent-green)" },
  { amount: "$25", tokens: "2.5M", label: "Heavy builder", color: "var(--accent-purple)" },
];

const FAQS = [
  { q: "Do I need a card to get started?", a: "No. Your first site is free forever with no card required. You only need to pay if you want to publish more than one site at a time, or to buy AI tokens." },
  { q: "What are tokens and how do I use them?", a: "Tokens power the AI agent that writes and edits your HTML. Each time the AI generates or modifies a page, tokens are consumed. You start with a small free allocation and can top up any time." },
  { q: "Does Pro auto-renew?", a: "No. Pro is monthly and never auto-renews. You'll get a reminder before your plan expires and must renew manually. We never charge you without your action." },
  { q: "What happens when Pro expires?", a: "You revert to Free. Your most recently updated site stays live — everything else is paused, not deleted. All paused sites restore the moment you renew." },
  { q: "Do tokens expire?", a: "Never. Purchased tokens carry forward indefinitely. Token prices may change over time, but your existing balance is always at the rate you paid." },
  { q: "What payment methods are supported?", a: "We use Razorpay — cards, UPI, net banking, and wallets are all supported." },
];

export default function PricingPage() {
  return (
    <main style={{ background: "#F4F2ED", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,200;0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;1,400;1,500&display=swap');
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
        .nav-link { font-size: 1rem; font-weight: 450; color: #555; text-decoration: none; transition: color 0.15s; }
        .nav-link:hover { color: #111; }
        .check-row { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.88rem; font-weight: 300; line-height: 1.5; margin-bottom: 0.65rem; }
        .faq-row { border-top: 1px solid var(--border); padding: 1.75rem 0; }
        .faq-row:last-child { border-bottom: 1px solid var(--border); }
        .token-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem 1.5rem; transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; }
        .token-card:hover { border-color: #999; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.07); }
        @media (max-width: 860px) { .plans-grid { grid-template-columns: 1fr !important; } .token-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 560px) { .token-grid { grid-template-columns: 1fr !important; } }
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
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "1rem", color: "#111", letterSpacing: "0.01em", fontWeight: 400 }}>hyphertext</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "2.25rem" }}>
          <Link href="/explore" className="nav-link">Explore</Link>
          <Link href="/auth" style={{ background: "#111", color: "#F4F2ED", padding: "0.5rem 1.3rem", borderRadius: "4px", fontSize: "0.92rem", fontWeight: 500, textDecoration: "none" }}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* ── HEADER ── */}
      <section style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ background: "#111", padding: "0.55rem 2.5rem" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.32)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            hyphertext · pricing
          </span>
        </div>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "5.5rem 2.5rem 4.5rem", textAlign: "center" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
            color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem"
          }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            simple pricing
          </div>
          <h1 style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)", fontWeight: 300, lineHeight: 1.06, letterSpacing: "-0.04em", color: "#111", marginBottom: "1.5rem" }}>
            Start free.<br />
            Scale when you're{" "}
            <em style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 400, color: "#bbb" }}>ready.</em>
          </h1>
          <p style={{ fontSize: "1.05rem", color: "#666", fontWeight: 300, lineHeight: 1.85, maxWidth: "480px", margin: "0 auto" }}>
            One free site, forever. Upgrade to Pro for unlimited publishing. Buy AI tokens whenever you need more.
          </p>
        </div>
      </section>

      {/* ── HOSTING PLANS ── */}
      <section style={{ borderBottom: "1px solid var(--border)", padding: "5rem 2.5rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
            color: "var(--accent-blue)", letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: "3rem", display: "flex", alignItems: "center", gap: "0.6rem"
          }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent-blue)", display: "inline-block" }} />
            hosting plans
          </div>

          <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

            {/* FREE */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "12px", padding: "2.25rem 2.25rem 2rem", display: "flex", flexDirection: "column" }}>
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.85rem" }}>free</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "3.2rem", fontWeight: 300, letterSpacing: "-0.04em", color: "#111", fontFamily: "'DM Mono', monospace" }}>$0</span>
                  <span style={{ fontSize: "0.85rem", color: "#bbb", fontWeight: 300 }}>forever</span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "#888", fontWeight: 300, lineHeight: 1.6 }}>One live site. No card, no catch.</p>
              </div>
              <div style={{ flex: 1, marginBottom: "2rem" }}>
                {FREE_FEATURES.map(f => (
                  <div key={f} className="check-row" style={{ color: "#555" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(26,90,200,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/auth" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "6px",
                fontSize: "0.9rem", fontWeight: 500, color: "#555", textDecoration: "none", transition: "all 0.15s"
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#888"; e.currentTarget.style.color = "#111"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "#555"; }}
              >
                Get started free
              </Link>
            </div>

            {/* PRO */}
            <div style={{ background: "#111", border: "1px solid #111", borderRadius: "12px", padding: "2.25rem 2.25rem 2rem", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "220px", height: "220px", background: "radial-gradient(circle, rgba(200,90,26,0.12), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ marginBottom: "2rem", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>pro</div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#f59e0b", background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.28)", borderRadius: "3px", padding: "0.1rem 0.5rem" }}>
                    most popular
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "3.2rem", fontWeight: 300, letterSpacing: "-0.04em", color: "#F4F2ED", fontFamily: "'DM Mono', monospace" }}>$5</span>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>/ month</span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.42)", fontWeight: 300, lineHeight: 1.6 }}>Publish everything. No limit on live sites.</p>
              </div>
              <div style={{ flex: 1, marginBottom: "2rem", position: "relative" }}>
                {PRO_FEATURES.map((f, i) => (
                  <div key={f} className="check-row" style={{ color: i === 0 ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.48)" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(200,90,26,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/account?tab=hosting" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0.8rem", background: "#F4F2ED", borderRadius: "6px",
                fontSize: "0.9rem", fontWeight: 600, color: "#111", textDecoration: "none",
                position: "relative", transition: "background 0.15s"
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#e8e6e1"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#F4F2ED"; }}
              >
                Upgrade to Pro →
              </Link>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.18)", textAlign: "center", marginTop: "0.75rem", position: "relative" }}>
                no auto-renewal · pay manually each month
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI TOKENS ── */}
      <section style={{ borderBottom: "1px solid var(--border)", padding: "5rem 2.5rem", background: "#FAF9F5" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "end", marginBottom: "3rem" }}>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
                color: "var(--accent-green)", letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem"
              }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent-green)", display: "inline-block" }} />
                ai tokens
              </div>
              <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 300, letterSpacing: "-0.035em", color: "#111", lineHeight: 1.15 }}>
                Pay only for what{" "}
                <em style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#aaa" }}>you use.</em>
              </h2>
            </div>
            <p style={{ fontSize: "0.95rem", color: "#666", fontWeight: 300, lineHeight: 1.8 }}>
              Tokens power the AI. Each generation or edit consumes tokens. Top up any amount — they never expire and carry forward indefinitely.
            </p>
          </div>

          <div className="token-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {TOKEN_TIERS.map((tier) => (
              <div key={tier.amount} className="token-card" style={tier.highlight ? { background: "#111", border: "1px solid #111" } : {}}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", fontWeight: 500, color: tier.highlight ? "rgba(255,255,255,0.3)" : "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.85rem" }}>
                  {tier.label}
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 300, letterSpacing: "-0.03em", color: tier.highlight ? "#F4F2ED" : "#111", fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>
                  {tier.amount}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 500, color: tier.color, fontFamily: "'DM Mono', monospace" }}>{tier.tokens}</span>
                  <span style={{ fontSize: "0.72rem", color: tier.highlight ? "rgba(255,255,255,0.3)" : "#aaa", fontWeight: 300 }}>tokens</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "#fff", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.75rem 1.25rem" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-green)", flexShrink: 0 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#666", fontWeight: 400 }}>
              Rate: <strong style={{ color: "#111", fontWeight: 500 }}>100,000 tokens per $1 USD</strong>
              <span style={{ color: "#aaa", marginLeft: "0.5rem" }}>· prices may change, existing balance unaffected</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ borderBottom: "1px solid var(--border)", padding: "5rem 2.5rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
            color: "var(--accent-purple)", letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: "3rem", display: "flex", alignItems: "center", gap: "0.6rem"
          }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent-purple)", display: "inline-block" }} />
            compare plans
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 150px", borderBottom: "1px solid var(--border)", padding: "1rem 1.75rem" }}>
              <div />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#888", textAlign: "center", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>Free</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--accent)", textAlign: "center", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pro</div>
            </div>
            {[
              ["Published sites", "1", "Unlimited"],
              ["Total pages", "5,000", "5,000"],
              ["AI studio", "✓", "✓"],
              ["HTML import", "✓", "✓"],
              ["Public URL", "✓", "✓"],
              ["Public profile", "✓", "✓"],
              ["Site restore on renewal", "—", "✓"],
            ].map(([feature, free, pro], i) => (
              <div key={feature as string} style={{
                display: "grid", gridTemplateColumns: "1fr 150px 150px",
                borderBottom: i < 6 ? "1px solid #f6f5f2" : "none",
                padding: "0.9rem 1.75rem",
                background: i % 2 === 0 ? "#fff" : "#FAFAF7"
              }}>
                <div style={{ fontSize: "0.88rem", color: "#444", fontWeight: 300 }}>{feature}</div>
                <div style={{ textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: "0.84rem", color: free === "✓" ? "var(--accent-green)" : free === "—" ? "#ddd" : "#555", fontWeight: 400 }}>{free}</div>
                <div style={{ textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: "0.84rem", color: pro === "✓" ? "var(--accent-green)" : pro === "—" ? "#ddd" : "var(--accent)", fontWeight: 400 }}>{pro}</div>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 150px", padding: "1.25rem 1.75rem", background: "#F4F2ED", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#111" }}>Price</div>
              <div style={{ textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: "1rem", color: "#555", fontWeight: 400 }}>Free</div>
              <div style={{ textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: "1rem", color: "var(--accent)", fontWeight: 500 }}>$5 / mo</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ borderBottom: "1px solid var(--border)", padding: "5rem 2.5rem" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", fontWeight: 500,
            color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: "3rem", display: "flex", alignItems: "center", gap: "0.6rem"
          }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            frequently asked
          </div>
          {FAQS.map(faq => (
            <div key={faq.q} className="faq-row">
              <h3 style={{ fontSize: "1rem", fontWeight: 500, color: "#111", marginBottom: "0.6rem", letterSpacing: "-0.01em", lineHeight: 1.4 }}>{faq.q}</h3>
              <p style={{ fontSize: "0.9rem", color: "#666", fontWeight: 300, lineHeight: 1.85 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#111" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "7rem 2.5rem", textAlign: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.22)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2.5rem", fontWeight: 500 }}>
            no risk · no card
          </div>
          <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, lineHeight: 1.07, letterSpacing: "-0.04em", color: "#F4F2ED", maxWidth: "560px", margin: "0 auto 1.5rem" }}>
            Your first site is{" "}
            <em style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "rgba(255,255,255,0.28)" }}>free.</em>
            {" "}Always.
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.35)", fontWeight: 300, lineHeight: 1.8, marginBottom: "3rem" }}>
            Start building in seconds. Upgrade when you're ready.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "#F4F2ED", color: "#111",
              padding: "1rem 2.5rem", borderRadius: "4px",
              fontSize: "0.95rem", fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em"
            }}>
              Start building free →
            </Link>
            <Link href="/explore" style={{
              display: "inline-flex", alignItems: "center",
              background: "transparent", color: "rgba(255,255,255,0.45)",
              padding: "1rem 1.8rem", borderRadius: "4px",
              fontSize: "0.92rem", fontWeight: 400, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.12)", transition: "all 0.15s"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
              See what people built
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0a0a0a", borderTop: "1px solid #1f1f1f", padding: "3rem 2.5rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <Image src="/logo.png" alt="Hyphertext" width={26} height={26} style={{ borderRadius: "50%", opacity: 0.65 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em", fontWeight: 400 }}>hyphertext</span>
          </div>
          <div style={{ display: "flex", gap: "2.25rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[["About", "/about"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([label, href]) => (
              <Link key={href} href={href}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.38)", textDecoration: "none", fontWeight: 400, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}
              >{label}</Link>
            ))}
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.22)", fontWeight: 400 }}>
            © 2025 Hyphertext · Bengaluru, India
          </span>
        </div>
      </footer>
    </main>
  );
}