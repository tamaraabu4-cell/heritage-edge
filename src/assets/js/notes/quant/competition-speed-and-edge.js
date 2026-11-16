// Interactives for the note "Competition, Speed and Edge" (Quant · Quant Trading Firms).
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
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const niceStep = (span, parts) => {
    const raw = span / parts, mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
  };
  const m = (v) => (Math.abs(v) < 0.095 && Math.abs(v) >= 0.0005 ? (v < 0 ? "−$" : "$") + Math.round(Math.abs(v) * 1000) + "k" : (v < -0.05 ? "−$" : "$") + Math.abs(v).toFixed(1) + "m");

  // ---------- Edges wear out ----------
  if ($("chart-ew")) {
    const YEARS = 15;
    const draw = () => {
      const R = parseFloat($("ew-r").value), d = parseFloat($("ew-d").value) / 100, n = parseFloat($("ew-n").value);
      $("ew-r-out").textContent = "$" + R.toFixed(1) + "m"; $("ew-d-out").textContent = Math.round(d * 100) + "%";
      $("ew-n-out").textContent = n % 1 ? n.toFixed(1) : n;
      const q = 1 - d;
      // vintage v (year found) earns: one signal found in year 1, then n new signals every later year
      const count = (v) => (v === 1 ? 1 : n);
      const rows = [];
      for (let t = 1; t <= YEARS; t++) {
        const parts = [];
        for (let v = 1; v <= t; v++) parts.push(count(v) * R * q ** (t - v));
        rows.push(parts);
      }
      const totals = rows.map((p) => p.reduce((a, b) => a + b, 0));
      const steady = d > 0 ? (n * R) / d : 0;

      const svg = $("chart-ew"), w = fit(svg, 280), h = 280;
      const pad = { l: 46, r: 12, t: 18, b: 36 };
      const top = Math.max(...totals, steady, R) * 1.1;
      const step = niceStep(top, 5), y1 = Math.ceil(top / step) * step;
      const yt = []; for (let y = 0; y <= y1 + step / 2; y += step) yt.push(+y.toFixed(2));
      const sc = H.frame(svg, w, h, pad, [0.5, YEARS + 0.5], [0, y1], [], yt, (v) => "$" + v + "m");
      const slot = sc.sx(1.5) - sc.sx(0.5), bw = slot * 0.72;
      rows.forEach((parts, i) => {
        const t = i + 1, x = sc.sx(t) - bw / 2;
        let base = 0;
        parts.forEach((v, j) => {
          if (v <= 0) return;
          el("rect", { x, y: sc.sy(base + v), width: bw, height: Math.max(0.5, sc.sy(base) - sc.sy(base + v)), fill: tone(), "fill-opacity": j % 2 ? 0.45 : 0.9 }, svg);
          base += v;
        });
        if (w > 420 || t % 2 === 1) el("text", { x: sc.sx(t), y: h - pad.b + 16, "text-anchor": "middle" }, svg).textContent = t;
      });
      el("text", { x: w - pad.r, y: h - 4, "text-anchor": "end" }, svg).textContent = "Year";
      el("text", { x: 4, y: 11 }, svg).textContent = "Revenue a year";
      if (steady > 0) {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sc.sy(steady), y2: sc.sy(steady), stroke: grey(), "stroke-width": 1.6, "stroke-dasharray": "6 4" }, svg);
        el("text", { x: pad.l + 6, y: sc.sy(steady) - 6, style: "fill:var(--text);font-weight:600" }, svg).textContent = "long run " + m(steady);
      }

      const half = Math.log(2) / -Math.log(q);
      const out = $("ew-read"); out.textContent = "";
      span(out, "One signal's lifetime value: " + m(R / d));
      span(out, "Half-life: " + half.toFixed(1) + " years");
      span(out, "Year " + YEARS + " revenue: " + m(totals[YEARS - 1]));
      span(out, "Long-run level: " + m(steady));

      let story;
      if (n === 0) story = "No new research: the first signal's " + m(R) + " shrinks every year, down to " + m(totals[YEARS - 1]) + " by year " + YEARS + ". A trading firm that stops researching is a business slowly winding down.";
      else if (Math.abs(n - 1) < 1e-9 && Math.abs(d - 0.3) < 1e-9 && Math.abs(R - 4) < 1e-9) story = "Deltashark's example: one new $4m signal a year, each decaying 30%. Revenue climbs towards " + m(steady) + " a year and settles there. Research is replacing exactly what competition wears away, which is what it's for.";
      else if (d >= 0.5) story = "With edges decaying " + Math.round(d * 100) + "% a year, each signal has a half-life of only " + half.toFixed(1) + " years. Revenue settles at " + m(steady) + ", and every year's figure depends heavily on that year's research. Fast-decaying edges need a fast pipeline.";
      else if (d <= 0.15) story = "Slow decay (" + Math.round(d * 100) + "% a year), like a service business such as market making: each signal keeps earning for a long time (half-life " + half.toFixed(1) + " years), so revenue keeps building towards " + m(steady) + " for many years.";
      else story = "Revenue builds towards " + m(steady) + " a year: " + (n % 1 ? n.toFixed(1) : n) + " new signal" + (n === 1 ? "" : "s") + " a year × " + m(R) + " ÷ " + Math.round(d * 100) + "% decay. To grow, the firm must find more signals, better ones, or slow their decay.";
      $("ew-story").textContent = story;
    };
    ["ew-r", "ew-d", "ew-n"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-ew", draw);
    H.charts(draw);
  }

  // ---------- The arms race ----------
  if ($("chart-ar")) {
    const PRIZE = 20, R = 1.5, MAX = 15;
    const share = (a, b) => (a <= 0 && b <= 0 ? 0.5 : a ** R / (a ** R + b ** R));
    const best = (other) => {
      let bs = 0, bp = -Infinity;
      for (let s = 0; s <= MAX + 1e-9; s += 0.5) { const p = share(s, other) * PRIZE - s; if (p > bp + 1e-9) { bp = p; bs = s; } }
      return bs;
    };
    let timer = null, rounds = 0;
    const set = (id, v) => { $(id).value = v; };
    const draw = () => {
      const a = parseFloat($("ar-a").value), b = parseFloat($("ar-b").value);
      $("ar-a-out").textContent = "$" + a.toFixed(1) + "m"; $("ar-b-out").textContent = "$" + b.toFixed(1) + "m";
      const pA = share(a, b), winA = pA * PRIZE, winB = (1 - pA) * PRIZE;
      const rows = [{ lab: "You", win: winA, spend: a }, { lab: "Rival", win: winB, spend: b }];

      const svg = $("chart-ar"), w = fit(svg, 260), h = 260;
      const pad = { l: 46, r: 12, t: 22, b: 44 };
      const lo = Math.min(0, ...rows.map((r) => r.win - r.spend)), hi = PRIZE;
      const step = 5, y0 = Math.floor(lo / step) * step, y1 = hi;
      const sy = (v) => pad.t + ((y1 - v) / (y1 - y0)) * (h - pad.t - pad.b);
      for (let v = y0; v <= y1; v += step) {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(v), y2: sy(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 6, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = "$" + v + "m";
      }
      el("text", { x: 4, y: 12 }, svg).textContent = "A year of races";
      const slot = (w - pad.l - pad.r) / 2, bw = Math.min(110, slot * 0.5);
      rows.forEach((r, i) => {
        const x = pad.l + slot * i + (slot - bw) / 2, profit = r.win - r.spend;
        // spend part (grey) from 0 up to min(spend, win); profit part (tone) above it; a loss drawn below zero
        const spendShown = Math.min(r.spend, r.win);
        if (spendShown > 0) el("rect", { x, y: sy(spendShown), width: bw, height: sy(0) - sy(spendShown), fill: grey(), "fill-opacity": 0.8, rx: 2 }, svg);
        if (profit > 0) el("rect", { x, y: sy(r.win), width: bw, height: sy(spendShown) - sy(r.win), fill: tone(), rx: 2 }, svg);
        if (profit < 0) el("rect", { x, y: sy(0), width: bw, height: sy(profit) - sy(0), fill: colour("--danger") || "#dc2626", "fill-opacity": 0.55, rx: 2 }, svg);
        el("text", { x: x + bw / 2, y: sy(Math.max(r.win, 0)) - 6, "text-anchor": "middle", style: "fill:var(--text);font-weight:600" }, svg).textContent = "wins " + m(r.win);
        el("text", { x: x + bw / 2, y: h - 24, "text-anchor": "middle", style: "fill:var(--text);font-weight:700" }, svg).textContent = r.lab;
        el("text", { x: x + bw / 2, y: h - 8, "text-anchor": "middle" }, svg).textContent = "keeps " + m(profit);
      });
      // the prize line
      el("line", { x1: pad.l, x2: w - pad.r, y1: sy(PRIZE), y2: sy(PRIZE), stroke: tone(), "stroke-dasharray": "4 4" }, svg);

      const burned = a + b;
      const out = $("ar-read"); out.textContent = "";
      span(out, "You win " + Math.round(pA * 100) + "% of races");
      span(out, "Your profit: " + m(winA - a) + " · rival: " + m(winB - b));
      span(out, "Spent on the race: " + m(burned) + " of the $20m prize (" + Math.round((burned / PRIZE) * 100) + "%)");
      if (rounds) span(out, "Rounds of responses: " + rounds);

      let story;
      if (a > 0 && a === best(b) && b === best(a)) story = "The race has settled: each firm is spending about " + m(a) + " a year, because cutting back would hand the other most of the races. Each keeps only " + m(winA - a) + ". Together they've spent " + Math.round((burned / PRIZE) * 100) + "% of the prize on getting there first, which is where Deltashark's line about returns to speed being relative leads.";
      else if (Math.abs(a - b) < 0.01) story = "Equal budgets, so you split the races 50:50 and each keep " + m(winA - a) + ". But if either firm spends a little more, it takes most of the races. Press Rival responds and see what your rival would do.";
      else if (a > b) story = "You're spending more, so you win " + Math.round(pA * 100) + "% of the races. But your rival can win them back just by outspending you, without the prize getting any bigger. Press Rival responds.";
      else story = "Your rival is spending more and wins " + Math.round((1 - pA) * 100) + "% of the races. Your profit depends on their budget, not just yours. Press You respond to see the budget that does best against theirs.";
      $("ar-story").textContent = story;
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    $("ar-you").addEventListener("click", () => { stop(); set("ar-a", best(parseFloat($("ar-b").value))); rounds++; draw(); });
    $("ar-them").addEventListener("click", () => { stop(); set("ar-b", best(parseFloat($("ar-a").value))); rounds++; draw(); });
    $("ar-run").addEventListener("click", () => {
      stop(); let k = 0;
      timer = setInterval(() => {
        if (k % 2 === 0) set("ar-b", best(parseFloat($("ar-a").value))); else set("ar-a", best(parseFloat($("ar-b").value)));
        rounds++; k++; draw();
        if (k >= 8) stop();
      }, 380);
    });
    $("ar-reset").addEventListener("click", () => { stop(); set("ar-a", 2); set("ar-b", 2); rounds = 0; draw(); });
    ["ar-a", "ar-b"].forEach((id) => $(id).addEventListener("input", () => { stop(); draw(); }));
    onResize("chart-ar", draw);
    H.charts(draw);
  }
})();