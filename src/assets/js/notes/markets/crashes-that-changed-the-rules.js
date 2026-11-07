// Charts for the note "Crashes That Changed the Rules" (Markets · How Markets Work).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, frame, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");

  // Small helper: a row of toggle buttons
  const buttons = (boxId, items, onPick, start) => {
    const box = $(boxId);
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = it.n;
      b.setAttribute("aria-pressed", i === start ? "true" : "false");
      b.addEventListener("click", () => {
        [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
        onPick(i);
      });
      box.appendChild(b);
    });
  };

  // ---------- Same shock, different crash ----------
  if (has("chart-crash")) {
    const LEV = [{ n: "No leverage", L: 1 }, { n: "3× leverage", L: 3 }, { n: "10× leverage", L: 10 }];
    // k: how many % the price falls when 1% of the market is force-sold
    const LIQ = [{ n: "Deep market", k: 0.5 }, { n: "Normal", k: 1 }, { n: "Thin market", k: 2 }];
    const DAYS = 20, PACE = 0.25, BOUNCE = 0.08;
    let li = 1, qi = 1;
    const simulate = (L, k, crowd, shock) => {
      const base = 100 * (1 - shock);
      const P = [100], sells = [0];
      // Each leveraged holder is forced out somewhere between a 0.3/L and a 0.9/L fall
      const lo = 0.3 / L, hi = 0.9 / L;
      let p = base, triggered = 0, queue = 0;
      for (let d = 1; d <= DAYS; d++) {
        if (L > 1) {
          const fall = 1 - p / 100;
          const want = Math.min(1, Math.max(0, (fall - lo) / (hi - lo)));
          if (want > triggered) { queue += want - triggered; triggered = want; }
        }
        const sell = Math.min(queue, PACE);           // share of all forced sellers selling today
        queue -= sell;
        const sold = sell * crowd;                     // % of the whole market sold today
        if (sold > 1e-9) p *= 1 - (k * sold) / 100;
        else p += BOUNCE * (base - p);
        P.push(p); sells.push(sold);
      }
      return { P, sells, base, triggered };
    };
    const draw = () => {
      const crowd = parseInt($("cx-crowd").value, 10), shockPct = parseInt($("cx-shock").value, 10);
      $("cx-crowd-out").textContent = crowd + "%";
      $("cx-shock-out").textContent = "−" + shockPct + "%";
      const L = LEV[li].L, k = LIQ[qi].k;
      const r = simulate(L, k, crowd, shockPct / 100);
      const low = Math.min(...r.P), lowDay = r.P.indexOf(low);
      const t = tone(), g = grey(), c = card();
      const svg = $("chart-crash"), W = 640, Ht = 300, pad = { l: 48, r: 16, t: 16, b: 38 };
      const f = frame(svg, W, Ht, pad, [0, DAYS], [20, 105], [], [20, 40, 60, 80, 100], (y) => y);
      [0, 5, 10, 15, 20].forEach((x) => {
        el("text", { x: f.sx(x), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = x;
      });
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "days after the shock (price starts at 100)";

      // Bars: forced selling each day, as % of the market (10% of the market = full bar)
      const barMax = (f.sy(20) - f.sy(105)) * 0.3, bw = (f.sx(1) - f.sx(0)) * 0.6;
      r.sells.forEach((s, d) => {
        if (s < 1e-9) return;
        const h = Math.min(1, s / 10) * barMax;
        el("rect", { x: f.sx(d) - bw / 2, y: f.sy(20) - h, width: bw, height: h, rx: 3, fill: g, "fill-opacity": 0.35 }, svg);
      });
      // Shock alone
      el("path", { d: "M" + f.sx(0) + "," + f.sy(100) + "L" + f.sx(1) + "," + f.sy(r.base) + "L" + f.sx(DAYS) + "," + f.sy(r.base), fill: "none", stroke: g, "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
      // With forced selling
      let d = "";
      r.P.forEach((p, i) => { d += (i ? "L" : "M") + f.sx(i).toFixed(1) + "," + f.sy(p).toFixed(1); });
      el("path", { d, fill: "none", stroke: t, "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
      if (low < r.base - 0.5) {
        el("circle", { cx: f.sx(lowDay), cy: f.sy(low), r: 7, fill: t, stroke: c, "stroke-width": 2 }, svg);
        const right = lowDay > 14;
        el("text", { x: f.sx(lowDay) + (right ? -4 : 12), y: f.sy(low) + (right ? 22 : 4), "text-anchor": right ? "end" : "start", style: "fill:" + t + ";font-weight:600" }, svg).textContent = "low " + Math.round(low);
      }

      const out = $("cx-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Shock alone: } -" + shockPct + "\\% \\quad \\text{At the bottom: } -" + Math.round(100 - low) + "\\%");
      tex(b, "\\text{Forced sellers who sold: } " + Math.round(r.triggered * 100) + "\\%");

      const extra = (r.base - low);
      let story;
      if (L === 1) story = "Nobody here has borrowed, so nobody is forced to sell. The market takes the " + shockPct + "% hit and slowly finds its feet. Unpleasant, but not a crash.";
      else if (crowd === 0) story = "The leveraged holders own none of this market, so their margin calls don't touch it. Crowding matters as much as leverage.";
      else if (r.triggered === 0) story = "At " + L + "× leverage, a " + shockPct + "% fall doesn't reach anyone's forced-sale point, so the shock stays a shock. Make it bigger, or raise the leverage, and see where it tips.";
      else if (extra < 3) story = "A few forced sellers, a little extra fall. Deep liquidity and modest crowding absorbed most of it.";
      else story = "The shock was " + shockPct + "%, but the market fell " + Math.round(100 - low) + "%. Each wave of forced selling pushed the price past the next group's limit: " + Math.round(r.triggered * 100) + "% of the leveraged holders were forced out. " + (lowDay >= DAYS - 2 ? "Here the selling drips on for weeks, a slow grind lower rather than one dramatic day. Try a thin market to see it turn into a sudden crash." : "Once the selling stopped, the price bounced, but the forced sellers had already sold at the bottom.");
      $("cx-story").textContent = story;
    };
    buttons("cx-lev", LEV, (i) => { li = i; draw(); }, 1);
    buttons("cx-liq", LIQ, (i) => { qi = i; draw(); }, 1);
    ["cx-crowd", "cx-shock"].forEach((id) => $(id).addEventListener("input", draw));
    H.charts(draw);
  }

  // ---------- Crashes and the rules they left ----------
  if (has("chart-time")) {
    const EVENTS = [
      { y: "1929", n: "The Wall Street Crash", what: "After a boom fuelled by shares bought with as little as 10% down, the US market crashed in October 1929 and kept falling for three years, losing almost 90% by 1932.", amp: "Leverage: margin loans everywhere, and banks gambling depositors' money.", rule: "The Securities Act (1933) and Exchange Act (1934) created the SEC and the disclosure rules; the Fed got power over margin (later Reg T); banks were split from securities firms." },
      { y: "1987", n: "Black Monday", what: "On 19 October 1987 the Dow fell 22.6% in a single day, still its biggest one-day fall.", amp: "Crowding: \"portfolio insurance\" programs all sold futures as prices fell, which pushed prices down further.", rule: "Market-wide circuit breakers that pause trading after big falls, and the lesson that liquidity vanishes when everyone sells." },
      { y: "1998", n: "LTCM", what: "A hedge fund run by star traders and two Nobel winners lost about $4.6 billion in weeks after Russia defaulted.", amp: "Leverage of about 25×, in trades many others also held.", rule: "No new law, but a Fed-organised rescue by 14 banks, and the lasting lesson that in a crisis correlations go to one." },
      { y: "2001", n: "Enron", what: "One of America's biggest companies collapsed after years of hidden debts and fake profits.", amp: "Trust: the accounts themselves were false.", rule: "Sarbanes-Oxley (2002): bosses personally sign off the accounts, auditors are policed, and internal controls are tested." },
      { y: "2008", n: "The global financial crisis", what: "US mortgage losses spread through banks worldwide; Lehman Brothers failed and governments rescued much of the banking system.", amp: "Leverage everywhere, hidden in mortgage securities and derivatives nobody could see clearly.", rule: "Dodd-Frank and the Volcker Rule, Basel III capital, central clearing of derivatives, stress tests, and UK ring-fencing." },
      { y: "2009", n: "Nigeria's margin-loan crash", what: "The NSE All-Share Index fell about two-thirds from its March 2008 peak as banks called in loans used to buy shares.", amp: "Leverage: bank margin loans, often to buy the banks' own shares.", rule: "The CBN removed the bosses of eight banks in 2009, and AMCON was set up in 2010 to take on the bad loans." },
      { y: "2010", n: "The Flash Crash", what: "On 6 May 2010 the Dow fell about 9% in minutes, then mostly recovered within the hour.", amp: "Liquidity: algorithms and market makers withdrew all at once, and a huge sell program hit an empty book.", rule: "Limit Up-Limit Down bands and single-stock pauses; a trader was later convicted of spoofing linked to it." },
      { y: "2012", n: "Knight Capital", what: "A faulty software release made Knight's algorithms send millions of wrong orders, losing $440 million in about 45 minutes. The firm had to be rescued and sold.", amp: "Operational risk: no working kill switch.", rule: "Stricter testing, pre-trade limits and kill switches, enforced under the SEC's market access rule." },
      { y: "2015", n: "The Swiss franc shock", what: "The Swiss central bank suddenly dropped its cap on the franc, which jumped about 30% in minutes.", amp: "Leverage: retail FX traders at 50–100× and brokers who couldn't cover their losses.", rule: "It fed into the EU and UK retail limits: leverage caps (30× on major pairs), automatic close-out, and no losing more than your deposit." },
      { y: "2020", n: "The Covid \"dash for cash\"", what: "In March 2020 investors sold everything, even US Treasuries, to raise cash, and the safest market in the world stopped trading smoothly.", amp: "Leverage in the Treasury basis trade, and dealers without room on their balance sheets.", rule: "Huge Fed buying, and later an SEC rule moving most Treasury trading into central clearing." },
      { y: "2021", n: "GameStop and Archegos", what: "Retail buyers squeezed GameStop's crowded shorts (Melvin Capital lost 53% in January); weeks later Archegos collapsed and banks lost over $10 billion.", amp: "Crowding (short interest over 100% of the float) and hidden leverage through swaps.", rule: "Part of the case for T+1 settlement (2024), and pressure for disclosure of large swap positions." },
      { y: "2022", n: "The UK gilt crisis", what: "After the September mini-budget, gilt yields jumped so fast that leveraged pension (LDI) funds faced about £66 billion of collateral calls.", amp: "Leverage in a market everyone thought was safe.", rule: "Bank of England gilt buying, then a requirement that LDI funds hold enough buffer to survive yields rising about 2.5 percentage points." },
    ];
    let ei = 0;
    const NAV = [{ n: "◀ Earlier" }, { n: "Later ▶" }];
    const draw = () => {
      const t = tone(), g = grey(), c = card();
      const svg = $("chart-time");
      svg.textContent = "";
      const x0 = 40, x1 = 600, y = 70, step = (x1 - x0) / (EVENTS.length - 1);
      el("line", { x1: x0, x2: x1, y1: y, y2: y, stroke: g, "stroke-width": 2 }, svg);
      el("line", { x1: x0, x2: x0 + ei * step, y1: y, y2: y, stroke: t, "stroke-width": 3 }, svg);
      EVENTS.forEach((e, i) => {
        const x = x0 + i * step, on = i === ei;
        const dot = el("circle", { class: "dot", cx: x, cy: y, r: on ? 11 : 7, fill: on ? t : i < ei ? t : c, stroke: on || i < ei ? t : g, "stroke-width": 2 }, svg);
        dot.addEventListener("click", () => { ei = i; draw(); });
        el("text", { x, y: y + (i % 2 ? -22 : 34), "text-anchor": "middle", style: on ? "fill:" + t + ";font-weight:600" : "" }, svg).textContent = e.y;
      });
      const e = EVENTS[ei], box = $("tl-detail");
      box.textContent = "";
      const h = document.createElement("strong");
      h.textContent = e.y + ": " + e.n;
      const p1 = document.createElement("p"), p2 = document.createElement("p"), p3 = document.createElement("p");
      p1.textContent = e.what;
      p2.textContent = "What made it worse: " + e.amp;
      p3.textContent = "What it left behind: " + e.rule;
      box.append(h, p1, p2, p3);
    };
    const nav = $("tl-nav");
    NAV.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = it.n;
      b.addEventListener("click", () => { ei = Math.max(0, Math.min(EVENTS.length - 1, ei + (i ? 1 : -1))); draw(); });
      nav.appendChild(b);
    });
    H.charts(draw);
  }
})();