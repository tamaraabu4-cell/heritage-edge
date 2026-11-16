// Interactives for the note "The Four Engines" (Quant · Quant Trading Firms).
// Both charts are drawn at their real width, so the labels stay readable on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, colour } = H;
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

  const fit = (svg, h) => {
    const w = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.textContent = "";
    return w;
  };
  const onResize = (id, draw) => {
    let last = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($(id).getBoundingClientRect().width);
      if (w && w !== last) { last = w; draw(); }
    });
  };
  const choice = (boxId, items, start, onPick) => {
    const box = $(boxId);
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = it;
      b.setAttribute("aria-pressed", i === start ? "true" : "false");
      b.addEventListener("click", () => { [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); onPick(i); });
      box.append(b);
    });
  };
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const rng = (s) => () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const niceStep = (span, parts) => {
    const raw = span / parts, mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
  };
  const k = (v) => (v < -0.5 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-GB") + "k";
  const usd = (v) => (v < -0.5 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-GB");

  // ---------- Name the engine ----------
  if ($("ne-list")) {
    const BOXES = ["Liquidity provision", "Arbitrage", "Statistical edge", "Risk premium"];
    const CASES = [
      { d: "Quoting a bid and an offer in EUR/USD all day and earning the gap between them.", ok: [0], why: "Liquidity provision: paid for being there to trade immediately. Revenue grows with flow; the risk is being picked off." },
      { d: "Buying S&P 500 futures when they trade below the value of the 500 shares inside them (after financing), and selling the shares.", ok: [1], why: "Arbitrage: the future and the basket are the same thing, so their prices should match. Margins are tiny and the fastest firms take them." },
      { d: "Buying the 200 shares that rose most over the past year and selling the 200 that fell most, rebalanced monthly.", ok: [2], why: "A statistical edge: momentum works slightly more often than not, so it needs many positions and many months to show up." },
      { d: "Borrowing yen at almost 0% to hold Mexican peso bonds paying around 10%.", ok: [3], why: "A risk premium (carry): you're paid the rate gap for holding the risk that the peso falls suddenly. Steady until it isn't." },
      { d: "Selling options every month because the volatility they price in usually turns out higher than what follows.", ok: [3], why: "A risk premium: option buyers pay for protection, so sellers earn a premium, with large losses when markets crash (short vol)." },
      { d: "An ETF market maker quoting the ETF all day and creating or redeeming units whenever the ETF drifts from the value of its basket.", ok: [0, 1], why: "Both: quoting the ETF is liquidity provision, and creating or redeeming units to close any gap with the basket is arbitrage. Many market makers run the two engines together." },
      { d: "Noticing that a share tends to drift up in the minutes after a large buy imbalance in the closing auction, and trading it thousands of times a year.", ok: [2], why: "A statistical edge from order flow: a small, noisy advantage that only pays across many trades." },
      { d: "Buying high-yield corporate bonds because their extra yield is more than the defaults you expect.", ok: [3], why: "A risk premium: the credit spread pays you for default and recession risk, and defaults arrive together in downturns." },
      { d: "Buying a 10-year gilt and selling a gilt future when the bond is cheap compared with the future, and holding until delivery.", ok: [1], why: "Arbitrage (relative value): the cash-futures basis should close by delivery. Small margins, often with leverage, and a tail risk if funding dries up, as in March 2020." },
    ];
    const list = $("ne-list"), state = CASES.map(() => null);
    const score = () => {
      const done = state.filter((s) => s !== null).length, right = state.filter((s) => s === true).length;
      $("ne-score").textContent = done ? right + " of " + done + " right first time" + (done === CASES.length ? (right >= 7 ? ". That's an interview answer ready to go." : ". Look again at the risk shape column in the table.") : "") : "";
    };
    CASES.forEach((c, i) => {
      const li = document.createElement("li"); li.className = "ne-row";
      const p = document.createElement("p"); p.className = "ne-case"; p.textContent = c.d;
      const opts = document.createElement("div"); opts.className = "ne-opts"; opts.setAttribute("role", "group"); opts.setAttribute("aria-label", "Which engine?");
      const why = document.createElement("p"); why.className = "ne-why"; why.hidden = true;
      BOXES.forEach((b, j) => {
        const btn = document.createElement("button"); btn.type = "button"; btn.textContent = b;
        btn.addEventListener("click", () => {
          const good = c.ok.includes(j);
          if (state[i] === null) state[i] = good;
          if (good) {
            [...opts.children].forEach((x, q) => { x.classList.toggle("right", c.ok.includes(q)); x.disabled = true; });
            why.textContent = "";
            const st = document.createElement("strong"); st.textContent = state[i] ? "Right. " : "Got there. ";
            why.append(st, document.createTextNode(c.why)); why.hidden = false;
          } else { btn.classList.add("wrong"); btn.disabled = true; }
          score();
        });
        opts.append(btn);
      });
      li.append(p, opts, why); list.append(li);
    });
    score();
  }

  // ---------- Gross, net and capacity ----------
  if ($("chart-gc")) {
    const V0 = 30;
    const draw = () => {
      const V = parseFloat($("gc-v").value), g = parseFloat($("gc-g").value), f = parseFloat($("gc-f").value), i0 = parseFloat($("gc-i").value);
      $("gc-v-out").textContent = "$" + V + "m"; $("gc-g-out").textContent = g.toFixed(1) + " bp";
      $("gc-f-out").textContent = f.toFixed(1) + " bp"; $("gc-i-out").textContent = i0.toFixed(1) + " bp";
      const imp = (v) => i0 * Math.sqrt(v / V0);
      const net = (v) => (g - f - imp(v)) * 1e-4 * v * 1e6;
      const noImp = (v) => (g - f) * 1e-4 * v * 1e6;
      const edge = g - f;
      const Vstar = edge > 0 ? V0 * ((2 * edge) / (3 * i0)) ** 2 : 0, Vbe = edge > 0 ? V0 * (edge / i0) ** 2 : 0;
      const XMAX = 150;

      const svg = $("chart-gc"), w = fit(svg, 280), h = 280;
      const pad = { l: 56, r: 14, t: 18, b: 40 };
      const pts = []; for (let v = 0; v <= XMAX; v += 1) pts.push([v, net(v)]);
      const peak = edge > 0 ? net(Math.min(Vstar, XMAX)) : 0;
      let hi = Math.max(peak, net(V), 500) * 1.3, lo = Math.min(...pts.map((p) => p[1]), 0);
      lo = Math.max(lo, -hi * 1.2);
      const step = niceStep(hi - lo, 5), y0 = Math.floor(lo / step) * step, y1 = Math.ceil(hi / step) * step;
      const yt = []; for (let y = y0; y <= y1 + step / 2; y += step) yt.push(Math.round(y));
      const sc = H.frame(svg, w, h, pad, [0, XMAX], [y0, y1], w < 420 ? [0, 50, 100, 150] : [0, 25, 50, 75, 100, 125, 150], yt, (v) => usd(v));
      el("text", { x: w - pad.r, y: h - 4, "text-anchor": "end" }, svg).textContent = "Daily volume ($ millions)";
      el("text", { x: 4, y: 11 }, svg).textContent = "Net profit a day";
      // clip helper: keep lines inside the plot
      const cy = (v) => sc.sy(Math.max(y0, Math.min(y1, v)));
      let dn = ""; for (let v = 0; v <= XMAX; v += 2) dn += (v ? "L" : "M") + sc.sx(v).toFixed(1) + " " + cy(noImp(v)).toFixed(1);
      el("path", { d: dn, fill: "none", stroke: grey(), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      const d = pts.map(([v, p], j) => (j ? "L" : "M") + sc.sx(v).toFixed(1) + " " + cy(p).toFixed(1)).join("");
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 2.6 }, svg);
      if (edge > 0 && Vstar <= XMAX) {
        el("line", { x1: sc.sx(Vstar), x2: sc.sx(Vstar), y1: sc.sy(peak), y2: sc.sy(0), stroke: tone(), "stroke-dasharray": "2 3" }, svg);
        el("text", { x: sc.sx(Vstar), y: sc.sy(peak) - 8, "text-anchor": Vstar > XMAX * 0.8 ? "end" : "middle", style: "fill:var(--text);font-weight:600" }, svg).textContent = "capacity $" + Vstar.toFixed(0) + "m";
      }
      el("circle", { cx: sc.sx(V), cy: cy(net(V)), r: 6, fill: tone(), stroke: colour("--bg") || "#fff", "stroke-width": 2 }, svg);

      const nbp = g - f - imp(V);
      const out = $("gc-read"); out.textContent = "";
      span(out, "Impact at $" + V + "m: " + imp(V).toFixed(2) + " bp");
      span(out, "Net edge: " + (nbp < 0 ? "−" : "") + Math.abs(nbp).toFixed(2) + " bp");
      span(out, "Net a day: " + usd(net(V)));
      span(out, edge > 0 ? "Best volume: $" + Vstar.toFixed(1) + "m (" + usd(net(Vstar)) + ")" : "No volume is profitable");
      if (edge > 0) span(out, "Stops paying at $" + Vbe.toFixed(0) + "m");

      const costShare = Math.min(100, Math.round(((f + imp(V)) / g) * 100));
      let story;
      if (edge <= 0) story = "Fees alone (" + f.toFixed(1) + " bp) eat the whole " + g.toFixed(1) + " bp gross edge, so the strategy loses money at any size. An edge that can't pay its own costs doesn't run.";
      else if (nbp < 0) story = "At $" + V + "m, impact (" + imp(V).toFixed(2) + " bp) plus fees is bigger than the gross edge, so the strategy loses " + usd(-net(V)) + " a day. It stops paying beyond $" + Vbe.toFixed(0) + "m.";
      else if (V < Vstar * 0.85) story = "Costs take " + costShare + "% of the gross edge. There's room to grow: profit keeps rising until about $" + Vstar.toFixed(0) + "m, though each extra million adds less than the last.";
      else if (V <= Vstar * 1.15) story = "Close to capacity: around $" + Vstar.toFixed(0) + "m the strategy earns the most it ever will, about " + usd(net(Vstar)) + " a day. Costs take " + costShare + "% of the gross edge.";
      else story = "Past capacity: the strategy is bigger than its edge can support. Trading less (about $" + Vstar.toFixed(0) + "m) would earn more (" + usd(net(Vstar)) + " against " + usd(net(V)) + "). Deltashark's warning in numbers: doubling volume can net less.";
      $("gc-story").textContent = story;
    };
    ["gc-v", "gc-g", "gc-f", "gc-i"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-gc", draw);
    H.charts(draw);
  }

  // ---------- Build a firm from engines ----------
  if ($("chart-bf")) {
    const DAYS = 252, CRISIS = 170;
    // daily mean and standard deviation in $ thousands; crisis losses over three days
    const ENG = [
      { n: "Market making", s: "Making", mu: 5, sd: 30, hit: [-150, -40, 20] },
      { n: "Arbitrage", s: "Arb", mu: 3, sd: 20, hit: [-200, -80, -30] },
      { n: "Statistical edges", s: "Stat", mu: 4, sd: 45, hit: null },
      { n: "Risk premia", s: "Premia", mu: 3, sd: 18, hit: [-300, -120, -40] },
    ];
    const on = ENG.map(() => true);
    let crisis = 0, seed = 11;

    const onBox = $("bf-on");
    ENG.forEach((e, i) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = e.n; b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", () => {
        if (on[i] && on.filter(Boolean).length === 1) return; // keep at least one engine
        on[i] = !on[i]; b.setAttribute("aria-pressed", on[i] ? "true" : "false"); draw();
      });
      onBox.append(b);
    });
    choice("bf-year", ["A calm year", "A year with a crisis"], 0, (i) => { crisis = i; draw(); });
    $("bf-again").addEventListener("click", () => { seed = (seed * 48271 + 17) % 2147483647; draw(); });

    const sharpe = (xs) => {
      const m = xs.reduce((a, b) => a + b, 0) / xs.length;
      const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
      return v > 0 ? (m / Math.sqrt(v)) * Math.sqrt(252) : 0;
    };
    const sd = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };

    const draw = () => {
      const series = ENG.map((e, i) => {
        const r = rng(seed * 7 + i * 101), xs = [];
        for (let d = 0; d < DAYS; d++) {
          let x = e.mu + e.sd * normal(r);
          if (crisis && d >= CRISIS && d < CRISIS + 3) x = e.hit ? e.hit[d - CRISIS] + e.sd * 0.5 * normal(r) : e.mu + e.sd * 2 * normal(r);
          xs.push(x);
        }
        return xs;
      });
      const live = ENG.map((_, i) => i).filter((i) => on[i]);
      const firm = Array.from({ length: DAYS }, (_, d) => live.reduce((a, i) => a + series[i][d], 0));
      const cum = (xs) => { let s = 0; return [0].concat(xs.map((x) => (s += x))); };
      const lines = live.map((i) => ({ lab: ENG[i].s, ys: cum(series[i]), firm: false })).concat(live.length > 1 ? [{ lab: "Firm", ys: cum(firm), firm: true }] : []);

      const svg = $("chart-bf"), w = fit(svg, 300), h = 300;
      const pad = { l: 52, r: 62, t: 16, b: 34 };
      let lo = 0, hi = 0; lines.forEach((L) => L.ys.forEach((y) => { if (y < lo) lo = y; if (y > hi) hi = y; }));
      const step = niceStep(hi - lo || 100, 5), y0 = Math.floor(lo / step) * step, y1 = Math.ceil(hi / step) * step;
      const yt = []; for (let y = y0; y <= y1 + step / 2; y += step) yt.push(Math.round(y));
      const sc = H.frame(svg, w, h, pad, [0, DAYS], [y0, y1], w < 420 ? [0, 126, 252] : [0, 63, 126, 189, 252], yt, (v) => k(v));
      el("text", { x: w - pad.r, y: h - 4, "text-anchor": "end" }, svg).textContent = "Trading days";
      if (crisis) {
        el("rect", { x: sc.sx(CRISIS), y: pad.t, width: Math.max(3, sc.sx(CRISIS + 3) - sc.sx(CRISIS)), height: h - pad.t - pad.b, fill: colour("--danger") || "#dc2626", "fill-opacity": 0.18 }, svg);
        el("text", { x: sc.sx(CRISIS) - 4, y: pad.t + 12, "text-anchor": "end" }, svg).textContent = "crisis";
      }
      const ends = [];
      lines.forEach((L) => {
        const d = L.ys.map((y, j) => (j ? "L" : "M") + sc.sx(j).toFixed(1) + " " + sc.sy(y).toFixed(1)).join("");
        el("path", { d, fill: "none", stroke: L.firm ? tone() : grey(), "stroke-width": L.firm ? 2.8 : 1.4, "stroke-opacity": L.firm ? 1 : 0.85 }, svg);
        ends.push({ lab: L.lab, y: sc.sy(L.ys[DAYS]), firm: L.firm });
      });
      ends.sort((a, b) => a.y - b.y);
      for (let j = 1; j < ends.length; j++) if (ends[j].y - ends[j - 1].y < 13) ends[j].y = ends[j - 1].y + 13;
      ends.forEach((e) => el("text", { x: w - pad.r + 6, y: e.y + 4, style: e.firm ? "fill:var(--text);font-weight:700" : "" }, svg).textContent = e.lab);

      const single = live.map((i) => ({ n: ENG[i].n, s: sharpe(series[i]), sd: sd(series[i]) }));
      const avgS = single.reduce((a, x) => a + x.s, 0) / single.length;
      const fS = sharpe(firm), worst = Math.min(...firm), sumSd = single.reduce((a, x) => a + x.sd, 0), fSd = sd(firm);
      const out = $("bf-read"); out.textContent = "";
      span(out, "Firm's year: " + k(firm.reduce((a, b) => a + b, 0)));
      span(out, "Firm Sharpe: " + fS.toFixed(1) + (live.length > 1 ? " (average engine " + avgS.toFixed(1) + ")" : ""));
      span(out, "Daily swing: " + k(fSd) + " (engines added up: " + k(sumSd) + ")");
      span(out, "Worst day: " + k(worst));

      const exposed = live.filter((i) => ENG[i].hit).length;
      let story;
      if (live.length === 1) story = "One engine on its own: every bad patch shows up in full. Switch on the others and watch the firm's line get smoother, even though each engine is just as bumpy as before.";
      else if (!crisis) story = "In a calm year the engines move independently, so their bad days mostly land on different days. The firm's daily swing (" + k(fSd) + ") is far smaller than the engines' swings added up (" + k(sumSd) + "), and its Sharpe ratio (" + fS.toFixed(1) + ") is " + (fS > avgS ? "well above" : "close to") + " the average engine's (" + avgS.toFixed(1) + "). That's the quadrature at work: profits add up in full, risks don't. Now add a crisis.";
      else if (exposed >= 2) story = "On the crisis days, " + exposed + " engines that were independent all year lose together: spreads blow out, \"identical\" prices drift apart and everyone holding risk sells at once. The firm's worst day (" + k(worst) + ") is roughly " + Math.round(-worst / Math.max(fSd, 1)) + " times its normal daily swing. Diversification measured in calm markets disappeared exactly when it was needed.";
      else story = "With only " + (exposed ? "one engine" : "no engine") + " exposed to the crisis, the firm rides it out much better. Statistical edges and market making often hold up in stress; arbitrage and risk premia are the engines that crack together.";
      $("bf-story").textContent = story;
    };
    onResize("chart-bf", draw);
    H.charts(draw);
  }
})();