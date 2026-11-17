// Interactives for the note "Quote Skewing" (Quant · Market Making).
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
  const num = (v) => Math.round(v).toLocaleString("en-GB");
  const signedNum = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + num(Math.abs(v));
  const usd = (v) => (v < -0.5 ? "−$" : "$") + num(Math.abs(v));

  // ---------- Lean the quote ----------
  if ($("chart-lq")) {
    const FAIR = 100, HALF = 0.04;
    const iIn = $("lq-i"), kIn = $("lq-k");
    const draw = () => {
      const I = +iIn.value, k = +kIn.value / 1e6;
      $("lq-i-out").textContent = signedNum(I);
      $("lq-k-out").textContent = k.toFixed(6);
      const res = FAIR - k * I, bid = res - HALF, offer = res + HALF;

      const svg = $("chart-lq");
      const h = 190, w = fit(svg, h), narrow = w < 480;
      const pad = { l: 24, r: 24 };
      const lo = 99.8, hi = 100.2, axisY = 92;
      const sx = (v) => pad.l + ((v - lo) / (hi - lo)) * (w - pad.l - pad.r);
      el("line", { x1: sx(lo), x2: sx(hi), y1: axisY, y2: axisY, class: "axis" }, svg);
      const step = narrow ? 0.1 : 0.05;
      for (let v = lo; v <= hi + 1e-9; v += step) {
        el("line", { x1: sx(v), x2: sx(v), y1: axisY - 4, y2: axisY + 4, class: "axis" }, svg);
        el("text", { x: sx(v), y: axisY + 62, "text-anchor": "middle" }, svg).textContent = v.toFixed(2);
      }
      // Band between the skewed quotes
      el("rect", { x: sx(bid), y: axisY - 26, width: sx(offer) - sx(bid), height: 52, fill: tone(), "fill-opacity": "0.12", rx: 4 }, svg);
      // Normal quotes (grey, below the line)
      [[FAIR - HALF, "bid"], [FAIR + HALF, "offer"]].forEach(([v, lab]) => {
        el("line", { x1: sx(v), x2: sx(v), y1: axisY, y2: axisY + 22, stroke: grey(), "stroke-width": 2 }, svg);
        el("text", { x: sx(v), y: axisY + 38, "text-anchor": lab === "bid" ? "end" : "start" }, svg).textContent = narrow ? lab : "normal " + lab;
      });
      // Fair value
      el("line", { x1: sx(FAIR), x2: sx(FAIR), y1: axisY - 56, y2: axisY + 12, stroke: grey(), "stroke-width": 1.2, "stroke-dasharray": "4 3" }, svg);
      el("text", { x: sx(FAIR), y: axisY - 62, "text-anchor": "middle" }, svg).textContent = "fair 100.00";
      // Skewed quotes (tone, above the line)
      [[bid, "bid " + bid.toFixed(2)], [offer, "offer " + offer.toFixed(2)]].forEach(([v, lab], i) => {
        el("line", { x1: sx(v), x2: sx(v), y1: axisY - 26, y2: axisY, stroke: tone(), "stroke-width": 3 }, svg);
        el("text", { x: sx(v), y: axisY - 32, "text-anchor": i === 0 ? "end" : "start", style: "fill:var(--text)" }, svg).textContent = lab;
      });
      el("circle", { cx: sx(res), cy: axisY, r: 5, fill: tone() }, svg);

      const box = $("lq-read"); box.textContent = "";
      span(box, "Lean: " + (k * I >= 0 ? "−" : "+") + Math.abs(k * I).toFixed(3) + ", so the indifference price is " + res.toFixed(3));
      span(box, "Quotes: " + bid.toFixed(2) + " / " + offer.toFixed(2) + " (normal 99.96 / 100.04)");
      const lean = k * I;
      let story;
      if (Math.abs(lean) < 0.0005) story = "Flat (or not leaning): the maker quotes symmetrically around fair value and is equally happy to buy or sell.";
      else if (lean > 0) story = "Long, so both quotes move down. The offer is now " + (lean * 100).toFixed(1) + " cents closer to fair value (more buyers, who reduce the long) and the bid " + (lean * 100).toFixed(1) + " cents further away (fewer sellers, who would add to it)." + (offer < FAIR ? " The offer is now below fair value: the maker is paying to get out, close to crossing the spread." : "");
      else story = "Short, so both quotes move up: a keener bid to attract sellers, who cover the short, and a less attractive offer to put off buyers." + (bid > FAIR ? " The bid is now above fair value: the maker is paying to get out." : "");
      $("lq-story").textContent = story;
    };
    [iIn, kIn].forEach((x) => x.addEventListener("input", draw));
    H.charts(draw);
    onResize("chart-lq", draw);
  }

  // ---------- Steer the book ----------
  if ($("chart-sb")) {
    const STEPS = 1500, HOURS = 6.5, HALF = 1, KAPPA = 0.8, A = 0.25, SIG = 0.15, TICK = 12.5;
    let trend = false, seed = 21;
    const kIn = $("sb-k");

    const run = (k, draws) => {
      let V = 0, F = 0, I = 0, cash = 0, edge = 0, peak = 0;
      const path = [0];
      for (let t = 0; t < STEPS; t++) {
        const d = draws[t];
        V += SIG * d.e + (trend ? -0.02 : 0);
        F = trend ? F + 0.02 * (V - F) : V;              // on the trending day the maker's fair value lags
        const centre = F - k * I, bid = centre - HALF, offer = centre + HALF;
        const pBuy = Math.min(0.9, A * Math.exp(-KAPPA * (offer - V)));   // customers buy at the offer
        const pSell = Math.min(0.9, A * Math.exp(-KAPPA * (V - bid)));    // customers sell at the bid
        if (d.b < pBuy) { I -= 1; cash += offer; edge += offer - V; }
        if (d.s < pSell) { I += 1; cash -= bid; edge += V - bid; }
        peak = Math.max(peak, Math.abs(I));
        path.push(I);
      }
      const total = cash + I * V;
      return { path, peak, end: I, edge, total, inv: total - edge };
    };

    const draw = () => {
      const k = +kIn.value;
      $("sb-k-out").textContent = k.toFixed(2);
      const r = rng(seed * 6007 + (trend ? 17 : 0));
      const draws = [];
      for (let t = 0; t < STEPS; t++) draws.push({ e: normal(r), b: r(), s: r() });
      const skew = run(k, draws), flat = run(0, draws);

      const svg = $("chart-sb");
      const h = 280, w = fit(svg, h);
      const pad = { l: 46, r: 14, t: 16, b: 40 };
      const big = Math.max(...skew.path.map(Math.abs), ...flat.path.map(Math.abs), 4);
      const M = [5, 10, 20, 30, 40, 60, 80, 100, 150, 200].find((m) => m >= big * 1.1) || 200;
      const fmt = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v);
      const s = H.frame(svg, w, h, pad, [0, STEPS], [-M, M], [], [-M, -M / 2, 0, M / 2, M], fmt);
      [0, 1, 2, 3, 4, 5, 6].forEach((hr) => {
        const x = s.sx((hr / HOURS) * STEPS);
        el("line", { x1: x, x2: x, y1: pad.t, y2: h - pad.b, class: "grid" }, svg);
        el("text", { x, y: h - pad.b + 18, "text-anchor": "middle" }, svg).textContent = hr;
      });
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 6, "text-anchor": "middle" }, svg).textContent = "Hours into the day (inventory in lots)";
      const line = (arr, stroke, width) => {
        let d = "";
        arr.forEach((v, i) => { d += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(v).toFixed(1); });
        el("path", { d, fill: "none", stroke, "stroke-width": width, "stroke-linejoin": "round" }, svg);
      };
      line(flat.path, grey(), 1.6);
      line(skew.path, tone(), 2.2);

      const box = $("sb-read"); box.textContent = "";
      const row = (name, x) => span(box, name + ": peak " + x.peak + " lots, ends " + signedNum(x.end) + "; spread " + usd(x.edge * TICK) + ", inventory " + usd(x.inv * TICK) + ", total " + usd(x.total * TICK));
      row("Skews", skew);
      row("Doesn't skew", flat);

      let story;
      if (!trend) {
        if (k === 0) story = "With no skew the two makers are identical: the inventory wanders wherever the flow takes it.";
        else if (k >= 0.22) story = "Skewing this hard pins inventory near zero, but look at the spread captured: the maker is giving away more edge on every fill. There's a sweet spot between wandering inventory and too much edge given up.";
        else story = "On a calm day, skewing keeps the inventory much closer to zero for a small cost in spread captured, and the inventory P&L swings much less. That's the deal skewing offers.";
      } else {
        story = "The price is falling and the maker's fair value lags behind it, so sellers keep hitting bids that are still too high. The maker that doesn't skew ends up hugely long (a real desk would hit its limit long before). Skewing helps a lot, because leaning down drags its quotes towards where the price really is. But it still loses on inventory (" + usd(skew.inv * TICK) + "): at each step down it sells some of the long, then gets sold to again lower. On a calm day that inventory loss is close to zero. Skew treats the symptom; the cure is moving fair value, widening and quoting smaller.";
      }
      $("sb-story").textContent = story;
    };

    choice("sb-day", ["Calm day", "Trending down"], 0, (i) => { trend = i === 1; draw(); });
    kIn.addEventListener("input", draw);
    $("sb-again").addEventListener("click", () => { seed += 1; draw(); });
    H.charts(draw);
    onResize("chart-sb", draw);
  }
})();