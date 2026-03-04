export interface Demo {
  prompt: string;
  url: string;
  thinking: string;
  bg: string;
  render: string;
}

export const DEMOS: Demo[] = [
  // DEMO 0 — always first (IPL + Football combined)
  {
    prompt: "a live IPL & Premier League scores hub",
    url: "hyphertext.com/p/live-scores-hub",
    thinking: "Building match cards, live scores, wickets...",
    bg: "#080d1a",
    render: `
      <div style="background:#080d1a;min-height:100%;padding:1rem;font-family:'Courier New',monospace;color:#e8f4ff;overflow:hidden">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
          <div style="width:6px;height:6px;border-radius:50%;background:#ff4444;animation:pulse 1s infinite"></div>
          <span style="font-size:0.52rem;color:#ff4444;letter-spacing:0.1em">LIVE SCORES</span>
        </div>
        <div style="background:#0e1628;border:1px solid #1a2a4a;border-radius:7px;padding:0.7rem;margin-bottom:0.5rem">
          <div style="font-size:0.48rem;color:#4a7aaa;letter-spacing:0.1em;margin-bottom:0.4rem">🏏 IPL 2025 · WANKHEDE</div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div><div style="font-size:0.62rem;color:#7a9abf">MI</div><div style="font-size:1.4rem;font-weight:700;color:#fff;line-height:1">186<span style="font-size:0.75rem;color:#4a7aaa">/4</span></div><div style="font-size:0.48rem;color:#4a7aaa">17.3 ov</div></div>
            <div style="text-align:center"><div style="font-size:0.42rem;color:#556">NEED</div><div style="font-size:0.95rem;font-weight:700;color:#f59e0b">47</div><div style="font-size:0.42rem;color:#556">15 balls</div></div>
            <div style="text-align:right"><div style="font-size:0.62rem;color:#7a9abf">RCB</div><div style="font-size:1.4rem;font-weight:700;color:#aaa;line-height:1">232<span style="font-size:0.75rem;color:#4a7aaa">/6</span></div><div style="font-size:0.48rem;color:#4a7aaa">20 ov</div></div>
          </div>
          <div style="margin-top:0.4rem;font-size:0.48rem;color:#334">Last 6: <span style="color:#fff;letter-spacing:0.1em">4 · 6 · W · 1 · 6 · 4</span></div>
        </div>
        <div style="background:#0a1a0e;border:1px solid #1a3a1a;border-radius:7px;padding:0.7rem;margin-bottom:0.5rem">
          <div style="font-size:0.48rem;color:#4aaa6a;letter-spacing:0.1em;margin-bottom:0.4rem">⚽ PREMIER LEAGUE · 78'</div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:0.35rem"><span style="font-size:0.85rem">🔴</span><span style="font-size:0.65rem;color:#fff">Arsenal</span></div>
            <div style="text-align:center"><div style="font-size:1.6rem;font-weight:700;color:#fff;letter-spacing:-0.02em">2 – 1</div><div style="font-size:0.42rem;color:#4aaa6a;animation:pulse 2s infinite">LIVE</div></div>
            <div style="display:flex;align-items:center;gap:0.35rem"><span style="font-size:0.65rem;color:#fff">Chelsea</span><span style="font-size:0.85rem">🔵</span></div>
          </div>
          <div style="margin-top:0.35rem;font-size:0.48rem;color:#4aaa6a">⚡ Saka 34' · Havertz 61' | Mudryk 45+2'</div>
        </div>
        <div style="background:#150a1e;border:1px solid #2a1a3a;border-radius:7px;padding:0.55rem">
          <div style="font-size:0.48rem;color:#8a6aaa;letter-spacing:0.1em;margin-bottom:0.3rem">⚽ LA LIGA · FT</div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:0.3rem"><span style="font-size:0.75rem">🔵</span><span style="font-size:0.6rem;color:#ccc">Barcelona</span></div>
            <div style="font-size:1.3rem;font-weight:700;color:#888">3 – 2</div>
            <div style="display:flex;align-items:center;gap:0.3rem"><span style="font-size:0.6rem;color:#ccc">Real Madrid</span><span style="font-size:0.75rem">⚪</span></div>
          </div>
        </div>
      </div>`
  },

  // DEMO 1 — personal finance tracker
  {
    prompt: "a personal finance tracker with spending breakdown",
    url: "hyphertext.com/p/finance-tracker",
    thinking: "Building budget categories, charts...",
    bg: "#f8f9fa",
    render: `
      <div style="background:#f8f9fa;min-height:100%;padding:1rem;font-family:system-ui,sans-serif;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
          <div><div style="font-size:0.5rem;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:2px">March 2025</div><div style="font-size:1.2rem;font-weight:700;color:#111;letter-spacing:-0.03em">₹48,200</div></div>
          <div style="text-align:right"><div style="font-size:0.5rem;color:#9ca3af">Budget left</div><div style="font-size:0.72rem;font-weight:600;color:#22c55e">₹12,800</div></div>
        </div>
        <div style="background:#fff;border-radius:8px;padding:0.65rem;margin-bottom:0.55rem;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
          <div style="font-size:0.48rem;color:#9ca3af;letter-spacing:0.08em;margin-bottom:0.45rem">SPENDING BY CATEGORY</div>
          ${[["🍕","Food","₹14,200","29%","#f97316"],["🚗","Transport","₹8,400","17%","#3b82f6"],["🛍️","Shopping","₹11,800","25%","#8b5cf6"],["💡","Utilities","₹5,600","12%","#f59e0b"],["🎬","Entertain","₹7,200","15%","#ec4899"]].map(([e,n,amt,pct,c])=>`
          <div style="margin-bottom:0.35rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
              <div style="display:flex;align-items:center;gap:0.3rem"><span style="font-size:0.7rem">${e}</span><span style="font-size:0.58rem;color:#374151">${n}</span></div>
              <div style="display:flex;align-items:center;gap:0.3rem"><span style="font-size:0.58rem;font-weight:600;color:#111">${amt}</span><span style="font-size:0.48rem;color:#9ca3af">${pct}</span></div>
            </div>
            <div style="height:3px;background:#f3f4f6;border-radius:2px"><div style="height:100%;width:${pct};background:${c};border-radius:2px"></div></div>
          </div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.45rem">
          <div style="background:#fff;border-radius:6px;padding:0.55rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)"><div style="font-size:0.48rem;color:#9ca3af;margin-bottom:2px">Savings Rate</div><div style="font-size:0.95rem;font-weight:700;color:#22c55e">21.3%</div><div style="font-size:0.48rem;color:#86efac">↑ 3.2% vs last mo</div></div>
          <div style="background:#fff;border-radius:6px;padding:0.55rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)"><div style="font-size:0.48rem;color:#9ca3af;margin-bottom:2px">Top Expense</div><div style="font-size:0.72rem;font-weight:700;color:#f97316">🍕 Food</div><div style="font-size:0.48rem;color:#9ca3af">₹14,200 this month</div></div>
        </div>
      </div>`
  },

  // DEMO 2 — wedding planning RSVP
  {
    prompt: "a wedding planning countdown and RSVP page",
    url: "hyphertext.com/p/ria-arjun-wedding",
    thinking: "Designing romantic layout, RSVP form...",
    bg: "#1c1008",
    render: `
      <div style="background:linear-gradient(160deg,#1c1008,#2a1510);min-height:100%;padding:1.2rem;font-family:'Georgia',serif;color:#f5e6c8;text-align:center;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;opacity:0.03;background-image:radial-gradient(circle,#f5c27a 1px,transparent 1px);background-size:18px 18px;pointer-events:none"></div>
        <div style="position:relative">
          <div style="font-size:0.5rem;letter-spacing:0.2em;color:rgba(245,194,122,0.5);text-transform:uppercase;font-family:'Courier New',monospace;margin-bottom:0.5rem">We're getting married</div>
          <h1 style="font-size:1.4rem;font-weight:400;line-height:1.2;margin-bottom:0.2rem;color:#f5e6c8">Ria <span style="font-style:italic;color:rgba(245,194,122,0.6)">&</span> Arjun</h1>
          <div style="width:24px;height:1px;background:rgba(245,194,122,0.3);margin:0.55rem auto"></div>
          <p style="font-size:0.62rem;color:rgba(245,230,200,0.55);line-height:1.8;margin-bottom:0.85rem">Saturday, November 15, 2025<br/>The Leela Palace · Udaipur</p>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.35rem;margin-bottom:0.85rem">
            ${[["127","Days"],["04","Hours"],["38","Mins"],["22","Secs"]].map(([v,l])=>`<div style="background:rgba(245,194,122,0.07);border:1px solid rgba(245,194,122,0.15);border-radius:5px;padding:0.45rem 0.25rem"><div style="font-size:1.1rem;font-weight:400;color:#f5c27a;letter-spacing:-0.02em">${v}</div><div style="font-size:0.42rem;color:rgba(245,194,122,0.35);letter-spacing:0.08em;text-transform:uppercase">${l}</div></div>`).join('')}
          </div>
          <div style="background:rgba(245,194,122,0.07);border:1px solid rgba(245,194,122,0.15);border-radius:7px;padding:0.65rem">
            <div style="font-size:0.46rem;color:rgba(245,194,122,0.4);font-family:'Courier New',monospace;letter-spacing:0.1em;margin-bottom:0.35rem">RSVP BY OCT 15</div>
            <div style="display:flex;gap:0.35rem;margin-bottom:0.35rem"><input style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(245,194,122,0.2);border-radius:4px;padding:0.3rem 0.45rem;font-size:0.58rem;color:#f5e6c8;font-family:'Courier New',monospace;outline:none" placeholder="your name" /></div>
            <div style="display:flex;gap:0.35rem">
              <button style="flex:1;background:rgba(245,194,122,0.15);border:1px solid rgba(245,194,122,0.3);border-radius:4px;padding:0.3rem;font-size:0.58rem;color:#f5c27a;font-family:system-ui;cursor:pointer">✓ Attending</button>
              <button style="flex:1;background:transparent;border:1px solid rgba(245,194,122,0.15);border-radius:4px;padding:0.3rem;font-size:0.58rem;color:rgba(245,194,122,0.4);font-family:system-ui;cursor:pointer">✗ Can't make it</button>
            </div>
          </div>
          <div style="font-size:0.5rem;color:rgba(245,194,122,0.25);margin-top:0.5rem">84 of 120 guests have RSVP'd</div>
        </div>
      </div>`
  },

  // DEMO 3 — space mission dashboard
  {
    prompt: "a space mission dashboard for Mars 2047",
    url: "hyphertext.com/p/mars-2047-mission",
    thinking: "Designing telemetry panels, orbit data...",
    bg: "#04080f",
    render: `
      <div style="background:#04080f;min-height:100%;padding:1rem;font-family:'Courier New',monospace;color:#e0f0ff;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.85rem;border-bottom:1px solid #0d2a4a;padding-bottom:0.5rem">
          <span style="font-size:0.55rem;letter-spacing:0.15em;color:#2a7acc;text-transform:uppercase">MARS MISSION · 2047</span>
          <span style="font-size:0.52rem;color:#1a4a7a;font-family:monospace">SOL 312 · 14:23:07</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.4rem;margin-bottom:0.55rem">
          ${[["VELOCITY","24,200 km/h","↑ nominal"],["DISTANCE","78.3M km","to Mars"],["FUEL","68.4%","remaining"]].map(([l,v,s])=>`<div style="background:#08101e;border:1px solid #0d2a4a;border-radius:5px;padding:0.5rem"><div style="font-size:0.45rem;color:#2a5a8a;letter-spacing:0.1em;margin-bottom:0.2rem">${l}</div><div style="font-size:0.85rem;font-weight:700;color:#7ac8ff;letter-spacing:-0.02em">${v}</div><div style="font-size:0.45rem;color:#2a9d5c;margin-top:0.1rem">${s}</div></div>`).join('')}
        </div>
        <div style="background:#08101e;border:1px solid #0d2a4a;border-radius:5px;padding:0.55rem;margin-bottom:0.5rem">
          <div style="font-size:0.45rem;color:#2a5a8a;letter-spacing:0.08em;margin-bottom:0.35rem">TRAJECTORY</div>
          <svg viewBox="0 0 300 48" style="width:100%;height:38px"><path d="M0 38 Q75 6 150 24 Q225 42 300 10" stroke="#1a5a9a" stroke-width="1" fill="none" stroke-dasharray="4 2"/><circle cx="210" cy="36" r="3" fill="#7ac8ff"/><circle cx="295" cy="12" r="5" fill="#e05252" opacity="0.8"/><text x="198" y="46" font-size="7" fill="#2a7acc" font-family="monospace">YOU</text><text x="283" y="10" font-size="7" fill="#e05252" font-family="monospace">MARS</text></svg>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem">
          <div style="background:#08101e;border:1px solid #0d2a4a;border-radius:5px;padding:0.5rem">
            <div style="font-size:0.45rem;color:#2a5a8a;letter-spacing:0.08em;margin-bottom:0.3rem">CREW STATUS</div>
            ${["Cmdr. Reyes","Dr. Okafor","Eng. Park"].map(n=>`<div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:0.18rem"><div style="width:5px;height:5px;border-radius:50%;background:#2a9d5c;flex-shrink:0"></div><span style="font-size:0.55rem;color:#a0c8e0">${n}</span><span style="font-size:0.45rem;color:#2a9d5c;margin-left:auto">OK</span></div>`).join('')}
          </div>
          <div style="background:#08101e;border:1px solid #0d2a4a;border-radius:5px;padding:0.5rem">
            <div style="font-size:0.45rem;color:#2a5a8a;letter-spacing:0.08em;margin-bottom:0.3rem">SYSTEMS</div>
            ${[["Life Support","100%"],["Propulsion","97%"],["Comms","83%"]].map(([n,v])=>`<div style="margin-bottom:0.22rem"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:0.48rem;color:#5a8aaa">${n}</span><span style="font-size:0.48rem;color:#7ac8ff">${v}</span></div><div style="height:2px;background:#0d2a4a;border-radius:1px"><div style="height:100%;width:${v};background:#2a7acc;border-radius:1px"></div></div></div>`).join('')}
          </div>
        </div>
      </div>`
  },

  // DEMO 4 — Spotify-style lo-fi player
  {
    prompt: "a Spotify-style music player for lo-fi playlist",
    url: "hyphertext.com/p/lofi-player",
    thinking: "Building player controls, waveform, queue...",
    bg: "#0d0d12",
    render: `
      <div style="background:#0d0d12;min-height:100%;padding:1rem;font-family:system-ui,sans-serif;color:#fff;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.65rem">
          <span style="font-size:0.5rem;color:#6366f1;letter-spacing:0.1em;text-transform:uppercase;font-family:'Courier New',monospace">Lo-Fi Study Beats</span>
          <span style="font-size:0.5rem;color:#444">12 tracks · 1h 24m</span>
        </div>
        <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:10px;padding:1rem;margin-bottom:0.65rem;text-align:center;position:relative;overflow:hidden">
          <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 50%,rgba(99,102,241,0.3),transparent 60%);pointer-events:none"></div>
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:10px;margin:0 auto 0.55rem;display:flex;align-items:center;justify-content:center;position:relative"><span style="font-size:1.5rem">🎵</span></div>
          <div style="font-size:0.8rem;font-weight:600;color:#fff;margin-bottom:2px">Rainy Afternoon</div>
          <div style="font-size:0.58rem;color:rgba(255,255,255,0.4)">Lofi Girl · Study Collection</div>
        </div>
        <div style="margin-bottom:0.55rem">
          <div style="display:flex;justify-content:space-between;font-size:0.48rem;color:#444;margin-bottom:3px;font-family:'Courier New',monospace"><span>1:43</span><span>3:12</span></div>
          <div style="height:3px;background:#1a1a2e;border-radius:2px;overflow:hidden"><div style="height:100%;width:54%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:2px"></div></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:0.85rem;margin-bottom:0.65rem">
          ${["⏮","⏪","▶","⏩","⏭"].map((b,i)=>`<button style="background:${i===2?'#6366f1':'transparent'};border:${i===2?'none':'1px solid #2a2a40'};border-radius:50%;width:${i===2?'34px':'26px'};height:${i===2?'34px':'26px'};color:${i===2?'#fff':'#555'};font-size:${i===2?'0.85':'0.55'}rem;cursor:pointer;display:flex;align-items:center;justify-content:center">${b}</button>`).join('')}
        </div>
        <div style="background:#111;border-radius:6px;overflow:hidden">
          ${[["Rainy Afternoon","3:12",true],["Coffee Shop","2:58",false],["Midnight Tokyo","4:01",false]].map(([t,d,a])=>`<div style="display:flex;align-items:center;gap:0.45rem;padding:0.4rem 0.55rem;border-bottom:1px solid #1a1a2e;background:${a?'rgba(99,102,241,0.08)':'transparent'}"><div style="width:5px;height:5px;border-radius:50%;background:${a?'#6366f1':'#222'};flex-shrink:0"></div><span style="font-size:0.58rem;color:${a?'#a5b4fc':'#666'};flex:1">${t}</span><span style="font-size:0.5rem;color:#333;font-family:'Courier New',monospace">${d}</span></div>`).join('')}
        </div>
      </div>`
  },

  // DEMO 5 — office holiday party invitation
  {
    prompt: "an office holiday party invitation",
    url: "hyphertext.com/p/holiday-party-2025",
    thinking: "Designing festive layout, RSVP form...",
    bg: "#1a0a05",
    render: `
      <div style="background:linear-gradient(135deg,#1a0a05,#2a0f08);min-height:100%;padding:1.2rem;font-family:'Georgia',serif;color:#fff;text-align:center;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;opacity:0.04;background-image:radial-gradient(circle,#ff6b35 1px,transparent 1px);background-size:20px 20px;pointer-events:none"></div>
        <div style="position:relative">
          <div style="font-size:1.3rem;margin-bottom:0.4rem">🎄</div>
          <div style="font-size:0.46rem;letter-spacing:0.2em;color:rgba(255,165,80,0.55);text-transform:uppercase;font-family:'Courier New',monospace;margin-bottom:0.5rem">You're invited</div>
          <h1 style="font-size:1.25rem;font-weight:400;line-height:1.2;margin-bottom:0.2rem">Annual Holiday<br><em>Celebration</em></h1>
          <div style="width:24px;height:1px;background:rgba(255,165,80,0.35);margin:0.55rem auto"></div>
          <p style="font-size:0.62rem;color:rgba(255,220,180,0.55);line-height:1.8;margin-bottom:0.75rem">Friday, December 20 · 7:00 PM<br>Taj West End Ballroom · Bengaluru</p>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.35rem;margin-bottom:0.75rem">
            ${[["🍸","Open Bar"],["🎵","Live Jazz"],["🎁","Secret Santa"]].map(([e,l])=>`<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,165,80,0.14);border-radius:5px;padding:0.4rem;font-size:0.5rem;color:rgba(255,220,180,0.55)"><div style="font-size:0.9rem;margin-bottom:0.12rem">${e}</div>${l}</div>`).join('')}
          </div>
          <div style="background:rgba(255,165,80,0.08);border:1px solid rgba(255,165,80,0.2);border-radius:6px;padding:0.6rem">
            <div style="font-size:0.48rem;color:rgba(255,165,80,0.45);font-family:'Courier New',monospace;letter-spacing:0.08em;margin-bottom:0.3rem">RSVP BY DEC 15</div>
            <div style="display:flex;gap:0.35rem">
              <input style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,165,80,0.2);border-radius:4px;padding:0.28rem 0.45rem;font-size:0.58rem;color:#fff;font-family:'Courier New',monospace;outline:none" placeholder="your@company.com" />
              <button style="background:rgba(255,165,80,0.75);color:#1a0a05;border:none;border-radius:4px;padding:0.28rem 0.65rem;font-size:0.58rem;font-weight:600;font-family:system-ui;cursor:pointer">RSVP</button>
            </div>
          </div>
        </div>
      </div>`
  },

  // DEMO 6 — retro space invaders game
  {
    prompt: "a retro space invaders game",
    url: "hyphertext.com/p/space-invaders-game",
    thinking: "Coding game loop, collision, sprites...",
    bg: "#000",
    render: `
      <div style="background:#000;min-height:100%;padding:0.85rem;font-family:'Courier New',monospace;color:#0f0;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.55rem;border-bottom:1px solid #0a300a;padding-bottom:0.3rem">
          <span style="font-size:0.55rem;letter-spacing:0.1em">SPACE INVADERS</span>
          <span style="font-size:0.55rem">SCORE: 1,240</span>
          <span style="font-size:0.55rem">♥ ♥ ♥</span>
        </div>
        <div style="flex:1;position:relative;background:#000;border:1px solid #0a300a;border-radius:2px;padding:0.55rem;overflow:hidden">
          ${[0,1,2].map(row=>`<div style="display:flex;justify-content:center;gap:${row===0?'13':'11'}px;margin-bottom:${row===0?'6':'4'}px">
            ${Array(8).fill(0).map((_,i)=>{const alive=!(row===2&&(i===2||i===5));return alive?`<span style="font-size:${row===0?'0.6':'0.65'}rem;opacity:${row===0?'0.6':row===1?'0.8':'1'}">${row===0?'👾':'👽'}</span>`:`<span style="font-size:0.65rem;opacity:0"> </span>`;}).join('')}
          </div>`).join('')}
          <div style="position:absolute;left:35%;top:58%;width:2px;height:6px;background:#0f0"></div>
          <div style="position:absolute;left:60%;top:48%;width:2px;height:5px;background:#f00"></div>
          <div style="text-align:center;margin-top:1rem;font-size:1rem">🚀</div>
          <div style="display:flex;justify-content:space-around;margin-top:0.2rem">
            ${[0,1,2,3].map(()=>`<div style="width:18px;height:6px;background:#0f0;border-radius:3px 3px 0 0;opacity:0.7"></div>`).join('')}
          </div>
        </div>
        <div style="display:flex;justify-content:center;gap:0.55rem;margin-top:0.45rem">
          ${["◄","FIRE","►"].map((b,i)=>`<div style="border:1px solid #0f0;padding:0.25rem ${i===1?'0.85rem':'0.4rem'};border-radius:3px;font-size:0.55rem;color:#0f0;cursor:pointer">${b}</div>`).join('')}
        </div>
      </div>`
  },

  // DEMO 7 — neighbourhood cleanup
  {
    prompt: "a neighbourhood cleanup community event",
    url: "hyphertext.com/p/neighbourhood-cleanup",
    thinking: "Building event details, volunteer signup...",
    bg: "#f0f8f0",
    render: `
      <div style="background:#f0f8f0;min-height:100%;padding:1rem;font-family:system-ui,sans-serif;overflow:hidden">
        <div style="background:#2a7a3a;border-radius:8px;padding:0.8rem;margin-bottom:0.55rem;color:#fff;position:relative;overflow:hidden">
          <div style="position:absolute;right:-8px;top:-8px;font-size:2.2rem;opacity:0.1">🌳</div>
          <div style="font-size:0.48rem;letter-spacing:0.12em;text-transform:uppercase;font-family:'Courier New',monospace;color:rgba(255,255,255,0.45);margin-bottom:0.2rem">Community Event</div>
          <h2 style="font-size:0.95rem;font-weight:600;margin-bottom:0.12rem">Koramangala Clean-Up Day</h2>
          <p style="font-size:0.62rem;color:rgba(255,255,255,0.65)">Sunday, Jan 12 · 7:00 AM · Block 5 Park</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;margin-bottom:0.55rem">
          ${[["🧤","Gloves provided","Bring water"],["🚛","Truck available","For bulk waste"],["♻️","Segregation","Dry & Wet split"],["🥤","Refreshments","Post cleanup"]].map(([e,t,s])=>`<div style="background:#fff;border:1px solid #d0e8d0;border-radius:6px;padding:0.45rem;display:flex;align-items:flex-start;gap:0.3rem"><span style="font-size:0.85rem">${e}</span><div><div style="font-size:0.58rem;font-weight:500;color:#111">${t}</div><div style="font-size:0.5rem;color:#888">${s}</div></div></div>`).join('')}
        </div>
        <div style="background:#fff;border:1px solid #d0e8d0;border-radius:6px;padding:0.6rem;margin-bottom:0.45rem">
          <div style="font-size:0.48rem;font-family:'Courier New',monospace;color:#aaa;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.3rem">23 Volunteers · Goal: 30</div>
          <div style="height:4px;background:#e0e8e0;border-radius:2px;overflow:hidden"><div style="height:100%;width:76%;background:#2a7a3a;border-radius:2px"></div></div>
        </div>
        <button style="width:100%;padding:0.5rem;background:#2a7a3a;color:#fff;border:none;border-radius:6px;font-size:0.7rem;font-weight:600;font-family:system-ui;cursor:pointer">Join the effort →</button>
      </div>`
  },

  // DEMO 8 — micro course / quiz slide for students
  {
    prompt: "a micro course quiz slide for JEE Physics students",
    url: "hyphertext.com/p/jee-physics-quiz",
    thinking: "Building quiz cards, progress, explanations...",
    bg: "#0f0a1e",
    render: `
      <div style="background:#0f0a1e;min-height:100%;padding:1rem;font-family:system-ui,sans-serif;color:#e8e0ff;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.65rem">
          <span style="font-size:0.5rem;color:#7c3aed;letter-spacing:0.1em;text-transform:uppercase;font-family:'Courier New',monospace">JEE Physics · Wave Optics</span>
          <span style="font-size:0.5rem;color:#555">Q 3 / 10</span>
        </div>
        <div style="display:flex;gap:0.2rem;margin-bottom:0.65rem">
          ${Array(10).fill(0).map((_,i)=>`<div style="flex:1;height:3px;border-radius:2px;background:${i<2?'#7c3aed':i===2?'#a78bfa':'#2a2040'}"></div>`).join('')}
        </div>
        <div style="background:linear-gradient(135deg,#1a1030,#2a1848);border:1px solid rgba(124,58,237,0.25);border-radius:8px;padding:0.8rem;margin-bottom:0.55rem">
          <div style="font-size:0.48rem;color:#7c3aed;letter-spacing:0.08em;margin-bottom:0.35rem">QUESTION 3</div>
          <p style="font-size:0.72rem;color:#e8e0ff;line-height:1.55;margin-bottom:0.45rem;font-weight:400">In Young's double slit experiment, the fringe width is β. If the entire setup is immersed in water (μ = 4/3), the new fringe width becomes:</p>
          <div style="display:flex;flex-direction:column;gap:0.3rem">
            ${[["A","4β/3",false],["B","3β/4",true],["C","β",false],["D","β/2",false]].map(([l,opt,correct])=>`<button style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.6rem;background:${correct?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.03)'};border:1px solid ${correct?'#7c3aed':'rgba(255,255,255,0.08)'};border-radius:5px;cursor:pointer;text-align:left"><span style="font-size:0.58rem;color:${correct?'#a78bfa':'#555'};font-family:'Courier New',monospace;width:12px;flex-shrink:0">${l}</span><span style="font-size:0.65rem;color:${correct?'#e8e0ff':'#888'}">${opt}</span>${correct?`<span style="margin-left:auto;font-size:0.55rem;color:#7c3aed">✓ Correct</span>`:''}</button>`).join('')}
          </div>
        </div>
        <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:6px;padding:0.55rem">
          <div style="font-size:0.48rem;color:#7c3aed;letter-spacing:0.08em;margin-bottom:0.2rem">EXPLANATION</div>
          <p style="font-size:0.62rem;color:#a78bfa;line-height:1.5">β = λD/d. In water, λ becomes λ/μ, so β' = λD/μd = β/μ = 3β/4</p>
        </div>
      </div>`
  },

  // DEMO 9 — studio-inspired AI page builder (nod to studio code)
  {
    prompt: "an AI-powered page builder studio interface",
    url: "hyphertext.com/p/studio-builder",
    thinking: "Building editor layout, chat panel, preview...",
    bg: "#f8f7f4",
    render: `
      <div style="background:#f8f7f4;min-height:100%;font-family:system-ui,sans-serif;overflow:hidden;display:flex;flex-direction:column">
        <div style="height:36px;background:#fff;border-bottom:1px solid #e8e6e1;display:flex;align-items:center;padding:0 0.75rem;gap:0.6rem;flex-shrink:0">
          <div style="width:16px;height:16px;background:#111;border-radius:50%"></div>
          <span style="font-size:0.55rem;color:#aaa">/</span>
          <span style="font-size:0.62rem;color:#111;font-weight:500">my-startup-landing</span>
          <div style="margin-left:auto;display:flex;gap:0.3rem">
            ${["desktop","mobile","code"].map((t,i)=>`<span style="font-size:0.48rem;padding:2px 7px;border-radius:3px;background:${i===0?'#111':'transparent'};color:${i===0?'#fff':'#aaa'};border:1px solid ${i===0?'#111':'#e8e6e1'}">${t}</span>`).join('')}
          </div>
          <span style="font-size:0.55rem;padding:2px 8px;border-radius:3px;background:rgba(42,157,92,0.1);border:1px solid rgba(42,157,92,0.3);color:#2a9d5c">● live</span>
        </div>
        <div style="flex:1;display:flex;overflow:hidden">
          <div style="flex:1;background:#e8e6e1;display:flex;align-items:center;justify-content:center;padding:0.5rem">
            <div style="width:100%;height:100%;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center">
              <div style="text-align:center;padding:1rem">
                <div style="font-size:1.1rem;font-weight:700;color:#111;letter-spacing:-0.03em;margin-bottom:0.3rem">Your Idea,<br/><span style="color:#aaa;font-style:italic;font-family:Georgia,serif">Live.</span></div>
                <div style="font-size:0.55rem;color:#bbb;margin-bottom:0.5rem">Describe what you want →</div>
                <div style="width:36px;height:3px;background:#111;border-radius:2px;margin:0 auto"></div>
              </div>
            </div>
          </div>
          <div style="width:120px;background:#fff;border-left:1px solid #e8e6e1;display:flex;flex-direction:column">
            <div style="padding:0.4rem 0.6rem;border-bottom:1px solid #f0ede8">
              <div style="font-size:0.48rem;color:#bbb;font-family:'Courier New',monospace;letter-spacing:0.06em">chat</div>
            </div>
            <div style="flex:1;padding:0.5rem;display:flex;flex-direction:column;gap:0.3rem;overflow:hidden">
              <div style="background:#111;border-radius:6px 6px 2px 6px;padding:0.3rem 0.45rem;font-size:0.5rem;color:#f8f7f4;align-self:flex-end;max-width:90%">make the hero bold</div>
              <div style="background:#f8f7f4;border:1px solid #e8e6e1;border-radius:2px 6px 6px 6px;padding:0.3rem 0.45rem;font-size:0.5rem;color:#555;align-self:flex-start;max-width:90%">Done! Updated the hero section ✓</div>
              <div style="background:#111;border-radius:6px 6px 2px 6px;padding:0.3rem 0.45rem;font-size:0.5rem;color:#f8f7f4;align-self:flex-end;max-width:90%">add a CTA button</div>
              <div style="display:flex;align-items:center;gap:0.25rem;align-self:flex-start"><div style="width:4px;height:4px;border-radius:50%;background:#f59e0b;animation:pulse 1s infinite"></div><span style="font-size:0.48rem;color:#bbb;font-family:'Courier New',monospace">generating...</span></div>
            </div>
            <div style="padding:0.4rem 0.5rem;border-top:1px solid #f0ede8">
              <div style="background:#f8f7f4;border:1px solid #e8e6e1;border-radius:5px;padding:0.3rem 0.5rem;display:flex;align-items:center;gap:0.3rem">
                <span style="font-size:0.5rem;color:#ccc;flex:1">describe a change...</span>
                <div style="width:16px;height:16px;background:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="7" height="7" viewBox="0 0 14 14" fill="none"><path d="M1 13L13 7L1 1V5.5L9 7L1 8.5V13Z" fill="#fff"/></svg></div>
              </div>
            </div>
          </div>
        </div>
      </div>`
  },
];