// Interactives for the note "Event-Driven" (Hedge Funds · Strategies).
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
  const money = (v) => (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);
  const pct = (v, dp) => {
    const r = Number(v.toFixed(dp === undefined ? 1 : dp));
    return (r < 0 ? "−" : "") + Math.abs(r).toFixed(dp === undefined ? 1 : dp) + "%";
  };

  // ---------- Price a deal ----------
  if ($("chart-pd")) {
    const O = 50, CASH = 4.5;
    const draw = () => {
      const P = parseFloat($("pd-p").value), F = parseFloat($("pd-f").value), m = parseFloat($("pd-m").value), q = parseFloat($("pd-q").value) / 100;
      $("pd-p-out").textContent = "$" + P.toFixed(2);
      $("pd-f-out").textContent = "$" + F;
      $("pd-m-out").textContent = String(m);
      $("pd-q-out").textContent = Math.round(q * 100) + "%";

      const svg = $("chart-pd"), w = fit(svg, 150);
      const lo = Math.min(F, P) - 2, hi = O + 2, padL = 14, padR = 14;
      const sx = (v) => padL + ((v - lo) / (hi - lo)) * (w - padL - padR);
      const y = 84;
      el("line", { x1: sx(lo), x2: sx(hi), y1: y, y2: y, stroke: colour("--border"), "stroke-width": 2 }, svg);
      for (let t = Math.ceil(lo / 5) * 5; t <= hi; t += 5) {
        el("line", { x1: sx(t), x2: sx(t), y1: y + 10, y2: y + 15, stroke: colour("--text-2"), "stroke-width": 1 }, svg);
        el("text", { x: sx(t), y: y + 30, "text-anchor": "middle" }, svg).textContent = "$" + t;
      }
      const Fc = Math.min(F, P);
      el("rect", { x: sx(Fc), y: y - 7, width: Math.max(1, sx(P) - sx(Fc)), height: 14, rx: 4, fill: grey(), "fill-opacity": 0.85 }, svg);
      el("rect", { x: sx(P), y: y - 7, width: Math.max(1, sx(O) - sx(P)), height: 14, rx: 4, fill: tone() }, svg);
      const tick = (v, label, anchor) => {
        el("line", { x1: sx(v), x2: sx(v), y1: y - 12, y2: y + 9, stroke: colour("--text"), "stroke-width": 1.5 }, svg);
        if (label) el("text", { x: sx(v), y: y + 50, "text-anchor": anchor || "middle", style: "fill:var(--text)" }, svg).textContent = label;
      };
      const narrow = w < 480;
      tick(Fc, narrow || sx(P) - sx(Fc) < 90 ? "" : "breaks", "middle");
      tick(P, "now " + money(P), sx(P) > w - 70 ? "end" : "middle");
      tick(O, narrow || sx(O) - sx(P) < 90 ? "" : "offer", "middle");
      // Your fair value
      const V = q * O + (1 - q) * F;
      el("path", { d: "M" + sx(V) + " " + (y - 30) + " l-6 -10 h12 z", fill: colour("--text") }, svg);
      const anchor = sx(V) > w - 110 ? "end" : sx(V) < 110 ? "start" : "middle";
      el("text", { x: sx(V), y: y - 46, "text-anchor": anchor, style: "fill:var(--text);font-weight:600" }, svg).textContent = "worth " + money(V) + " on your odds";

      const spread = O - P, spPct = (spread / P) * 100, ann = spPct * (12 / m);
      const implied = (P - F) / (O - F);
      const ev = q * spread - (1 - q) * (P - F), evPct = (ev / P) * 100, evAnn = evPct * (12 / m);
      const out = $("pd-read"); out.textContent = "";
      span(out, "Spread " + money(spread) + " (" + pct(spPct) + "), about " + pct(ann) + " a year");
      span(out, "Downside if it breaks: " + money(P - F) + " (" + pct(((P - F) / P) * 100) + ")");
      span(out, "Market's odds: " + Math.round(implied * 100) + "%  ·  yours: " + Math.round(q * 100) + "%");
      span(out, "Expected profit: " + money(ev) + " a share, about " + pct(evAnn) + " a year");

      let story;
      if (ev <= 0) story = "On your odds this trade loses money on average: the " + money(P - F) + " downside outweighs the " + money(spread) + " spread. Pass, unless you have a reason to think the deal is safer than you've said.";
      else if (evAnn < CASH) story = "It makes money on average on your odds, but only about " + pct(evAnn) + " a year, less than the roughly " + CASH + "% you'd earn on cash with no risk. Not worth tying up the capital.";
      else story = "Your " + Math.round(q * 100) + "% is above the market's " + Math.round(implied * 100) + "%, so on your numbers the shares are worth " + money(V) + ", more than the " + money(P) + " they cost. Expected return about " + pct(evAnn) + " a year: worth a position, sized so a break doesn't hurt too much.";
      if (ann > 25 && q >= implied) story += " A very wide spread usually means the market sees real trouble. Make sure you know what it's worried about.";
      $("pd-story").textContent = story;
    };
    ["pd-p", "pd-f", "pd-m", "pd-q"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-pd", draw);
    H.charts(draw);
  }

  // ---------- Run a deal book ----------
  if ($("chart-db")) {
    const SPREAD = 5, LOSS = 25, ROUNDS = 3, YEARS = 2000, BAD = 0.15;
    let mode = 0, seed = 5;
    const rng = (s) => () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const draw = () => {
      const N = parseInt($("db-n").value, 10), p = parseFloat($("db-p").value) / 100;
      $("db-n-out").textContent = String(N);
      $("db-p-out").textContent = Math.round(p * 100) + "%";

      // In clusters: 15% of years are bad years with about 3.4 times the break chance; the average stays the same
      const pBad = Math.min(0.6, p * 3.4), pGood = Math.max(0, (p - BAD * pBad) / (1 - BAD));
      const r = rng(seed), res = [];
      for (let y = 0; y < YEARS; y++) {
        const pp = mode === 0 ? p : r() < BAD ? pBad : pGood;
        let sum = 0;
        for (let k = 0; k < ROUNDS * N; k++) sum += r() < pp ? -LOSS : SPREAD;
        res.push(sum / N);
      }
      const sorted = [...res].sort((a, b) => a - b);
      const avg = res.reduce((a, b) => a + b, 0) / YEARS, losing = res.filter((v) => v < 0).length / YEARS;
      const p5 = sorted[Math.floor(0.05 * YEARS)], worst = sorted[0];

      const svg = $("chart-db"), w = fit(svg, 260), h = 260;
      const span0 = Math.max(10, sorted[YEARS - 1] - sorted[0]);
      const bw = span0 > 60 ? 5 : span0 > 30 ? 2 : 1;
      const lo = Math.floor(sorted[0] / bw) * bw, hi = Math.ceil((sorted[YEARS - 1] + 1e-9) / bw) * bw;
      const bins = Math.max(1, Math.round((hi - lo) / bw)), counts = new Array(bins).fill(0);
      res.forEach((v) => { counts[Math.min(bins - 1, Math.floor((v - lo) / bw))]++; });
      const maxC = Math.max(...counts);
      const step = (hi - lo) > 60 ? 20 : (hi - lo) > 25 ? 10 : 5;
      const xt = []; for (let x = Math.ceil(lo / step) * step; x <= hi; x += step) xt.push(x);
      const yTop = H.niceMax ? H.niceMax(maxC / YEARS * 100) : Math.ceil(maxC / YEARS * 100);
      const yt = []; const ys = yTop > 20 ? 10 : yTop > 8 ? 5 : 2; for (let v = 0; v <= yTop + 1e-9; v += ys) yt.push(v);
      const sc = H.frame(svg, w, h, { l: 40, r: 12, t: 22, b: 40 }, [lo, hi], [0, yTop], xt, yt, (v) => v + "%");
      el("text", { x: w - 12, y: h - 6, "text-anchor": "end" }, svg).textContent = "Fund's return for the year (%)";
      el("text", { x: 4, y: 12 }, svg).textContent = "Share of years";
      counts.forEach((c, i) => {
        if (!c) return;
        const x0 = lo + i * bw, top = (c / YEARS) * 100;
        el("rect", { x: sc.sx(x0) + 0.5, y: sc.sy(top), width: Math.max(1, sc.sx(x0 + bw) - sc.sx(x0) - 1), height: sc.sy(0) - sc.sy(top), fill: x0 + bw <= 0 ? grey() : tone(), "fill-opacity": 0.9 }, svg);
      });
      if (lo < 0 && hi > 0) el("line", { x1: sc.sx(0), x2: sc.sx(0), y1: 22, y2: h - 40, stroke: colour("--text"), "stroke-width": 1, "stroke-dasharray": "3 4" }, svg);

      const out = $("db-read"); out.textContent = "";
      span(out, "Average year: " + pct(avg));
      span(out, "Losing years: " + Math.round(losing * 100) + "%");
      span(out, "1-in-20 bad year: " + pct(p5));
      span(out, "Worst of 2,000: " + pct(worst));

      const breakEven = SPREAD / (SPREAD + LOSS) * 100;
      let story;
      if (avg <= 0) story = "With deals breaking " + Math.round(p * 100) + "% of the time, a 5% spread can't pay for 25% losses: the break-even chance is about " + breakEven.toFixed(0) + "%. Spreads must widen until they pay for the risk, which is what happens in a crisis.";
      else if (mode === 0) story = "With breaks happening one at a time, " + N + " deals smooth things out: most years land near " + pct(avg) + ", and a bad year is " + pct(p5) + ". " + (N <= 6 ? "With so few deals, one break hits hard; try holding more." : "Now switch to clusters, keeping everything else the same.");
      else story = "Same average, " + pct(avg) + ", but now bad years bring several breaks at once, so the 1-in-20 year is " + pct(p5) + ". Adding more deals barely helps, because the breaks aren't independent any more. This is 2008 and 2014 in a chart.";
      $("db-story").textContent = story;
    };
    choice("db-mode", ["One at a time", "In clusters"], mode, (i) => { mode = i; draw(); });
    ["db-n", "db-p"].forEach((id) => $(id).addEventListener("input", draw));
    $("db-again").addEventListener("click", () => { seed = (seed * 48271 + 3) % 2147483647; draw(); });
    onResize("chart-db", draw);
    H.charts(draw);
  }
})();