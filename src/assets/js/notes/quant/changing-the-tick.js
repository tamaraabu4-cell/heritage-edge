// Interactives for the note "Changing the Tick" (Quant · Microstructure).
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
  const buttons = (boxId, items, start, onPick) => {
    const box = $(boxId);
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = it;
      b.setAttribute("aria-pressed", i === start ? "true" : "false");
      b.addEventListener("click", () => { [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); onPick(i); });
      box.append(b);
    });
    return (i) => [...box.children].forEach((c, j) => c.setAttribute("aria-pressed", j === i ? "true" : "false"));
  };
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const rng = (s) => () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const num = (v) => Math.round(v).toLocaleString("en-GB");
  const cents = (v) => (v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(2)) + "¢";
  const tickName = (d) => (Math.abs(d - 0.25) < 0.01 ? "¼¢" : Math.abs(d - 0.5) < 0.01 ? "½¢" : (d < 1 ? d.toFixed(2) : d < 10 ? +d.toFixed(2) : Math.round(d)) + "¢");

  // ---------- Widen or shrink the tick ----------
  if ($("chart-wt")) {
    const STOCKS = [
      { name: "Tight stock (2¢)", f: 2, rho: 2000, sigma: 3 },
      { name: "Medium (10¢)", f: 10, rho: 300, sigma: 6 },
      { name: "Wide (20¢)", f: 20, rho: 100, sigma: 8 },
    ];
    const QUICK = [0.5, 1, 5];
    const r = rng(7), Z = Array.from({ length: 400 }, () => normal(r));
    let stock = STOCKS[0];
    const tIn = $("wt-t");
    buttons("wt-stock", STOCKS.map((s) => s.name), 0, (i) => { stock = STOCKS[i]; draw(); });
    const setQuick = buttons("wt-tick", ["Half a cent", "1 cent", "5 cents"], 1, (i) => { tIn.value = Math.log10(QUICK[i]); draw(); });
    // Average spread and floor over a day of snapshots
    const avg = (f, d) => {
      let s = 0, need = 0;
      Z.forEach((z) => { const fi = f * Math.exp(0.35 * z - 0.06); s += d * Math.max(1, Math.ceil(fi / d - 1e-9)); need += fi; });
      return { s: s / Z.length, need: need / Z.length };
    };

    const draw = () => {
      const d = 10 ** +tIn.value;
      $("wt-t-out").textContent = tickName(d);
      setQuick(QUICK.findIndex((q) => Math.abs(q - d) < 0.005));
      const here = avg(stock.f, d);

      const svg = $("chart-wt");
      const hh = 260, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: 46, r: 14, t: 18, b: 44 };
      const iw = w - pad.l - pad.r, ih = hh - pad.t - pad.b;
      const lx = (x) => Math.log10(x), x0 = lx(0.25), x1 = lx(10);
      const sx = (x) => pad.l + ((lx(x) - x0) / (x1 - x0)) * iw;
      const pts = Array.from({ length: 121 }, (_, i) => 10 ** (x0 + (i / 120) * (x1 - x0)));
      const curve = pts.map((x) => avg(stock.f, x));
      const yMax = Math.max(...curve.map((c) => c.s / 2)) * 1.12;
      const raw = yMax / 4, mag = 10 ** Math.floor(Math.log10(raw));
      const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
      const top = Math.ceil(yMax / step) * step;
      const sy = (v) => pad.t + ih - (v / top) * ih;
      for (let v = 0; v <= top + 1e-9; v += step) {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(v), y2: sy(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = +v.toFixed(2) + "¢";
      }
      [0.25, 0.5, 1, 2, 5, 10].forEach((x) => {
        el("line", { x1: sx(x), x2: sx(x), y1: pad.t, y2: pad.t + ih, class: "grid" }, svg);
        el("text", { x: sx(x), y: pad.t + ih + 18, "text-anchor": "middle" }, svg).textContent = tickName(x);
      });
      el("text", { x: pad.l + iw / 2, y: hh - 6, "text-anchor": "middle" }, svg).textContent = "Tick size (log scale)";
      // Spare profit: the gap between what's paid and what's needed
      let area = "M" + sx(pts[0]) + " " + sy(curve[0].need / 2);
      pts.forEach((x, i) => { area += "L" + sx(x).toFixed(1) + " " + sy(curve[i].s / 2).toFixed(1); });
      for (let i = pts.length - 1; i >= 0; i--) area += "L" + sx(pts[i]).toFixed(1) + " " + sy(curve[i].need / 2).toFixed(1);
      el("path", { d: area + "Z", fill: tone(), "fill-opacity": 0.12 }, svg);
      el("line", { x1: pad.l, x2: w - pad.r, y1: sy(here.need / 2), y2: sy(here.need / 2), stroke: grey(), "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
      let path = "";
      pts.forEach((x, i) => { path += (i ? "L" : "M") + sx(x).toFixed(1) + " " + sy(curve[i].s / 2).toFixed(1); });
      el("path", { d: path, fill: "none", stroke: tone(), "stroke-width": 3, "stroke-linejoin": "round" }, svg);
      // Where the tick equals the floor
      const fx = sx(Math.min(10, Math.max(0.25, stock.f)));
      if (stock.f <= 10) {
        el("text", { x: fx + (fx > pad.l + iw * 0.75 ? -5 : 5), y: pad.t + 12, "text-anchor": fx > pad.l + iw * 0.75 ? "end" : "start", style: "fill:var(--text-2)" }, svg).textContent = narrow ? "tick = need" : "tick = what makers need";
        el("line", { x1: fx, x2: fx, y1: pad.t, y2: pad.t + ih, stroke: grey(), "stroke-dasharray": "2 3" }, svg);
      }
      el("line", { x1: sx(d), x2: sx(d), y1: pad.t, y2: pad.t + ih, stroke: "var(--text)", "stroke-width": 1 }, svg);
      el("circle", { cx: sx(d), cy: sy(here.s / 2), r: 6, fill: tone(), stroke: "var(--bg)", "stroke-width": 2 }, svg);

      const depth = stock.rho * d, changes = (stock.sigma / d) ** 2;
      const box = $("wt-read"); box.textContent = "";
      span(box, "Average spread: " + cents(here.s));
      span(box, "Small order pays: " + cents(here.s / 2) + " a share");
      span(box, "Spare for the queue: " + cents(Math.max(0, (here.s - here.need) / 2)) + " a share");
      span(box, "Depth at the best price: ~" + num(depth) + " shares");
      span(box, "Quote changes: ~" + (changes >= 10 ? num(changes) : changes.toFixed(1)) + " a minute");

      let story;
      const ratio = d / stock.f;
      if (ratio > 1.05) story = "The tick binds. Makers would quote " + cents(stock.f) + " but can't go below one tick, so small orders pay " + cents(here.s / 2) + " a share and the shaded gap goes to whoever is at the front of the queue. This is what happened to the tight stocks in the US Tick Size Pilot. In return you get thick queues and calm quotes.";
      else if (ratio < 0.12) story = "The tick is tiny compared with the spread. Spreads sit close to what makers need, but each price level holds only about " + num(depth) + " shares and quotes change about " + (changes >= 10 ? num(changes) : changes.toFixed(1)) + " times a minute. That's pennying territory: EBS saw this with tenths of a pip in 2011–12.";
      else story = "The tick is close to the spread makers need: the cost to small orders is near the floor, queues are a sensible size and quotes don't flicker too much. This is roughly what MiFID II's liquidity bands and the US half-penny rule aim for.";
      if (stock.f >= 20 && d >= 5) story += " (In the real Pilot, wide stocks like this saw spreads narrow a little, which this simple model doesn't capture.)";
      $("wt-story").textContent = story;
    };

    tIn.addEventListener("input", draw);
    onResize("chart-wt", draw);
    H.charts(draw);
  }

  // ---------- Through the figure ----------
  if ($("chart-rn")) {
    const LO = 75, HI = 125, START = 84, STEPS = 60, MM_ASK = 3, MM_BID = 5;
    // Pips above 1.1500 → resting take-profit sells and stop-loss buys
    const TP = {}, SB = {};
    for (let p = LO; p <= HI; p++) TP[p] = 2;
    Object.assign(TP, { 90: 8, 95: 4, 98: 6, 99: 14, 100: 40, 110: 12, 120: 12 });
    Object.assign(SB, { 101: 22, 102: 16, 103: 10, 104: 6, 105: 5, 111: 7, 112: 5, 121: 6 });
    const bIn = $("rn-b"), sIn = $("rn-s");
    let seed = 3, anim = 0, shown = STEPS, run = null;
    const price = (p) => (1.15 + p / 10000).toFixed(4);

    const simulate = () => {
      const r = rng(seed), b0 = +bIn.value, m = +sIn.value;
      const ask = {}, stops = {};
      for (let p = LO; p <= HI + 1; p++) { ask[p] = MM_ASK + (TP[p] || 0); stops[p] = (SB[p] || 0) * m; }
      let p = START;
      const path = [p], fired = {};
      for (let t = 0; t < STEPS; t++) {
        let b = b0 + 2.2 * normal(r);
        if (b >= 0) {
          while (b > 0 && p <= HI) {
            const take = Math.min(b, ask[p]);
            ask[p] -= take; b -= take;
            if (ask[p] <= 1e-9) {
              p += 1;
              if (stops[p] > 0) { b += stops[p]; fired[p] = stops[p]; stops[p] = 0; }
            }
          }
          p = Math.min(p, HI);
        } else {
          const down = Math.floor(-b / MM_BID);
          for (let k = 0; k < down && p > LO; k++) { p -= 1; ask[p + 1] = Math.max(ask[p + 1], MM_ASK); }
        }
        path.push(p);
      }
      // Summary
      const breakT = path.findIndex((q) => q >= 101);
      let jump = 0, jumpT = 0;
      for (let t = 1; t < path.length; t++) if (path[t] - path[t - 1] > jump) { jump = path[t] - path[t - 1]; jumpT = t; }
      const stall = (breakT < 0 ? path : path.slice(0, breakT)).filter((q) => q >= 97 && q <= 100).length;
      return { path, ask, fired, breakT, jump, jumpT, stall, m };
    };

    const draw = () => {
      $("rn-b-out").textContent = (+bIn.value).toFixed(1);
      $("rn-s-out").textContent = "×" + +(+sIn.value).toFixed(2);
      if (!run) run = simulate();
      const { path, ask, fired, m } = run;

      const svg = $("chart-rn");
      const hh = 320, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: narrow ? 50 : 56, r: 12, t: 14, b: 40 };
      const ih = hh - pad.t - pad.b;
      const sy = (p) => pad.t + ((HI + 0.5 - p) / (HI - LO + 1)) * ih;
      const bh = Math.max(2, ih / (HI - LO + 1) - 1);
      const bookW = Math.round((w - pad.l - pad.r) * (narrow ? 0.36 : 0.3));
      const gx = pad.l + bookW + 14, gw = w - pad.r - gx;
      // Price gridlines every 5 pips
      for (let p = LO; p <= HI; p += 5) {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(p), y2: sy(p), class: p === 100 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 6, y: sy(p) + 4, "text-anchor": "end", style: p === 100 ? "font-weight:600;fill:var(--text)" : "" }, svg).textContent = price(p);
      }
      // The book: take-profit sells (grey) and stop-loss buys (tone)
      const maxQ = 45, bx = (q) => (Math.min(q, maxQ) / maxQ) * bookW;
      for (let p = LO; p <= HI; p++) {
        const tp = TP[p] || 0, sb = (SB[p] || 0) * m;
        if (tp > 2) {
          el("rect", { x: pad.l + 2, y: sy(p) - bh / 2, width: bx(tp), height: bh, fill: grey(), "fill-opacity": 0.3 }, svg);
          const left = Math.max(0, Math.min(tp, ask[p] - MM_ASK));
          if (left > 0) el("rect", { x: pad.l + 2, y: sy(p) - bh / 2, width: bx(left), height: bh, fill: grey() }, svg);
        }
        if (sb > 0) {
          el("rect", { x: pad.l + 2, y: sy(p) - bh / 2, width: bx(sb), height: bh, fill: tone(), "fill-opacity": fired[p] ? 0.25 : 1 }, svg);
        }
      }
      el("text", { x: pad.l + 2, y: hh - 6 }, svg).textContent = "Resting orders";
      // The price path
      const tx = (t) => gx + (t / STEPS) * gw;
      el("line", { x1: gx - 7, x2: gx - 7, y1: pad.t, y2: pad.t + ih, class: "axis" }, svg);
      [0, 20, 40, 60].forEach((t) => el("text", { x: tx(t), y: hh - pad.b + 18, "text-anchor": "middle" }, svg).textContent = t);
      el("text", { x: gx + gw / 2, y: hh - 6, "text-anchor": "middle" }, svg).textContent = "Minutes";
      let d = "";
      for (let t = 0; t <= Math.min(shown, STEPS); t++) d += (t ? "L" : "M") + tx(t).toFixed(1) + " " + sy(path[t]).toFixed(1);
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
      const last = Math.min(shown, STEPS);
      el("circle", { cx: tx(last), cy: sy(path[last]), r: 5, fill: tone(), stroke: "var(--bg)", "stroke-width": 2 }, svg);
      if (shown >= STEPS && run.jump >= 4) {
        const t = run.jumpT, yA = sy(path[t - 1]), yB = sy(path[t]);
        const flip = tx(t) > gx + gw * 0.7;
        el("text", { x: tx(t) + (flip ? -8 : 8), y: (yA + yB) / 2 + 4, "text-anchor": flip ? "end" : "start", style: "fill:var(--tone);font-weight:600" }, svg).textContent = "+" + run.jump + " pips";
      }

      const box = $("rn-read"); box.textContent = "";
      if (shown < STEPS) { span(box, "Minute " + shown + ": " + price(path[shown])); $("rn-story").textContent = ""; return; }
      span(box, run.breakT < 0 ? "Never got through 1.1600" : "Through the figure at minute " + run.breakT);
      span(box, "Minutes spent at 1.1597–1.1600 first: " + run.stall);
      span(box, "Biggest one-minute move up: " + run.jump + " pips");
      span(box, "Finished at " + price(path[STEPS]));
      let story;
      if (run.breakT < 0) story = "The take-profit sellers at the figure absorbed all the buying: the price kept testing 1.1600 and falling back. This is what traders call resistance, and here it's simply a queue of sell orders that never got used up.";
      else if (m === 0) story = "With no stops above the figure, the price paused while the take-profits were used up and then simply carried on at its normal pace. Round numbers on their own create pauses; it's the stops that create the jumps.";
      else if (run.jump >= 8) story = "Classic Osler: the take-profits at 1.1600 held the price for a while, then once they were used up the stop-loss buys just above fired as market orders. Each one pushed the price into the next, a " + run.jump + "-pip cascade in a single minute, until the take-profits at 1.1610 slowed it down.";
      else story = "The figure slowed the price, and the stops above added a push once it broke, but there weren't enough of them to cascade far. Try more stops or more buying pressure.";
      $("rn-story").textContent = story;
    };

    const play = () => {
      cancelAnimationFrame(anim); run = simulate(); shown = 0;
      const t0 = performance.now();
      const tick = (now) => {
        shown = Math.min(STEPS, Math.floor((now - t0) / 45));
        draw();
        if (shown < STEPS) anim = requestAnimationFrame(tick);
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { shown = STEPS; draw(); }
      else anim = requestAnimationFrame(tick);
    };
    $("rn-go").addEventListener("click", play);
    $("rn-again").addEventListener("click", () => { seed += 1; play(); });
    [bIn, sIn].forEach((x) => x.addEventListener("input", () => { cancelAnimationFrame(anim); shown = STEPS; run = simulate(); draw(); }));
    onResize("chart-rn", draw);
    H.charts(draw);
  }
})();