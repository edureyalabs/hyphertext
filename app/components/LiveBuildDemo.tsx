"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DEMOS } from "./demos";

export default function LiveBuildDemo() {
  // Build a shuffled order: index 0 is always first, rest are shuffled
  const buildOrder = useCallback(() => {
    const rest = Array.from({ length: DEMOS.length - 1 }, (_, i) => i + 1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return [0, ...rest];
  }, []);

  const [order] = useState<number[]>(() => buildOrder());
  const [orderPos, setOrderPos] = useState(0);
  const seqIdx = order[orderPos] % DEMOS.length;

  const [phase, setPhase] = useState<"typing" | "thinking" | "live" | "holding">("live");
  const [typedPrompt, setTypedPrompt] = useState(DEMOS[0].prompt);
  const [showSend, setShowSend] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [pageVisible, setPageVisible] = useState(true);
  const [liveBadge, setLiveBadge] = useState(true);
  const [urlText, setUrlText] = useState(DEMOS[0].url);
  const [urlLive, setUrlLive] = useState(true);
  const [pageOpacity, setPageOpacity] = useState(1);

  const isRunning = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isRunning.current) return;
    isRunning.current = true;

    const run = async () => {
      await new Promise(r => setTimeout(r, 3500));

      let pos = 0;
      while (mountedRef.current) {
        const nextPos = (pos + 1) % order.length;
        const nextIdx = order[nextPos] % DEMOS.length;
        if (!mountedRef.current) break;

        setPageOpacity(0);
        await new Promise(r => setTimeout(r, 300));
        if (!mountedRef.current) break;

        setLiveBadge(false);
        setUrlLive(false);
        setUrlText("draft · not published");
        setPageVisible(false);
        setTypedPrompt("");
        setShowSend(false);
        setThinkingText("");
        setPhase("typing");

        const demo = DEMOS[nextIdx];

        for (let i = 0; i <= demo.prompt.length; i++) {
          if (!mountedRef.current) return;
          setTypedPrompt(demo.prompt.slice(0, i));
          await new Promise(r => setTimeout(r, i === 0 ? 150 : 32));
        }
        if (!mountedRef.current) return;

        setShowSend(true);
        await new Promise(r => setTimeout(r, 380));
        if (!mountedRef.current) return;
        setShowSend(false);

        setPhase("thinking");
        setThinkingText(demo.thinking);
        setUrlText("generating...");
        await new Promise(r => setTimeout(r, 1400));
        if (!mountedRef.current) return;

        setPhase("live");
        setUrlText(demo.url);
        setUrlLive(true);
        setPageVisible(true);
        setPageOpacity(1);
        await new Promise(r => setTimeout(r, 250));
        if (!mountedRef.current) return;
        setLiveBadge(true);
        pos = nextPos;
        setOrderPos(nextPos);

        await new Promise(r => setTimeout(r, 3200));
      }
    };

    run().finally(() => { isRunning.current = false; });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const demo = DEMOS[seqIdx];

  // Guard against an out-of-bounds index during any transient state
  if (!demo) return null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Chat input */}
      <div style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: "8px 8px 0 0",
        borderBottom: "none",
        padding: "0.75rem 0.9rem",
        display: "flex",
        alignItems: "flex-end",
        gap: "0.6rem"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.58rem",
            color: "#ccc",
            marginBottom: "0.25rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase"
          }}>
            describe your page
          </div>
          <div style={{
            fontSize: "0.82rem",
            color: "#333",
            minHeight: "1.25em",
            lineHeight: 1.5,
            fontWeight: 300
          }}>
            {typedPrompt}
            {phase === "typing" && (
              <span style={{
                display: "inline-block",
                width: "2px",
                height: "0.78em",
                background: "#111",
                verticalAlign: "middle",
                marginLeft: "1px",
                animation: "blink 0.9s step-end infinite"
              }} />
            )}
          </div>
        </div>
        <div style={{
          width: "30px",
          height: "30px",
          background: "#111",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          opacity: showSend ? 1 : 0,
          transition: "opacity 0.2s"
        }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1 13L13 7L1 1V5.5L9 7L1 8.5V13Z" fill="#fff" />
          </svg>
        </div>
      </div>

      {/* Thinking bar */}
      <div style={{
        background: "#FAFAF7",
        border: "1px solid var(--border)",
        borderTop: "none",
        borderBottom: "none",
        padding: "0.45rem 0.9rem",
        display: "flex",
        alignItems: "center",
        gap: "0.55rem",
        opacity: phase === "thinking" ? 1 : 0,
        transition: "opacity 0.3s",
        minHeight: "32px",
        overflow: "hidden"
      }}>
        <div style={{ display: "flex", gap: "3px" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "#bbb",
              animation: "bounce 1.2s ease infinite",
              animationDelay: `${i * 0.15}s`
            }} />
          ))}
        </div>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.6rem",
          color: "#999"
        }}>
          {thinkingText}
        </span>
      </div>

      {/* Browser chrome + page — 9:16 proportioned */}
      <div style={{
        border: "1px solid var(--border)",
        borderTop: "none",
        borderRadius: "0 0 10px 10px",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 12px 48px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}>
        {/* Browser toolbar */}
        <div style={{
          height: "34px",
          background: "#F0EDE8",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: "7px",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map(c => (
              <div key={c} style={{ width: "9px", height: "9px", borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{
            flex: 1,
            background: "#fff",
            border: "1px solid #E0DDD8",
            borderRadius: "4px",
            padding: "2px 10px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6rem",
            color: urlLive ? "#2a9d5c" : "#bbb",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            transition: "color 0.4s"
          }}>
            {urlText}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            background: "rgba(42,157,92,0.1)",
            border: "1px solid rgba(42,157,92,0.25)",
            borderRadius: "100px",
            padding: "2px 7px",
            opacity: liveBadge ? 1 : 0,
            transition: "opacity 0.4s",
          }}>
            <div style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "#2a9d5c",
              animation: "pulse 2s infinite"
            }} />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.52rem",
              color: "#2a9d5c"
            }}>
              live
            </span>
          </div>
        </div>

        {/* Page content */}
        <div style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          background: demo.bg,
        }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              opacity: pageOpacity,
              transition: "opacity 0.35s ease"
            }}
            dangerouslySetInnerHTML={{ __html: demo.render }}
          />
          {!pageVisible && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6rem",
                color: "#ccc",
                letterSpacing: "0.08em"
              }}>
                {phase === "thinking" ? "generating your page..." : "waiting for prompt..."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}