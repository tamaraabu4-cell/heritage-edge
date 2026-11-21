// Interactives for the note "Footprints of Size and Information" (Quant · Microstructure).
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
    box.textContent = "";
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
  const signedNum = (v) => (v > 0.5 ? "+" : v < -0.5 ? "−" : "") + num(Math.abs(v));
  const bp = (v) => (v < -0.05 ? "−" : v > 0.05 ? "+" : "") + Math.abs(v).toFixed(0) + " bp";

  // ---------- Spot the slicer ----------
  if ($("chart-ss")) {
    const MIN = 30, RATE = 8, TOTAL = 30000, SLOTS = 60;
    let algo = 0, show = false, seed = 21;
    const showBtn = $("ss-show");
    buttons("ss-algo", ["Clockwork slicer", "Randomised slicer", "No hidden buyer"], 0, (i) => { algo = i; draw(); });
    showBtn.addEventListener("click", () => { show = !show; showBtn.setAttribute("aria-pressed", show ? "true" : "false"); showBtn.textContent = show ? "Hide the algo's trades" : "Show the algo's trades"; draw(); });
    $("ss-again").addEventListener("click", () => { seed += 1; draw(); });

    const build = () => {
      const r = rng(seed), trades = [];
      // Background: many traders, about eight trades a minute, sizes in round lots
      let t = 0;
      while (true) {
        t += -Math.log(1 - r()) * (60 / RATE);
        if (t >= MIN * 60) break;
        const size = Math.max(100, Math.round(Math.exp(6.1 + 0.75 * normal(r)) / 100) * 100);
        trades.push({ t, size: Math.min(size, 6000), side: r() < 0.5 ? 1 : -1, algo: false });
      }
      // The hidden buyer: 60 child orders, 30,000 shares in total
      const ra = rng(seed * 7 + 3);
      if (algo === 0) for (let k = 0; k < SLOTS; k++) trades.push({ t: k * 30 + 0.5, size: 500, side: 1, algo: true });
      if (algo === 1) {
        let sizes = Array.from({ length: SLOTS }, () => 150 + ra() * 700);
        const scale = TOTAL / sizes.reduce((a, b) => a + b, 0);
        sizes = sizes.map((s) => Math.max(1, Math.round(s * scale)));
        for (let k = 0; k < SLOTS; k++) trades.push({ t: k * 30 + ra() * 30, size: sizes[k], side: 1, algo: true });
      }
      trades.sort((a, b) => a.t - b.t);
      return trades;
    };

    const draw = () => {
      const trades = build();
      const svg = $("chart-ss");
      const hh = 380, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: narrow ? 50 : 58, r: 12 };
      const iw = w - pad.l - pad.r;
      const top = { t: 14, h: 170 }, bot = { t: 236, h: 104 };
      const sx = (s) => pad.l + (s / (MIN * 60)) * iw;
      // Top panel: size on a log scale
      const lo = Math.log10(80), hi = Math.log10(7000);
      const syS = (v) => top.t + top.h - ((Math.log10(v) - lo) / (hi - lo)) * top.h;
      [100, 300, 1000, 3000].forEach((v) => {
        el("line", { x1: pad.l, x2: w - pad.r, y1: syS(v), y2: syS(v), class: "grid" }, svg);
        el("text", { x: pad.l - 8, y: syS(v) + 4, "text-anchor": "end" }, svg).textContent = num(v);
      });
      el("text", { x: 4, y: top.t - 2 }, svg).textContent = narrow ? "Size" : "Trade size";
      trades.forEach((tr) => {
        const reveal = show && tr.algo;
        el("circle", {
          cx: sx(tr.t), cy: syS(tr.size), r: reveal ? 4 : narrow ? 2.4 : 2.8,
          fill: tr.side > 0 ? tone() : grey(), "fill-opacity": reveal ? 1 : tr.side > 0 ? 0.45 : 0.55,
          stroke: reveal ? "var(--text)" : "none", "stroke-width": reveal ? 1.2 : 0,
        }, svg);
      });
      // Bottom panel: cumulative signed volume against the chance band
      let cum = 0, sq = 0, n = 0;
      const path = [{ t: 0, c: 0 }];
      trades.forEach((tr) => { cum += tr.side * tr.size; if (!tr.algo) { sq += tr.size * tr.size; n++; } path.push({ t: tr.t, c: cum }); });
      const rms = Math.sqrt(sq / Math.max(1, n));
      const band = (s) => 2 * rms * Math.sqrt(Math.max(0, (s / 60) * RATE));
      const yMax = Math.max(TOTAL * 1.25, band(MIN * 60) * 1.15, Math.max(...path.map((p) => Math.abs(p.c))) * 1.05);
      const step = yMax > 40000 ? 20000 : 10000, Y = Math.ceil(yMax / step) * step;
      const syC = (v) => bot.t + bot.h / 2 - (v / Y) * (bot.h / 2);
      let up = "", dn = "";
      for (let i = 0; i <= 60; i++) { const s = (i / 60) * MIN * 60; up += (i ? "L" : "M") + sx(s).toFixed(1) + " " + syC(band(s)).toFixed(1); dn = "L" + sx(s).toFixed(1) + " " + syC(-band(s)).toFixed(1) + dn; }
      el("path", { d: up + dn.replace(/^L/, "L") + "Z", fill: grey(), "fill-opacity": 0.18 }, svg);
      [-Y, 0, Y].forEach((v) => {
        el("line", { x1: pad.l, x2: w - pad.r, y1: syC(v), y2: syC(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 8, y: syC(v) + 4, "text-anchor": "end" }, svg).textContent = (v > 0 ? "+" : v < 0 ? "−" : "") + (Math.abs(v) >= 1000 ? Math.abs(v) / 1000 + "k" : "0");
      });
      let d = "";
      path.forEach((p, i) => { d += (i ? "L" : "M") + sx(p.t).toFixed(1) + " " + syC(p.c).toFixed(1); });
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
      el("text", { x: 4, y: bot.t - 8 }, svg).textContent = "Cumulative signed volume";
      [0, 10, 20, 30].forEach((m) => el("text", { x: sx(m * 60), y: hh - 18, "text-anchor": "middle" }, svg).textContent = m);
      el("text", { x: pad.l + iw / 2, y: hh - 2, "text-anchor": "middle" }, svg).textContent = "Minutes";

      // Detectors
      const exact = trades.filter((tr) => tr.size === 500 && Math.abs(((tr.t % 30) + 30) % 30 - 0.5) < 0.6).length;
      const bandEnd = band(MIN * 60), z = cum / (bandEnd / 2);
      let posMin = 0;
      for (let m = 0; m < MIN; m++) { const net = trades.filter((tr) => tr.t >= m * 60 && tr.t < (m + 1) * 60).reduce((a, tr) => a + tr.side * tr.size, 0); if (net > 0) posMin++; }
      const box = $("ss-read"); box.textContent = "";
      span(box, "Trades of exactly 500 on the 30-second marks: " + exact);
      span(box, "Cumulative signed volume: " + signedNum(cum) + " (chance band ±" + num(bandEnd) + ")");
      span(box, "Minutes with net buying: " + posMin + " of " + MIN);
      const verdict = exact >= 10 ? "Detector: clockwork slicer found" : z > 2 ? "Detector: persistent buyer, size and timing hidden" : z > 1.3 ? "Detector: possible buyer, not conclusive" : "Detector: nothing unusual";
      span(box, verdict).style.fontWeight = "600";

      let story;
      if (algo === 0) story = "Sixty trades of exactly 500 shares, each on a 30-second mark: a stripe any program could find in seconds, even before looking at the total. This is the footprint Deltashark means by child orders of suspiciously regular size or timing.";
      else if (algo === 1) story = "Random sizes and random times make the dots blend in: try to find the algo's trades before revealing them. But the running total still climbs in a near-straight line and ends " + (z > 2 ? "well outside" : "near the edge of") + " the chance band. Hiding the pattern doesn't hide the order.";
      else story = "With no hidden buyer, the running total wanders up and down and usually stays inside the band. Press Another half hour a few times: about one run in twenty will drift outside by chance, which is why one signal on its own is never proof.";
      $("ss-story").textContent = story;
    };

    onResize("chart-ss", draw);
    H.charts(draw);
  }

  // ---------- Informed or just big? ----------
  if ($("chart-ib")) {
    const SIGMA = 150, Y = 0.7, EXEC = 60, END = 150, NOISE = 0.9;
    const CLUES = {
      informed: ["Tuesday, 10:20am. The company reports results tomorrow morning, and the fund buying is known for research-driven bets.", "Thursday, 1:15pm. A competitor has just announced it's leaving the market; the shares of related companies are rising too."],
      rebalance: ["Last trading day of the month, 2:45pm. The stock has fallen 9% this month, so index-tracking balanced funds need to buy it to get back to their weights.", "Friday, 3:00pm. A big index provider's quarterly rebalance takes effect at today's close, and this stock's weight is going up."],
    };
    const qIn = $("ib-q");
    let mode = 0, seed = 5, guess = null, mystery = null;
    const guessBox = $("ib-guess"), clue = $("ib-clue");
    const setType = buttons("ib-type", ["Informed buyer", "Month-end rebalance", "Mystery order"], 0, (i) => { mode = i; if (i === 2) newMystery(); draw(); });
    const newMystery = () => {
      const r = rng(seed * 13 + 1); const informed = r() < 0.5;
      mystery = { informed, clue: CLUES[informed ? "informed" : "rebalance"][r() < 0.5 ? 0 : 1] };
      guess = null;
      buttons("ib-guess", ["My guess: informed", "My guess: rebalance"], -1, (i) => { guess = i === 0; draw(); });
    };
    $("ib-again").addEventListener("click", () => { seed += 1; if (mode === 2) newMystery(); draw(); });

    const expected = (t, peak, informed) => {
      if (t <= EXEC) return peak * Math.sqrt(t / EXEC);
      return informed ? peak : peak * (0.3 + 0.7 * Math.exp(-(t - EXEC) / 20));
    };

    const draw = () => {
      const q = +qIn.value / 100;
      $("ib-q-out").textContent = qIn.value + "% of a day's volume";
      const peak = Y * SIGMA * Math.sqrt(q);
      const informed = mode === 0 ? true : mode === 1 ? false : mystery.informed;
      const hidden = mode === 2 && guess === null;
      guessBox.hidden = mode !== 2; clue.hidden = mode !== 2;
      if (mode === 2) clue.textContent = "Clue: " + mystery.clue;
      const r = rng(seed);
      const path = [0];
      for (let t = 1; t <= END; t++) path.push(0);
      let walk = 0;
      for (let t = 1; t <= END; t++) { walk += NOISE * normal(r); path[t] = expected(t, peak, informed) + walk; }

      const svg = $("chart-ib");
      const hh = 280, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: 46, r: 14, t: 28, b: 44 };
      const iw = w - pad.l - pad.r, ih = hh - pad.t - pad.b;
      const lo = Math.min(-15, ...path.map((v) => v - 5)), hiV = Math.max(peak * 1.25, ...path.map((v) => v + 5));
      const step = hiV - lo > 80 ? 20 : 10;
      const Y0 = Math.floor(lo / step) * step, Y1 = Math.ceil(hiV / step) * step;
      const sx = (t) => pad.l + (t / END) * iw, sy = (v) => pad.t + ((Y1 - v) / (Y1 - Y0)) * ih;
      el("rect", { x: sx(0), y: pad.t, width: sx(EXEC) - sx(0), height: ih, fill: tone(), "fill-opacity": 0.07 }, svg);
      el("text", { x: sx(EXEC / 2), y: pad.t + 14, "text-anchor": "middle", style: "fill:var(--tone)" }, svg).textContent = "Buying";
      el("text", { x: sx((EXEC + END) / 2), y: pad.t + 14, "text-anchor": "middle", style: "fill:var(--text-2)" }, svg).textContent = hidden ? "What happens next?" : "After the order";
      for (let v = Y0; v <= Y1 + 1e-9; v += step) {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(v), y2: sy(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
      }
      (narrow ? [0, 60, 120] : [0, 30, 60, 90, 120, 150]).forEach((t) => el("text", { x: sx(t), y: pad.t + ih + 18, "text-anchor": "middle" }, svg).textContent = t);
      el("text", { x: pad.l + iw / 2, y: hh - 6, "text-anchor": "middle" }, svg).textContent = "Minutes";
      el("text", { x: 4, y: 12 }, svg).textContent = narrow ? "bp" : "Impact, bp";
      const shownEnd = hidden ? EXEC : END;
      let e = "";
      for (let t = 0; t <= shownEnd; t++) e += (t ? "L" : "M") + sx(t).toFixed(1) + " " + sy(expected(t, peak, informed)).toFixed(1);
      el("path", { d: e, fill: "none", stroke: grey(), "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
      let d = "";
      for (let t = 0; t <= shownEnd; t++) d += (t ? "L" : "M") + sx(t).toFixed(1) + " " + sy(path[t]).toFixed(1);
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
      el("circle", { cx: sx(shownEnd), cy: sy(path[shownEnd]), r: 5, fill: tone(), stroke: "var(--bg)", "stroke-width": 2 }, svg);

      const box = $("ib-read"); box.textContent = "";
      span(box, "Expected peak: " + bp(peak));
      span(box, "At the end of buying: " + bp(path[EXEC]));
      if (!hidden) {
        span(box, "90 minutes later: " + bp(path[END]));
        span(box, "Kept: " + Math.round(100 * expected(END, peak, informed) / peak) + "% of the peak (expected)");
        span(box, "Bought alongside at minute 45, held to the end: " + bp(path[END] - path[45]));
      }
      let story;
      if (hidden) story = "During the order, informed and uninformed buying look almost the same: a concave climb as the square-root law says. Read the clue, then guess what happens after the buying stops.";
      else if (mode === 2) story = (guess === informed ? "Right. " : "Not this time. ") + (informed ? "It was informed: the price had learned something, so the impact stayed. The clue (news coming, related markets moving) was the giveaway, not the tape." : "It was a rebalance: once the buying stopped, most of the impact faded. The clue (month-end, index weights) was the giveaway, not the tape.");
      else if (informed) story = "The price climbs while the fund buys and then stays up: the order carried information, so the market's new price is the right one. Anyone who sold to this fund sold too cheaply; anyone who bought alongside it kept the gain.";
      else story = "The price climbs just as much while the fund buys, then gives most of it back: about 30% of the peak stays. Nothing was learned; the buying was a cash-flow need. Buying alongside it near the peak means losing as it fades. Averaged across many orders of both kinds, impact settles near two-thirds of its peak.";
      $("ib-story").textContent = story;
    };

    newMystery();
    guessBox.hidden = true;
    qIn.addEventListener("input", draw);
    onResize("chart-ib", draw);
    H.charts(draw);
  }
})();