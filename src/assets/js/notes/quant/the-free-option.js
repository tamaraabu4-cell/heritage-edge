// Interactives for the note "The Free Option" (Quant · Market Making).
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
  const signed = (v, dp) => (v < 0 ? "−" : "+") + Math.abs(v).toFixed(dp);

  // ---------- Learning from the flow (Glosten–Milgrom) ----------
  if ($("chart-gm")) {
    const VH = 102, VL = 98, N = 80;
    let high = true, seed = 11;
    const muIn = $("gm-mu");

    const simulate = (mu, r) => {
      const bH = mu + (1 - mu) / 2, bL = (1 - mu) / 2; // chance of a buy if high / low
      const sH = bL, sL = bH;                          // chance of a sell if high / low
      const V = high ? VH : VL;
      let p = 0.5, fromUninformed = 0, toInformed = 0;
      const bid = [], ask = [];
      for (let i = 0; i <= N; i++) {
        const a = (p * bH * VH + (1 - p) * bL * VL) / (p * bH + (1 - p) * bL);
        const b = (p * sH * VH + (1 - p) * sL * VL) / (p * sH + (1 - p) * sL);
        ask.push(a); bid.push(b);
        if (i === N) break;
        const informed = r() < mu;
        const buy = informed ? high : r() < 0.5;
        const pnl = buy ? a - V : V - b; // the maker's profit on this trade
        if (informed) toInformed += pnl; else fromUninformed += pnl;
        p = buy ? (p * bH) / (p * bH + (1 - p) * bL) : (p * sH) / (p * sH + (1 - p) * sL);
      }
      return { bid, ask, fromUninformed, toInformed };
    };

    const draw = () => {
      const mu = +muIn.value / 100;
      $("gm-mu-out").textContent = muIn.value + "%";
      const sim = simulate(mu, rng(seed * 7907 + Math.round(mu * 100)));
      const svg = $("chart-gm");
      const h = 280, w = fit(svg, h);
      const pad = { l: 46, r: 14, t: 16, b: 40 };
      const s = H.frame(svg, w, h, pad, [0, N], [97.5, 102.5], [0, 20, 40, 60, 80], [98, 99, 100, 101, 102]);
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 6, "text-anchor": "middle" }, svg).textContent = "Number of trades so far";
      const V = high ? VH : VL;
      el("line", { x1: s.sx(0), x2: s.sx(N), y1: s.sy(V), y2: s.sy(V), stroke: grey(), "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
      let top = "", bot = "";
      sim.ask.forEach((a, i) => { top += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(a).toFixed(1); });
      for (let i = N; i >= 0; i--) bot += "L" + s.sx(i).toFixed(1) + " " + s.sy(sim.bid[i]).toFixed(1);
      el("path", { d: top + bot + "Z", fill: tone(), "fill-opacity": "0.2", stroke: "none" }, svg);
      const line = (arr) => { let d = ""; arr.forEach((v, i) => { d += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(v).toFixed(1); }); el("path", { d, fill: "none", stroke: tone(), "stroke-width": 1.8 }, svg); };
      line(sim.ask); line(sim.bid);

      const spread = (i) => sim.ask[i] - sim.bid[i];
      let tight = -1;
      for (let i = 0; i <= N; i++) if (spread(i) < 0.2) { tight = i; break; }
      const box = $("gm-read"); box.textContent = "";
      span(box, "Opening spread: " + spread(0).toFixed(2));
      span(box, "After " + N + " trades: " + spread(N).toFixed(2) + ", mid " + ((sim.ask[N] + sim.bid[N]) / 2).toFixed(2));
      span(box, tight >= 0 ? "Spread under 0.20 after " + tight + " trades" : "Spread still above 0.20 after " + N + " trades");
      span(box, "Maker's P&L: " + signed(sim.fromUninformed, 2) + " from uninformed, " + signed(sim.toInformed, 2) + " to informed");

      let story;
      if (mu <= 0.1) story = "With few informed traders, the opening spread is tight, but each trade carries little information, so the market maker learns slowly and the price takes a long time to find the truth.";
      else if (mu >= 0.45) story = "With many informed traders, the opening spread is wide to protect the maker, but the flow is so informative that the price races to the true value within a few trades.";
      else story = "The spread starts at " + spread(0).toFixed(1) + " and closes in as each trade nudges the maker's belief. The P&L split shows the deal: the maker loses to the informed and wins it back, roughly, from the uninformed. Over many runs it breaks even.";
      $("gm-story").textContent = story;
    };

    choice("gm-v", ["True value 102", "True value 98"], 0, (i) => { high = i === 0; draw(); });
    muIn.addEventListener("input", draw);
    $("gm-again").addEventListener("click", () => { seed += 1; draw(); });
    H.charts(draw);
    onResize("chart-gm", draw);
  }

  // ---------- Markouts ----------
  if ($("chart-mk")) {
    // m(t) = mInf * (1 - exp(-t / tau)), in ticks; t in seconds
    const SEG = [
      { name: "Retail app orders", short: "Retail", mInf: 0.3, tau: 60, fast: false },
      { name: "Institutional algo", short: "Algo", mInf: 1.3, tau: 90, fast: false },
      { name: "Fast trading firm", short: "Fast firm", mInf: 3.4, tau: 1.5, fast: true },
    ];
    let quick = false;
    const hIn = $("mk-h");
    const m = (sg, t) => sg.mInf * (sg.fast && quick ? 0.35 : 1) * (1 - Math.exp(-t / sg.tau));
    const TICKS = [[0.1, "0.1s"], [1, "1s"], [10, "10s"], [60, "1m"], [300, "5m"]];

    const draw = () => {
      const half = +hIn.value;
      $("mk-h-out").textContent = half + " ticks";
      const svg = $("chart-mk");
      const h = 280, w = fit(svg, h), narrow = w < 480;
      const pad = { l: 40, r: narrow ? 64 : 120, t: 14, b: 40 };
      // x is log10(seconds) + 1, so the left edge (0.1s) sits at 0
      const LX = Math.log10(300) + 1;
      const s = H.frame(svg, w, h, pad, [0, LX], [0, 5], [], [0, 1, 2, 3, 4, 5]);
      TICKS.forEach(([t, lab]) => {
        const x = s.sx(Math.log10(t) + 1);
        el("line", { x1: x, x2: x, y1: pad.t, y2: h - pad.b, class: "grid" }, svg);
        el("text", { x, y: h - pad.b + 18, "text-anchor": "middle" }, svg).textContent = lab;
      });
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 6, "text-anchor": "middle" }, svg).textContent = "Time after the fill (log scale)";
      el("line", { x1: pad.l, x2: w - pad.r, y1: s.sy(half), y2: s.sy(half), stroke: tone(), "stroke-width": 1.4, "stroke-dasharray": "6 4" }, svg);
      el("text", { x: pad.l + 6, y: s.sy(half) - 6, style: "fill:" + tone() }, svg).textContent = "your half-spread";
      const labels = [];
      SEG.forEach((sg) => {
        let d = "";
        for (let i = 0; i <= 160; i++) {
          const lx = (i / 160) * LX, t = 10 ** (lx - 1);
          d += (i ? "L" : "M") + s.sx(lx).toFixed(1) + " " + s.sy(Math.min(5, m(sg, t))).toFixed(1);
        }
        el("path", { d, fill: "none", stroke: sg.fast ? tone() : grey(), "stroke-width": sg.fast ? 2.4 : 1.8 }, svg);
        labels.push({ y: s.sy(m(sg, 300)) + 4, sg });
      });
      // Keep the end labels at least 14px apart
      labels.sort((a, b) => a.y - b.y);
      for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
      labels.forEach(({ y, sg }) => {
        el("text", { x: w - pad.r + 6, y, style: "fill:" + (sg.fast ? tone() : "var(--text-2)") }, svg).textContent = narrow ? sg.short : sg.name;
      });

      const box = $("mk-read"); box.textContent = "";
      const losers = [];
      SEG.forEach((sg) => {
        const rs = half - m(sg, 300);
        if (rs < 0) losers.push(sg.short.toLowerCase());
        span(box, sg.name + ": realised " + signed(rs, 2) + " ticks a fill");
      });
      let story;
      if (!losers.length) story = "Every segment leaves the maker with a positive realised spread at this width. If the half-spread is much wider than the retail markout, a competitor could undercut on retail flow and win it.";
      else if (losers.length === 1 && losers[0] === "fast firm") story = quick
        ? "Faster requoting shrinks the window in which the fast firm can trade against stale quotes, but at this half-spread it's still picking the maker off. Widen for that segment, or stop showing it the same price."
        : "The fast firm's markout jumps within a second or two: it's trading on information the maker's quotes haven't caught up with yet. Retail and the algo are fine. Try faster requoting, the defensive case for speed.";
      else story = "At this half-spread, more than one segment is picking the maker off. Widen, or price each segment separately (client tiering).";
      $("mk-story").textContent = story;
    };

    choice("mk-speed", ["Slow requoting", "Fast requoting"], 0, (i) => { quick = i === 1; draw(); });
    hIn.addEventListener("input", draw);
    H.charts(draw);
    onResize("chart-mk", draw);
  }
})();