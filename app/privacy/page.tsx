"use client";

import Image from "next/image";
import Link from "next/link";

const SECTIONS = [
  {
    id: "01",
    title: "Information we collect",
    content: [
      { heading: "Account information", body: "When you create an account, we collect your email address and any profile information you choose to add (display name, username, bio, avatar). We use this to identify you and provide your account." },
      { heading: "Content you create", body: "We store the HTML pages you create, import, or edit on our platform. This is your content, and we only use it to provide the service to you." },
      { heading: "Payment information", body: "We use Razorpay to process payments. We do not store your card details, UPI handles, or banking credentials. Razorpay's privacy policy governs how payment information is handled." },
      { heading: "Usage data", body: "We collect basic usage information such as which features you use, page loads, and error logs. This helps us improve the platform. We do not sell this data." },
      { heading: "Uploaded files", body: "If you upload images or documents to use in your pages, we store them securely in our cloud storage. They are used solely to provide your requested functionality." },
    ],
  },
  {
    id: "02",
    title: "How we use your information",
    content: [
      { heading: "To provide the service", body: "We use your information to create and manage your account, host your pages, process payments, and operate the platform." },
      { heading: "To communicate with you", body: "We may send you emails about your account, subscription, important service updates, or responses to your support requests. We do not send marketing emails unless you opt in." },
      { heading: "To improve Hyphertext", body: "We analyse aggregate usage patterns to understand how the platform is used and to prioritise improvements. This analysis is never tied to individual user identities in a way that's shared externally." },
    ],
  },
  {
    id: "03",
    title: "Content and public pages",
    content: [
      { heading: "Published pages are public", body: "When you publish a page on Hyphertext, it becomes publicly accessible at its URL. Anyone with the link can view it. If you want a page to be private, keep it in draft status (unpublished)." },
      { heading: "Your public profile", body: "If you set a username, your profile page at /u/[username] is publicly visible and will show your published pages. You can choose not to set a username to avoid having a public profile." },
      { heading: "Content moderation", body: "You are responsible for the content you publish. We reserve the right to remove content that violates our Terms of Service, including illegal content, spam, or content that harms others." },
    ],
  },
  {
    id: "04",
    title: "Data sharing",
    content: [
      { heading: "We do not sell your data", body: "We never sell personal information to third parties. Full stop." },
      { heading: "Service providers", body: "We share data with providers that help us run the platform: Supabase (database and storage), Razorpay (payments), and Anthropic (AI services for page generation). Each is bound by data processing agreements." },
      { heading: "Legal requirements", body: "We may disclose information when required by law, court order, or to protect the rights and safety of our users and the public." },
    ],
  },
  {
    id: "05",
    title: "Data retention and deletion",
    content: [
      { heading: "Account deletion", body: "You can delete your account at any time by contacting us at support@hyphertext.com. We will permanently delete your account data, pages, and uploaded files within 30 days." },
      { heading: "Retention period", body: "We retain your data for as long as your account is active. When you delete your account, we retain anonymised aggregate data (no personal identifiers) for analytics." },
      { heading: "Backups", body: "Deleted data may persist in encrypted backups for up to 90 days, after which it is permanently purged." },
    ],
  },
  {
    id: "06",
    title: "Security",
    content: [
      { heading: "What we do", body: "We use industry-standard security measures including HTTPS encryption, secure database access controls, and encrypted storage. Passwords are never stored in plaintext." },
      { heading: "What you should do", body: "Use a strong, unique password. Do not share your account credentials. Contact us immediately at support@hyphertext.com if you suspect unauthorised access." },
    ],
  },
  {
    id: "07",
    title: "Cookies",
    content: [
      { heading: "Session cookies", body: "We use cookies to maintain your login session. These are essential for the platform to function. We do not use tracking or advertising cookies." },
      { heading: "No third-party tracking", body: "We do not embed third-party advertising trackers, pixel trackers, or social media tracking scripts on our platform." },
    ],
  },
  {
    id: "08",
    title: "Your rights",
    content: [
      { heading: "Access and portability", body: "You can request a copy of the personal data we hold about you by emailing support@hyphertext.com." },
      { heading: "Correction", body: "You can update most of your profile information directly from your Account settings page." },
      { heading: "Deletion", body: "You can request complete account and data deletion by contacting us." },
      { heading: "Jurisdiction", body: "This platform is operated from India. By using Hyphertext, you agree to the processing of your data in India and wherever our service providers are located." },
    ],
  },
  {
    id: "09",
    title: "Changes to this policy",
    content: [
      { heading: "Updates", body: "We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on the platform. Continued use of Hyphertext after changes take effect constitutes acceptance of the updated policy." },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ background: "#F5F3EE", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@300;400&family=Playfair+Display:ital,wght@1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #111; color: #F5F3EE; }
        .nav-link { font-size: 0.82rem; color: #777; text-decoration: none; transition: color 0.15s; }
        .nav-link:hover { color: #111; }
        .policy-section { border-top: 1px solid #e0dbd0; padding: 3rem 0; display: grid; grid-template-columns: 220px 1fr; gap: 3rem; }
        @media(max-width:700px) { .policy-section { grid-template-columns: 1fr; gap: 1.5rem; } }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(245,243,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e0dbd0", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" }}>
          <Image src="/logo.png" alt="Hyphertext" width={26} height={26} style={{ borderRadius: "50%" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: "#111" }}>hyphertext</span>
        </Link>
        <div style={{ display: "flex", gap: "1.75rem", alignItems: "center" }}>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/terms" className="nav-link">Terms</Link>
        </div>
      </nav>

      {/* Header */}
      <section style={{ borderBottom: "1px solid #e0dbd0" }}>
        <div style={{ background: "#111", padding: "0.55rem 2rem" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>hyphertext · legal</span>
        </div>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "5rem 2rem 4rem" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5rem" }}>privacy policy</div>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.04em", color: "#111", marginBottom: "1.5rem" }}>
            We take your privacy<br />
            <em style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#888" }}>seriously.</em>
          </h1>
          <p style={{ fontSize: "0.92rem", color: "#777", fontWeight: 300, lineHeight: 1.85, maxWidth: "560px", marginBottom: "1.5rem" }}>
            This policy describes what data we collect, how we use it, and how we protect it. We've written it in plain language because we believe you deserve to understand how your data is handled.
          </p>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#bbb", padding: "0.65rem 1rem", background: "#fff", border: "1px solid #e0dbd0", borderRadius: "4px", display: "inline-block" }}>
            Last updated: June 2025 · Effective immediately
          </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 2rem 6rem" }}>
        {SECTIONS.map((section) => (
          <div key={section.id} className="policy-section">
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#ccc", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>{section.id}</div>
              <h2 style={{ fontSize: "0.92rem", fontWeight: 500, color: "#444", lineHeight: 1.5, letterSpacing: "-0.01em" }}>{section.title}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {section.content.map((item) => (
                <div key={item.heading}>
                  <h3 style={{ fontSize: "0.88rem", fontWeight: 500, color: "#111", marginBottom: "0.4rem" }}>{item.heading}</h3>
                  <p style={{ fontSize: "0.87rem", color: "#666", fontWeight: 300, lineHeight: 1.85 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div style={{ borderTop: "1px solid #e0dbd0", paddingTop: "3rem", display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#ccc", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>contact</div>
            <h2 style={{ fontSize: "0.92rem", fontWeight: 500, color: "#444" }}>Questions?</h2>
          </div>
          <div>
            <p style={{ fontSize: "0.87rem", color: "#666", fontWeight: 300, lineHeight: 1.85, marginBottom: "1rem" }}>
              For any privacy-related questions, requests, or concerns, please contact us at:
            </p>
            <a href="mailto:support@hyphertext.com" style={{ fontSize: "1rem", color: "#111", textDecoration: "underline", textUnderlineOffset: "3px" }}>support@hyphertext.com</a>
            <p style={{ fontSize: "0.82rem", color: "#aaa", fontWeight: 300, marginTop: "0.4rem" }}>Bengaluru, Karnataka, India · 560078</p>
          </div>
        </div>
      </section>

      <footer style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a", padding: "2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <Image src="/logo.png" alt="" width={20} height={20} style={{ borderRadius: "50%", opacity: 0.5 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>hyphertext</span>
          </Link>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[["About", "/about"], ["Terms", "/terms"], ["Explore", "/explore"]].map(([l, h]) => (
              <Link key={h} href={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.15)" }}>© 2025 Hyphertext</span>
        </div>
      </footer>
    </main>
  );
}