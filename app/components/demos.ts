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
      <div style="background:#080d1a;min-height:100%;padding:0.85rem;font-family:'Courier New',monospace;color:#e8f4ff;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.65rem">
          <div style="display:flex;align-items:center;gap:0.4rem">
            <div style="width:6px;height:6px;border-radius:50%;background:#ff4444;box-shadow:0 0 6px #ff4444;animation:pulse 1s infinite"></div>
            <span style="font-size:0.5rem;color:#ff4444;letter-spacing:0.12em;text-transform:uppercase">Live Scores</span>
          </div>
          <span style="font-size:0.45rem;color:#1a3a5a;font-family:monospace">Updated 12s ago</span>
        </div>
        <div style="background:linear-gradient(135deg,#0e1628,#0a1020);border:1px solid #1a2a4a;border-radius:8px;padding:0.7rem;margin-bottom:0.45rem;position:relative;overflow:hidden">
          <div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle,rgba(74,122,170,0.1),transparent);pointer-events:none"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.45rem">
            <span style="font-size:0.44rem;color:#4a7aaa;letter-spacing:0.1em;text-transform:uppercase">&#127955; IPL 2025 · Wankhede · 2nd Innings</span>
            <span style="font-size:0.42rem;padding:1px 6px;background:rgba(255,68,68,0.15);border:1px solid rgba(255,68,68,0.3);border-radius:10px;color:#ff6666">LIVE</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem">
            <div>
              <div style="display:flex;align-items:center;gap:0.35rem;margin-bottom:0.15rem">
                <div style="width:18px;height:18px;background:linear-gradient(135deg,#004B8D,#001F5B);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.55rem">&#128309;</div>
                <span style="font-size:0.68rem;font-weight:600;color:#fff">MI</span>
              </div>
              <div style="font-size:1.5rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-0.03em">186<span style="font-size:0.7rem;color:#4a7aaa;font-weight:400">/4</span></div>
              <div style="font-size:0.44rem;color:#4a7aaa;margin-top:1px">17.3 overs · RR: 10.7</div>
            </div>
            <div style="text-align:center;padding:0 0.5rem">
              <div style="font-size:0.42rem;color:#334;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px">Need</div>
              <div style="font-size:1.2rem;font-weight:700;color:#f59e0b;line-height:1">47</div>
              <div style="font-size:0.44rem;color:#f59e0b;margin-top:1px">off 15 balls</div>
              <div style="font-size:0.4rem;color:#556;margin-top:2px">RRR: 18.8</div>
            </div>
            <div style="text-align:right">
              <div style="display:flex;align-items:center;gap:0.35rem;margin-bottom:0.15rem;justify-content:flex-end">
                <span style="font-size:0.68rem;font-weight:600;color:#aaa">RCB</span>
                <div style="width:18px;height:18px;background:linear-gradient(135deg,#C8102E,#6B0010);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.55rem">&#128308;</div>
              </div>
              <div style="font-size:1.5rem;font-weight:700;color:#888;line-height:1;letter-spacing:-0.03em">232<span style="font-size:0.7rem;color:#4a7aaa;font-weight:400">/6</span></div>
              <div style="font-size:0.44rem;color:#4a7aaa;margin-top:1px">20 overs · Batting 1st</div>
            </div>
          </div>
          <div style="display:flex;gap:0.2rem;margin-bottom:0.35rem">
            ${["4","6","W","1","6","4"].map(b=>`<div style="width:18px;height:18px;border-radius:3px;background:${b==="W"?"rgba(255,68,68,0.2)":b==="6"?"rgba(74,200,120,0.15)":"rgba(255,255,255,0.05)"};border:1px solid ${b==="W"?"rgba(255,68,68,0.4)":b==="6"?"rgba(74,200,120,0.3)":"rgba(255,255,255,0.08)"};display:flex;align-items:center;justify-content:center;font-size:0.55rem;color:${b==="W"?"#ff6666":b==="6"?"#4ac878":"#aaa"};font-family:monospace">${b}</div>`).join('')}
            <span style="font-size:0.44rem;color:#334;align-self:center;margin-left:2px">Last 6</span>
          </div>
          <div style="background:rgba(255,255,255,0.03);border-radius:4px;padding:0.28rem 0.45rem;font-size:0.46rem;color:#6a8aaa">
            &#127955; <span style="color:#fff">Rohit Sharma</span> 82(44) · <span style="color:#fff">Hardik Pandya</span> 31(18) &nbsp;|&nbsp; Bowling: <span style="color:#fbbf24">Siraj</span> 3-0-28-1
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#0a1a0e,#071209);border:1px solid #1a3a1a;border-radius:8px;padding:0.65rem;margin-bottom:0.45rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem">
            <span style="font-size:0.44rem;color:#4aaa6a;letter-spacing:0.1em;text-transform:uppercase">&#9917; Premier League · Emirates · 78'</span>
            <div style="display:flex;align-items:center;gap:3px">
              <div style="width:5px;height:5px;border-radius:50%;background:#4aaa6a;animation:pulse 1.5s infinite"></div>
              <span style="font-size:0.42rem;color:#4aaa6a">LIVE</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:0.4rem">
              <div style="width:22px;height:22px;background:linear-gradient(135deg,#EF0107,#9B0001);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem">&#128308;</div>
              <div><div style="font-size:0.65rem;font-weight:600;color:#fff">Arsenal</div><div style="font-size:0.44rem;color:#4aaa6a">Saka 34' · Havertz 61'</div></div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.75rem;font-weight:700;color:#fff;letter-spacing:-0.04em;line-height:1">2 – 1</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.4rem;flex-direction:row-reverse">
              <div style="width:22px;height:22px;background:linear-gradient(135deg,#034694,#001F5B);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem">&#128309;</div>
              <div style="text-align:right"><div style="font-size:0.65rem;font-weight:600;color:#fff">Chelsea</div><div style="font-size:0.44rem;color:#4aaa6a">Mudryk 45+2'</div></div>
            </div>
          </div>
          <div style="height:3px;background:linear-gradient(90deg,#EF0107 60%,#034694 60%);border-radius:2px;opacity:0.6;margin-top:0.35rem"></div>
          <div style="display:flex;justify-content:space-between;font-size:0.42rem;color:#3a6a4a;margin-top:2px"><span>60% possession</span><span>40% possession</span></div>
        </div>
        <div style="background:rgba(255,255,255,0.02);border:1px solid #1a1a2e;border-radius:6px;padding:0.5rem;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:0.3rem">
            <span style="font-size:0.65rem">&#127EB9;&#128309;</span>
            <div><div style="font-size:0.58rem;color:#888">Barcelona</div><div style="font-size:0.42rem;color:#555">La Liga · FT</div></div>
          </div>
          <div style="font-size:1.1rem;font-weight:700;color:#666;letter-spacing:-0.02em">3 – 2</div>
          <div style="display:flex;align-items:center;gap:0.3rem">
            <div style="text-align:right"><div style="font-size:0.58rem;color:#888">Real Madrid</div><div style="font-size:0.42rem;color:#555">Full Time</div></div>
            <span style="font-size:0.65rem">&#9899;&#128;&#128;</span>
          </div>
        </div>
      </div>`
  },

  // DEMO 1 — personal finance tracker
  {
    prompt: "a personal finance tracker with spending breakdown",
    url: "hyphertext.com/p/finance-tracker",
    thinking: "Building budget categories, charts, transactions...",
    bg: "#f8f9fa",
    render: `
      <div style="background:#f8f9fa;min-height:100%;padding:0.85rem;font-family:system-ui,sans-serif;overflow:hidden">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.65rem">
          <div>
            <div style="font-size:0.44rem;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:2px;font-family:'Courier New',monospace">March 2025 · Summary</div>
            <div style="font-size:1.55rem;font-weight:700;color:#111;letter-spacing:-0.04em;line-height:1">&#8377;61,400</div>
            <div style="font-size:0.5rem;color:#9ca3af;margin-top:2px">of &#8377;75,000 budget</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.44rem;color:#9ca3af;margin-bottom:2px">Savings this month</div>
            <div style="font-size:1rem;font-weight:700;color:#22c55e">&#8377;13,600</div>
            <div style="display:flex;align-items:center;gap:2px;justify-content:flex-end;margin-top:2px">
              <span style="font-size:0.5rem;color:#86efac">&#8593; 18.1%</span>
              <span style="font-size:0.44rem;color:#bbb">vs Feb</span>
            </div>
          </div>
        </div>
        <div style="background:#fff;border-radius:8px;padding:0.65rem;margin-bottom:0.5rem;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
          <div style="display:flex;align-items:center;gap:0.6rem">
            <svg width="42" height="42" viewBox="0 0 42 42" style="flex-shrink:0">
              <circle cx="21" cy="21" r="15" fill="none" stroke="#f3f4f6" stroke-width="6"/>
              <circle cx="21" cy="21" r="15" fill="none" stroke="#f97316" stroke-width="6" stroke-dasharray="35 60" stroke-dashoffset="-5" stroke-linecap="round"/>
              <circle cx="21" cy="21" r="15" fill="none" stroke="#3b82f6" stroke-width="6" stroke-dasharray="20 75" stroke-dashoffset="-40" stroke-linecap="round"/>
              <circle cx="21" cy="21" r="15" fill="none" stroke="#8b5cf6" stroke-width="6" stroke-dasharray="30 65" stroke-dashoffset="-60" stroke-linecap="round"/>
              <circle cx="21" cy="21" r="15" fill="none" stroke="#f59e0b" stroke-width="6" stroke-dasharray="10 85" stroke-dashoffset="-90" stroke-linecap="round"/>
              <text x="21" y="24" text-anchor="middle" font-size="6" fill="#111" font-family="system-ui" font-weight="600">81%</text>
            </svg>
            <div style="flex:1">
              <div style="font-size:0.48rem;color:#9ca3af;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:0.3rem;font-family:'Courier New',monospace">Spending by category</div>
              ${([["Food","&#8377;18,200","#f97316",30],["Transport","&#8377;12,400","#3b82f6",20],["Shopping","&#8377;16,800","#8b5cf6",27],["Utilities","&#8377;8,200","#f59e0b",13]] as [string,string,string,number][]).map(([n,amt,c,w])=>`
              <div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:0.22rem">
                <span style="font-size:0.5rem;color:#555;width:52px">${n}</span>
                <div style="flex:1;height:4px;background:#f3f4f6;border-radius:2px;overflow:hidden"><div style="height:100%;width:${Number(w)*3.3}px;background:${c};border-radius:2px"></div></div>
                <span style="font-size:0.48rem;font-weight:600;color:#111;width:36px;text-align:right">${amt}</span>
              </div>`).join('')}
            </div>
          </div>
        </div>
        <div style="background:#fff;border-radius:8px;padding:0.6rem;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <div style="font-size:0.44rem;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;font-family:'Courier New',monospace;margin-bottom:0.35rem">Recent Transactions</div>
          ${[["&#127843;","Sushi Garden","Dining","&#8377;2,340","#f97316"],["&#128647;","Metro Card","Transport","&#8377;500","#3b82f6"],["&#128230;","Amazon","Shopping","&#8377;4,199","#8b5cf6"],["&#9749;","Blue Tokai","Dining","&#8377;480","#f97316"]].map(([e,n,c,amt,col])=>`
          <div style="display:flex;align-items:center;gap:0.4rem;padding:0.28rem 0;border-bottom:1px solid #f9fafb">
            <div style="width:22px;height:22px;background:${col}15;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;flex-shrink:0">${e}</div>
            <div style="flex:1"><div style="font-size:0.56rem;color:#111;font-weight:500">${n}</div><div style="font-size:0.44rem;color:#bbb">${c}</div></div>
            <div style="font-size:0.58rem;font-weight:600;color:#374151">-${amt}</div>
          </div>`).join('')}
        </div>
      </div>`
  },

  // DEMO 2 — Holiday Party invitation
  {
    prompt: "an office holiday party invitation page",
    url: "hyphertext.com/p/holiday-party-2025",
    thinking: "Designing festive layout, RSVP, countdown...",
    bg: "#1a0a05",
    render: `
      <div style="background:linear-gradient(160deg,#1a0a05,#2a0f08,#1a0a05);min-height:100%;padding:1rem;font-family:'Georgia',serif;color:#fff;text-align:center;position:relative;overflow:hidden">
        <div style="position:absolute;top:-30px;left:-20px;width:100px;height:100px;background:radial-gradient(circle,rgba(255,100,30,0.12),transparent);pointer-events:none"></div>
        <div style="position:absolute;bottom:-20px;right:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(255,180,50,0.08),transparent);pointer-events:none"></div>
        <div style="position:absolute;inset:0;opacity:0.025;background-image:radial-gradient(circle,#ff6b35 1px,transparent 1px);background-size:18px 18px;pointer-events:none"></div>
        <div style="position:relative">
          <div style="font-size:1.6rem;margin-bottom:0.3rem;filter:drop-shadow(0 0 8px rgba(255,150,50,0.4))">&#127876;</div>
          <div style="font-size:0.44rem;letter-spacing:0.2em;color:rgba(255,165,80,0.45);text-transform:uppercase;font-family:'Courier New',monospace;margin-bottom:0.45rem">Technova · Annual Celebration</div>
          <h1 style="font-size:1.3rem;font-weight:400;line-height:1.2;margin-bottom:0.15rem;letter-spacing:-0.02em">Holiday <em style="font-style:italic;color:rgba(255,200,100,0.7)">Gala</em></h1>
          <p style="font-size:0.58rem;color:rgba(255,220,180,0.45);line-height:1.9;margin-bottom:0.65rem">Friday, December 20 · Doors open 7:00 PM<br/>Taj West End Ballroom · Bengaluru</p>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.3rem;margin-bottom:0.65rem">
            ${[["127","Days"],["04","Hrs"],["38","Min"],["22","Sec"]].map(([v,l])=>`
            <div style="background:rgba(255,165,80,0.06);border:1px solid rgba(255,165,80,0.12);border-radius:6px;padding:0.4rem 0.2rem">
              <div style="font-size:1.15rem;font-weight:300;color:#f5c27a;letter-spacing:-0.03em;line-height:1">${v}</div>
              <div style="font-size:0.38rem;color:rgba(255,165,80,0.3);letter-spacing:0.1em;text-transform:uppercase;margin-top:2px;font-family:'Courier New',monospace">${l}</div>
            </div>`).join('')}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.3rem;margin-bottom:0.6rem">
            ${[["&#127864;","Open Bar","Premium cocktails"],["&#127927;","Live Jazz","8-piece band"],["&#127873;","Secret Santa","&#8377;500 limit"]].map(([e,t,s])=>`
            <div style="background:rgba(255,165,80,0.05);border:1px solid rgba(255,165,80,0.1);border-radius:5px;padding:0.4rem 0.25rem">
              <div style="font-size:0.95rem;margin-bottom:0.15rem">${e}</div>
              <div style="font-size:0.5rem;color:rgba(255,220,180,0.65);font-family:system-ui;font-weight:500">${t}</div>
              <div style="font-size:0.42rem;color:rgba(255,165,80,0.3);margin-top:1px;font-family:system-ui">${s}</div>
            </div>`).join('')}
          </div>
          <div style="background:rgba(255,165,80,0.07);border:1px solid rgba(255,165,80,0.18);border-radius:7px;padding:0.6rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.35rem">
              <span style="font-size:0.44rem;color:rgba(255,165,80,0.4);font-family:'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase">RSVP by Dec 15</span>
              <span style="font-size:0.44rem;color:rgba(255,165,80,0.35)">68 / 120 attending</span>
            </div>
            <div style="height:2px;background:rgba(255,165,80,0.08);border-radius:1px;overflow:hidden;margin-bottom:0.35rem"><div style="height:100%;width:57%;background:rgba(255,165,80,0.4);border-radius:1px"></div></div>
            <div style="display:flex;gap:0.3rem">
              <input style="flex:1;background:rgba(0,0,0,0.35);border:1px solid rgba(255,165,80,0.18);border-radius:4px;padding:0.3rem 0.4rem;font-size:0.54rem;color:#fff;font-family:'Courier New',monospace;outline:none" placeholder="your@company.com" />
              <button style="background:rgba(255,165,80,0.75);color:#1a0a05;border:none;border-radius:4px;padding:0.3rem 0.6rem;font-size:0.54rem;font-weight:700;font-family:system-ui;cursor:pointer;letter-spacing:0.03em">RSVP &#10003;</button>
            </div>
          </div>
        </div>
      </div>`
  },

  // DEMO 3 — Neighbourhood Cleanup
  {
    prompt: "a neighbourhood cleanup community event page",
    url: "hyphertext.com/p/koramangala-cleanup",
    thinking: "Building event details, map pins, volunteer tracker...",
    bg: "#f0f8f0",
    render: `
      <div style="background:#f0f8f0;min-height:100%;padding:0.85rem;font-family:system-ui,sans-serif;overflow:hidden">
        <div style="background:linear-gradient(135deg,#166534,#15803d);border-radius:10px;padding:0.75rem;margin-bottom:0.5rem;color:#fff;position:relative;overflow:hidden">
          <div style="position:absolute;right:-10px;top:-10px;font-size:3.5rem;opacity:0.06;line-height:1">&#127795;</div>
          <div style="position:relative">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem">
              <span style="font-size:0.44rem;letter-spacing:0.12em;text-transform:uppercase;font-family:'Courier New',monospace;color:rgba(255,255,255,0.45)">Community Initiative</span>
              <span style="font-size:0.42rem;padding:1px 7px;background:rgba(255,255,255,0.15);border-radius:10px;border:1px solid rgba(255,255,255,0.2)">&#128197; Jan 12</span>
            </div>
            <h2 style="font-size:1.05rem;font-weight:600;letter-spacing:-0.02em;margin-bottom:0.2rem">Koramangala Clean-Up Day</h2>
            <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.52rem;color:rgba(255,255,255,0.6)">
              <span>&#128205; Block 5 Park and Surrounding Streets</span>
              <span style="opacity:0.4">·</span>
              <span>&#8987; 7:00 - 11:00 AM</span>
            </div>
          </div>
        </div>
        <div style="background:#e0eee0;border:1px solid #c0d8c0;border-radius:8px;height:60px;margin-bottom:0.5rem;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;inset:0;opacity:0.35;background-image:linear-gradient(rgba(100,160,100,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(100,160,100,0.3) 1px,transparent 1px);background-size:12px 12px"></div>
          <div style="position:absolute;left:35%;top:50%;transform:translate(-50%,-50%)">
            <div style="width:8px;height:8px;background:#166534;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 4px rgba(22,101,52,0.2)"></div>
          </div>
          <div style="position:absolute;left:55%;top:40%;transform:translate(-50%,-50%)">
            <div style="width:6px;height:6px;background:#15803d;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 3px rgba(21,128,61,0.2)"></div>
          </div>
          <div style="position:absolute;left:70%;top:60%;transform:translate(-50%,-50%)">
            <div style="width:5px;height:5px;background:#166534;border-radius:50%;border:2px solid #fff;opacity:0.7"></div>
          </div>
          <span style="font-size:0.44rem;color:#2d6a2d;font-family:'Courier New',monospace;letter-spacing:0.06em;position:relative;z-index:1;background:rgba(240,248,240,0.85);padding:2px 8px;border-radius:10px">&#128205; 3 cleanup zones mapped</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.35rem;margin-bottom:0.5rem">
          ${[["&#129510;","Gloves and bags","Provided free"],["&#128666;","Waste truck","Block 5 at 10AM"],["&#9851;","Segregation","Wet · Dry · E-waste"],["&#129380;","Refreshments","Chai + breakfast"]].map(([e,t,s])=>`
          <div style="background:#fff;border:1px solid #d0e8d0;border-radius:6px;padding:0.4rem;display:flex;align-items:flex-start;gap:0.3rem">
            <span style="font-size:0.85rem">${e}</span>
            <div><div style="font-size:0.56rem;font-weight:600;color:#111">${t}</div><div style="font-size:0.44rem;color:#888;margin-top:1px">${s}</div></div>
          </div>`).join('')}
        </div>
        <div style="background:#fff;border:1px solid #d0e8d0;border-radius:8px;padding:0.55rem;margin-bottom:0.4rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem">
            <span style="font-size:0.44rem;font-family:'Courier New',monospace;color:#888;letter-spacing:0.06em;text-transform:uppercase">Volunteer Goal</span>
            <span style="font-size:0.55rem;font-weight:700;color:#166534">26 / 35 joined</span>
          </div>
          <div style="height:5px;background:#e0e8e0;border-radius:3px;overflow:hidden;margin-bottom:0.3rem">
            <div style="height:100%;width:74%;background:linear-gradient(90deg,#15803d,#22c55e);border-radius:3px"></div>
          </div>
          <div style="display:flex;gap:0.15rem;flex-wrap:wrap">
            ${Array(26).fill(0).map(()=>`<span style="font-size:0.55rem">&#128100;</span>`).join('')}
            ${Array(9).fill(0).map(()=>`<span style="font-size:0.55rem;opacity:0.2;color:#888">&#9675;</span>`).join('')}
          </div>
        </div>
        <button style="width:100%;padding:0.5rem;background:linear-gradient(135deg,#166534,#15803d);color:#fff;border:none;border-radius:7px;font-size:0.68rem;font-weight:600;font-family:system-ui;cursor:pointer;letter-spacing:0.02em;box-shadow:0 2px 8px rgba(22,101,52,0.3)">&#127807; Join the effort - 9 spots left</button>
      </div>`
  },

  // DEMO 4 — Interference of Waves Science Quiz
  {
    prompt: "a science quiz on interference of waves experiment",
    url: "hyphertext.com/p/waves-interference-quiz",
    thinking: "Building interactive quiz, wave diagrams, scoring...",
    bg: "#050d1a",
    render: `
      <div style="background:#050d1a;min-height:100%;padding:0.85rem;font-family:system-ui,sans-serif;color:#e0f0ff;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.55rem">
          <div>
            <div style="font-size:0.44rem;color:#38bdf8;letter-spacing:0.1em;text-transform:uppercase;font-family:'Courier New',monospace">Physics Lab</div>
            <div style="font-size:0.7rem;font-weight:600;color:#fff;margin-top:1px">Wave Interference</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.44rem;color:#444;margin-bottom:2px">Score</div>
            <div style="font-size:1rem;font-weight:700;color:#38bdf8">4 / 5</div>
          </div>
        </div>
        <div style="display:flex;gap:0.2rem;margin-bottom:0.55rem">
          ${["#22c55e","#22c55e","#22c55e","#22c55e","#38bdf8"].map((c)=>`<div style="flex:1;height:4px;border-radius:2px;background:${c}"></div>`).join('')}
        </div>
        <div style="background:#0a1628;border:1px solid #0d2a4a;border-radius:8px;padding:0.55rem;margin-bottom:0.5rem">
          <div style="font-size:0.44rem;color:#38bdf8;letter-spacing:0.08em;font-family:'Courier New',monospace;margin-bottom:0.35rem;text-transform:uppercase">Young's Double Slit - Fringe Pattern</div>
          <svg viewBox="0 0 240 52" style="width:100%;height:40px">
            <rect x="50" y="0" width="3" height="18" fill="#1e3a5a"/>
            <rect x="50" y="24" width="3" height="4" fill="#38bdf8" opacity="0.8"/>
            <rect x="50" y="32" width="3" height="20" fill="#1e3a5a"/>
            ${[0,1,2].map(i=>`<ellipse cx="50" cy="26" rx="${8+i*12}" ry="${3+i*5}" fill="none" stroke="#38bdf8" stroke-width="0.5" opacity="${0.3-i*0.08}"/>`).join('')}
            <rect x="195" y="0" width="3" height="52" fill="#0d2a4a"/>
            ${[-22,-14,-6,2,10,18,26].map((y,i)=>`<rect x="198" y="${y+26}" width="${i===3?10:i%2===0?7:4}" height="4" rx="2" fill="#38bdf8" opacity="${i===3?0.95:0.45}"/>`).join('')}
            <line x1="53" y1="26" x2="195" y2="6" stroke="#38bdf8" stroke-width="0.4" stroke-dasharray="3 2" opacity="0.3"/>
            <line x1="53" y1="26" x2="195" y2="28" stroke="#38bdf8" stroke-width="0.4" stroke-dasharray="3 2" opacity="0.5"/>
            <line x1="53" y1="26" x2="195" y2="46" stroke="#38bdf8" stroke-width="0.4" stroke-dasharray="3 2" opacity="0.3"/>
            <text x="3" y="29" font-size="5" fill="#2a5a8a" font-family="monospace">S</text>
            <text x="140" y="18" font-size="5" fill="#2a5a8a" font-family="monospace">&#955;D/d</text>
          </svg>
        </div>
        <div style="background:#0a1628;border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:0.6rem;margin-bottom:0.45rem">
          <div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:0.3rem">
            <span style="font-size:0.44rem;color:#38bdf8;font-family:'Courier New',monospace;letter-spacing:0.06em">Q5 of 5</span>
            <span style="font-size:0.44rem;padding:1px 6px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.2);border-radius:10px;color:#38bdf8">Constructive</span>
          </div>
          <p style="font-size:0.65rem;color:#e0f0ff;line-height:1.55;margin-bottom:0.4rem">In a double slit experiment, two waves arrive at point P with a path difference of 2&#955;. The resulting interference is:</p>
          <div style="display:flex;flex-direction:column;gap:0.25rem">
            ${[["A","Constructive — bright fringe",true],["B","Destructive — dark fringe",false],["C","Partial — grey fringe",false],["D","No fringe formed",false]].map(([l,opt,correct])=>`
            <div style="display:flex;align-items:center;gap:0.4rem;padding:0.32rem 0.5rem;background:${correct?"rgba(34,197,94,0.12)":"rgba(255,255,255,0.02)"};border:1px solid ${correct?"rgba(34,197,94,0.35)":"rgba(255,255,255,0.06)"};border-radius:5px;cursor:pointer">
              <span style="font-size:0.5rem;color:${correct?"#4ade80":"#334"};font-family:'Courier New',monospace;width:10px;flex-shrink:0">${l}</span>
              <span style="font-size:0.6rem;color:${correct?"#e0f0ff":"#6a8aaa"}">${opt}</span>
              ${correct?`<span style="margin-left:auto;font-size:0.5rem;color:#4ade80">&#10003;</span>`:""}
            </div>`).join('')}
          </div>
        </div>
        <div style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);border-radius:6px;padding:0.5rem">
          <div style="font-size:0.44rem;color:#4ade80;font-family:'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.2rem">Explanation</div>
          <p style="font-size:0.56rem;color:#86efac;line-height:1.55">Path difference = n&#955; (n=2, integer) &#8594; waves in phase &#8594; constructive interference &#8594; bright fringe. Condition: &#916; = n&#955;</p>
        </div>
      </div>`
  },

  // DEMO 5 — Space Shooter Game
  {
    prompt: "a retro space shooter arcade game",
    url: "hyphertext.com/p/space-shooter",
    thinking: "Coding ships, laser beams, enemy waves, explosions...",
    bg: "#02040e",
    render: `
      <div style="background:#02040e;min-height:100%;padding:0.7rem;font-family:'Courier New',monospace;color:#a0c8ff;display:flex;flex-direction:column;overflow:hidden;position:relative">
        <!-- Starfield -->
        <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden">
          ${Array.from({length:38},(_,i)=>{const x=(i*47.3)%100;const y=(i*13.7)%100;const s=i%3===0?1.5:i%3===1?1:0.6;const op=0.15+((i*0.04)%0.4);return `<div style="position:absolute;left:${x}%;top:${y}%;width:${s}px;height:${s}px;border-radius:50%;background:#fff;opacity:${op.toFixed(2)};animation:pulse ${1+(i%3)}s ${(i*0.13).toFixed(1)}s infinite"></div>`;}).join('')}
        </div>
        <!-- HUD -->
        <div style="position:relative;display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem;padding-bottom:0.32rem;border-bottom:1px solid rgba(100,160,255,0.1)">
          <div>
            <div style="font-size:0.4rem;color:#1a3a6a;letter-spacing:0.12em;text-transform:uppercase">Score</div>
            <div style="font-size:1rem;font-weight:700;color:#7ac8ff;letter-spacing:-0.02em;line-height:1;text-shadow:0 0 8px rgba(122,200,255,0.45)">24,850</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.4rem;color:#1a3a6a;text-transform:uppercase;letter-spacing:0.1em">Wave</div>
            <div style="font-size:0.8rem;font-weight:700;color:#fff">05</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.4rem;color:#1a3a6a;text-transform:uppercase;letter-spacing:0.1em">Multiplier</div>
            <div style="font-size:0.8rem;font-weight:700;color:#f59e0b">&#215;3</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.4rem;color:#1a3a6a;text-transform:uppercase;margin-bottom:2px">Lives</div>
            <div style="display:flex;gap:2px;justify-content:flex-end">
              ${[1,2,3].map(()=>`<svg width="11" height="11" viewBox="0 0 22 22"><path d="M11 4 L14 9 L20 10 L15 15 L16 21 L11 18 L6 21 L7 15 L2 10 L8 9 Z" fill="#7ac8ff" stroke="#4a9aff" stroke-width="0.5" style="filter:drop-shadow(0 0 3px #7ac8ff)"/></svg>`).join('')}
            </div>
          </div>
        </div>
        <!-- Arena -->
        <div style="position:relative;flex:1;min-height:148px;overflow:hidden;border:1px solid rgba(100,160,255,0.07);border-radius:4px;background:linear-gradient(180deg,#02040e 0%,#030a1a 100%)">
          <!-- Nebula -->
          <div style="position:absolute;left:15%;top:5%;width:130px;height:65px;background:radial-gradient(ellipse,rgba(80,40,160,0.1),transparent);pointer-events:none"></div>
          <div style="position:absolute;right:10%;bottom:28%;width:90px;height:55px;background:radial-gradient(ellipse,rgba(30,70,160,0.09),transparent);pointer-events:none"></div>

          <!-- Enemy row 1 — Heavy cruisers (magenta) -->
          ${[0,1,2,3].map(i=>`
          <div style="position:absolute;left:${11+i*22}%;top:7%">
            <svg width="22" height="17" viewBox="0 0 22 17">
              <polygon points="11,1 19,6 20,15 15,13 11,16 7,13 2,15 3,6" fill="#8a1a5a" stroke="#e060a0" stroke-width="0.8" style="filter:drop-shadow(0 0 3px #e060a0)"/>
              <ellipse cx="11" cy="8" rx="3" ry="2.5" fill="#ff80c0" opacity="0.85"/>
              <line x1="11" y1="16" x2="11" y2="21" stroke="#e060a0" stroke-width="1" opacity="0.5"/>
            </svg>
          </div>`).join('')}

          <!-- Enemy row 2 — Fighters (blue), one exploding -->
          ${[0,1,2,3,4].map(i=>`
          <div style="position:absolute;left:${7+i*19}%;top:22%;${i===2?"opacity:0.25":""}">
            <svg width="17" height="14" viewBox="0 0 17 14">
              <polygon points="8,1 15,6 14,13 8,11 2,13 3,6" fill="${i===2?"#1a2a3a":"#0e3a70"}" stroke="${i===2?"#2a3a4a":"#3a8aee"}" stroke-width="0.8" style="filter:${i===2?"none":"drop-shadow(0 0 2px #3a8aee)"}"/>
              <ellipse cx="8" cy="7" rx="2.5" ry="2" fill="${i===2?"#111":"#60b0ff"}" opacity="0.9"/>
            </svg>
            ${i===2?`
            <div style="position:absolute;inset:-6px;pointer-events:none">
              <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(255,210,50,0.55),rgba(255,100,0,0.25),transparent 70%);animation:pulse 0.35s infinite"></div>
              ${[0,45,90,135,180,225,270,315].map(deg=>`<div style="position:absolute;top:50%;left:50%;width:8px;height:1.5px;background:linear-gradient(90deg,#ff8c00,transparent);transform:rotate(${deg}deg);transform-origin:0 50%;border-radius:1px;opacity:0.8"></div>`).join('')}
            </div>`:""}
          </div>`).join('')}

          <!-- Laser: player shot going up -->
          <div style="position:absolute;left:calc(50% - 1px);top:37%;width:2px;height:16px;background:linear-gradient(180deg,#7ac8ff,rgba(122,200,255,0.1));box-shadow:0 0 5px #7ac8ff;border-radius:1px"></div>
          <div style="position:absolute;left:calc(50% - 1px);top:26%;width:2px;height:11px;background:linear-gradient(180deg,rgba(122,200,255,0.5),transparent);border-radius:1px"></div>
          <!-- Laser: enemy shot going down -->
          <div style="position:absolute;left:30%;top:33%;width:1.5px;height:11px;background:linear-gradient(180deg,#e060a0,transparent);box-shadow:0 0 3px #e060a0;border-radius:1px"></div>
          <div style="position:absolute;left:72%;top:28%;width:1.5px;height:9px;background:linear-gradient(180deg,#3a8aee,transparent);box-shadow:0 0 3px #3a8aee;border-radius:1px"></div>

          <!-- Power-up: shield (green orb) -->
          <div style="position:absolute;right:16%;top:40%;width:16px;height:16px;display:flex;align-items:center;justify-content:center">
            <div style="width:14px;height:14px;border-radius:50%;border:1.5px solid #22c55e;background:rgba(34,197,94,0.1);box-shadow:0 0 7px rgba(34,197,94,0.45);animation:pulse 1.2s infinite;display:flex;align-items:center;justify-content:center;font-size:0.5rem">&#128737;</div>
          </div>
          <!-- Power-up: speed (yellow bolt) -->
          <div style="position:absolute;left:8%;top:48%;width:14px;height:14px;display:flex;align-items:center;justify-content:center">
            <div style="width:12px;height:12px;border-radius:50%;border:1.5px solid #f59e0b;background:rgba(245,158,11,0.1);box-shadow:0 0 6px rgba(245,158,11,0.4);animation:pulse 1.5s 0.3s infinite;display:flex;align-items:center;justify-content:center;font-size:0.5rem">&#9889;</div>
          </div>

          <!-- Player ship -->
          <div style="position:absolute;left:50%;bottom:9%;transform:translateX(-50%)">
            <svg width="30" height="26" viewBox="0 0 30 26">
              <ellipse cx="15" cy="26" rx="7" ry="3.5" fill="#3b82f6" opacity="0.25"/>
              <ellipse cx="15" cy="26" rx="3.5" ry="2.5" fill="#7ac8ff" opacity="0.5">
                <animate attributeName="ry" values="2.5;4;2.5" dur="0.28s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0.95;0.5" dur="0.28s" repeatCount="indefinite"/>
              </ellipse>
              <polygon points="15,1 24,9 26,20 21,23 15,22 9,23 4,20 6,9" fill="#0e3266" stroke="#4a9aff" stroke-width="1.2" style="filter:drop-shadow(0 0 5px rgba(74,154,255,0.6))"/>
              <ellipse cx="15" cy="11" rx="4.5" ry="5.5" fill="#1a5acc" stroke="#7ac8ff" stroke-width="0.9"/>
              <ellipse cx="15" cy="10" rx="2.8" ry="3.2" fill="#b0e0ff" opacity="0.55"/>
              <rect x="1" y="15" width="5" height="2.5" rx="1.2" fill="#2a6acc"/>
              <rect x="24" y="15" width="5" height="2.5" rx="1.2" fill="#2a6acc"/>
            </svg>
          </div>
          <!-- Rotating shield ring -->
          <div style="position:absolute;left:50%;bottom:calc(9% + 1px);transform:translateX(-50%);width:48px;height:48px;margin-left:-24px;margin-bottom:-11px">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="21" fill="none" stroke="#22c55e" stroke-width="1.2" stroke-dasharray="9 5" opacity="0.45">
                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="3.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(34,197,94,0.15)" stroke-width="0.8" stroke-dasharray="4 8" opacity="0.6">
                <animateTransform attributeName="transform" type="rotate" from="360 24 24" to="0 24 24" dur="6s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
        </div>

        <!-- Bottom HUD -->
        <div style="position:relative;display:grid;grid-template-columns:1fr 1fr auto;align-items:center;gap:0.45rem;margin-top:0.38rem">
          <div>
            <div style="display:flex;justify-content:space-between;font-size:0.38rem;color:#1a3a6a;margin-bottom:2px"><span>HULL</span><span style="color:#ef4444">72%</span></div>
            <div style="height:4px;background:#060e20;border-radius:2px;overflow:hidden;border:1px solid #0a1830">
              <div style="height:100%;width:72%;background:linear-gradient(90deg,#dc2626,#f97316);border-radius:2px;box-shadow:0 0 4px rgba(239,68,68,0.4)"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:0.38rem;color:#1a3a6a;margin-bottom:2px"><span>ENERGY</span><span style="color:#7ac8ff">88%</span></div>
            <div style="height:4px;background:#060e20;border-radius:2px;overflow:hidden;border:1px solid #0a1830">
              <div style="height:100%;width:88%;background:linear-gradient(90deg,#2563eb,#7ac8ff);border-radius:2px;box-shadow:0 0 4px rgba(122,200,255,0.35)"></div>
            </div>
          </div>
          <div style="display:flex;gap:0.18rem;align-items:center">
            <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
              <div style="width:22px;height:20px;border:1px solid rgba(100,160,255,0.18);border-radius:3px;background:rgba(15,30,60,0.9);display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:#4a7aaa;cursor:pointer">&#9650;</div>
            </div>
            ${[["&#9668;",""],["&#9660;",""],["&#9658;",""]].map(([b])=>`<div style="width:22px;height:20px;border:1px solid rgba(100,160,255,0.18);border-radius:3px;background:rgba(15,30,60,0.9);display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:#4a7aaa;cursor:pointer">${b}</div>`).join('')}
            <div style="display:flex;flex-direction:column;align-items:center;gap:1px;margin-left:2px">
              <div style="width:28px;height:20px;border:1px solid rgba(245,158,11,0.35);border-radius:3px;background:rgba(30,20,5,0.9);display:flex;align-items:center;justify-content:center;font-size:0.5rem;color:#f59e0b;cursor:pointer;box-shadow:0 0 5px rgba(245,158,11,0.2)">FIRE</div>
            </div>
          </div>
        </div>
      </div>`
  },
];