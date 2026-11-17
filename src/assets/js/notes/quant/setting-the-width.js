// Interactives for the note "Setting the Width" (Quant · Market Making).
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
  const usd = (v) => (v < -0.5 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-GB");
  const niceStep = (span, parts) => {
    const raw = span / parts, mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
  };

  // ---------- Price the width ----------
  if ($("chart-pw")) {
    const FEES = 0.5, LAMBDA = 0.5;
    const PRESETS = [
      { name: "Normal", q: 10, m: 10, v: 1, h: 1 },
      { name: "Before a release", q: 20, m: 10, v: 2, h: 1 },
      { name: "Thin afternoon", q: 10, m: 10, v: 1, h: 4 },
      { name: "Stress", q: 25, m: 15, v: 3, h: 4 },
    ];
    const qIn = $("pw-q"), mIn = $("pw-m"), vIn = $("pw-v"), hIn = $("pw-h");
    const setPick = buttons("pw-pick", PRESETS.map((p) => p.name), 0, (i) => {
      const p = PRESETS[i]; qIn.value = p.q; mIn.value = p.m; vIn.value = p.v; hIn.value = p.h; draw();
    });

    const draw = () => {
      const q = +qIn.value / 100, m = +mIn.value, v = +vIn.value, h = +hIn.value;
      $("pw-q-out").textContent = qIn.value + "%";
      $("pw-m-out").textContent = m + " ticks";
      $("pw-v-out").textContent = "×" + v.toFixed(2);
      $("pw-h-out").textContent = h + " min";
      const as = q * m, inv = LAMBDA * v * Math.sqrt(h), floor = as + inv + FEES;

      const svg = $("chart-pw");
      const hh = 170, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: 16, r: 16 };
      const xMax = Math.max(8, Math.ceil(floor * 1.15));
      const sx = (x) => pad.l + (x / xMax) * (w - pad.l - pad.r);
      const y = 52, bh = 40;
      const step = xMax > 16 ? 4 : xMax > 8 ? 2 : 1;
      for (let x = 0; x <= xMax; x += step) {
        el("line", { x1: sx(x), x2: sx(x), y1: y - 8, y2: y + bh + 8, class: "grid" }, svg);
        el("text", { x: sx(x), y: y + bh + 26, "text-anchor": "middle" }, svg).textContent = x;
      }
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: hh - 6, "text-anchor": "middle" }, svg).textContent = "Half-spread, ticks";
      const parts = [
        { v: as, fill: tone(), op: 1, lab: "informed" },
        { v: inv, fill: tone(), op: 0.5, lab: "inventory" },
        { v: FEES, fill: grey(), op: 1, lab: "fees" },
      ];
      let x0 = 0;
      parts.forEach((p) => {
        if (p.v <= 0) return;
        el("rect", { x: sx(x0), y, width: sx(x0 + p.v) - sx(x0), height: bh, fill: p.fill, "fill-opacity": p.op }, svg);
        if (sx(x0 + p.v) - sx(x0) > (narrow ? 34 : 40)) el("text", { x: (sx(x0) + sx(x0 + p.v)) / 2, y: y + bh / 2 + 4, "text-anchor": "middle", style: "fill:" + (p.op === 1 && p.fill !== grey() ? "var(--on-tone)" : "var(--text)") }, svg).textContent = p.v.toFixed(2);
        x0 += p.v;
      });
      el("line", { x1: sx(2), x2: sx(2), y1: y - 22, y2: y + bh + 6, stroke: "var(--text)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      el("text", { x: sx(2) + 4, y: y - 14, style: "fill:var(--text)" }, svg).textContent = "4-wide quote";

      const box = $("pw-read"); box.textContent = "";
      span(box, "Floor: " + as.toFixed(2) + " + " + inv.toFixed(2) + " + " + FEES.toFixed(2) + " = " + floor.toFixed(2) + " ticks a side");
      span(box, "Minimum full spread: " + (2 * floor).toFixed(1) + " ticks");
      span(box, floor > 2 ? "A 4-wide quote loses " + (floor - 2).toFixed(2) + " ticks a fill on average" : "A 4-wide quote clears the floor by " + (2 - floor).toFixed(2) + " ticks a fill");

      let story;
      if (floor <= 2.05) story = "In normal conditions, a 4-wide quote covers its costs, with room to compete. This is Deltashark's starting point: a 1-tick toll, 0.5 for inventory and 0.5 for fees.";
      else if (inv > as) story = "Inventory is now the biggest part of the floor: prices are jumpy or positions take a long time to pass on, so holding anything is expensive. Thin markets and stress both look like this.";
      else story = "The informed toll dominates: more of the flow knows something, and it's costly when it does. A maker quoting its normal width here is selling cheap options; it should widen, size down, or step away.";
      if (floor > 5) story += " At this level many makers simply pull their quotes, which is part of why spreads can gap so far in a crisis.";
      $("pw-story").textContent = story;
    };

    [qIn, mIn, vIn, hIn].forEach((x) => x.addEventListener("input", () => { setPick(-1); draw(); }));
    H.charts(draw);
    onResize("chart-pw", draw);
  }

  // ---------- Run the desk ----------
  if ($("chart-rd")) {
    const PER_MIN = 4, HOURS = 6.5, STEPS = HOURS * 60 * PER_MIN;  // 9:00 to 15:30, a step every 15 seconds
    const RELEASE = 4.5 * 60 * PER_MIN;                              // 13:30
    const INFORMED = 10 * PER_MIN;                                   // informed traders for 10 minutes before
    const AFTER = 30 * PER_MIN;                                      // volatile for 30 minutes after
    const SIG = 0.15, KAPPA = 0.8, A = 0.25, JUMP = 10, LIMIT = 40, TICK = 12.5;
    const PRESETS = [
      { name: "Tight and brave", w: 1, k: 0, news: 0 },
      { name: "Deltashark's advice", w: 2, k: 0.1, news: 1 },
      { name: "Cautious", w: 4, k: 0.1, news: 2 },
    ];
    let news = 1, seed = 8;
    const wIn = $("rd-w"), kIn = $("rd-k");
    const setNews = buttons("rd-news", ["Keep quoting", "Widen ×3", "Pull quotes"], 1, (i) => { news = i; setPick(-1); draw(); });
    const setPick = buttons("rd-pick", PRESETS.map((p) => p.name), 1, (i) => {
      const p = PRESETS[i]; wIn.value = p.w; kIn.value = p.k; news = p.news; setNews(p.news); draw();
    });

    const draw = () => {
      const width = +wIn.value, k = +kIn.value;
      $("rd-w-out").textContent = width + " ticks";
      $("rd-k-out").textContent = k.toFixed(2);
      const r = rng(seed * 3571);
      const up = r() < 0.5, jump = up ? JUMP : -JUMP;
      let V = 0, I = 0, cash = 0, spreadEarned = 0, informedLoss = 0, exitCost = 0, exits = 0, fills = 0, informedFills = 0;
      const pnl = [0];
      for (let t = 0; t < STEPS; t++) {
        const vol = t >= RELEASE && t < RELEASE + AFTER ? 3 : 1;
        if (t === RELEASE) V += jump;
        V += SIG * vol * normal(r);
        const bU = r(), sU = r(), iU = r();
        const nearNews = t >= RELEASE - INFORMED && t < RELEASE + 2 * PER_MIN * 5;
        const pulled = news === 2 && t >= RELEASE - INFORMED && t < RELEASE + 5 * PER_MIN;
        const half = (news === 1 && nearNews ? 3 : 1) * width / 2;
        if (!pulled) {
          const centre = V - k * I, bid = centre - half, offer = centre + half;
          // Ordinary customers
          if (bU < Math.min(0.9, A * Math.exp(-KAPPA * (offer - V)))) { I -= 1; cash += offer; spreadEarned += offer - V; fills++; }
          if (sU < Math.min(0.9, A * Math.exp(-KAPPA * (V - bid)))) { I += 1; cash -= bid; spreadEarned += V - bid; fills++; }
          // Informed traders know where the price will be after the release
          if (t >= RELEASE - INFORMED && t < RELEASE && iU < 0.35) {
            const after = V + jump;
            if (up && offer < after) { I -= 1; cash += offer; informedLoss += offer - after; informedFills++; }
            if (!up && bid > after) { I += 1; cash -= bid; informedLoss += after - bid; informedFills++; }
          }
        }
        // Hard limit: cross a 1-tick half-spread back to half the limit
        if (Math.abs(I) >= LIMIT) {
          const target = Math.sign(I) * LIMIT / 2, qty = I - target;
          cash += qty * (V - Math.sign(qty) * 1);
          exitCost += Math.abs(qty) * 1;
          exits++; I = target;
        }
        pnl.push((cash + I * V) * TICK);
      }
      const total = pnl[STEPS];
      const inventoryMoves = total - (spreadEarned + informedLoss) * TICK + exitCost * TICK;

      const svg = $("chart-rd");
      const h = 280, w = fit(svg, h);
      const pad = { l: 58, r: 14, t: 16, b: 40 };
      const lo = Math.min(0, ...pnl), hi = Math.max(0, ...pnl);
      const step = niceStep(Math.max(hi - lo, 500), 4);
      const yr = [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
      const yt = [];
      for (let v = yr[0]; v <= yr[1] + 1e-9; v += step) yt.push(v);
      const s = H.frame(svg, w, h, pad, [0, STEPS], yr, [], yt, (v) => (v < 0 ? "−$" : "$") + (Math.abs(v) >= 1000 ? Math.abs(v) / 1000 + "k" : Math.abs(v)));
      [9, 10, 11, 12, 13, 14, 15].forEach((hr) => {
        const x = s.sx((hr - 9) * 60 * PER_MIN);
        el("line", { x1: x, x2: x, y1: pad.t, y2: h - pad.b, class: "grid" }, svg);
        if (w >= 480 || hr % 2 === 1) el("text", { x, y: h - pad.b + 18, "text-anchor": "middle" }, svg).textContent = hr + ":00";
      });
      const rx = s.sx(RELEASE);
      el("rect", { x: s.sx(RELEASE - INFORMED), y: pad.t, width: rx - s.sx(RELEASE - INFORMED), height: h - pad.t - pad.b, fill: grey(), "fill-opacity": "0.18" }, svg);
      el("line", { x1: rx, x2: rx, y1: pad.t, y2: h - pad.b, stroke: grey(), "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
      el("text", { x: rx > w * 0.7 ? rx - 6 : rx + 6, y: pad.t + 12, "text-anchor": rx > w * 0.7 ? "end" : "start" }, svg).textContent = "release " + (up ? "+10" : "−10");
      let d = "";
      pnl.forEach((v, i) => { d += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(v).toFixed(1); });
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 2, "stroke-linejoin": "round" }, svg);

      const box = $("rd-read"); box.textContent = "";
      span(box, "Total: " + usd(total));
      span(box, "Spread from ordinary customers: " + usd(spreadEarned * TICK) + " on " + fills + " fills");
      span(box, "Lost to informed traders: " + usd(informedLoss * TICK) + " (" + informedFills + " fills)");
      span(box, "Inventory and price moves: " + usd(inventoryMoves));
      span(box, "Forced exits at the 40-lot limit: " + exits + ", costing " + usd(-exitCost * TICK));

      let story;
      if (news === 0 && width <= 1.5) story = "Tight and brave: lots of fills and plenty of spread all day, but the informed traders before the release take a big bite, and any inventory caught on the wrong side of the jump adds to it. Tight quotes through news are cheap options.";
      else if (news === 2) story = "Pulling quotes around the release dodges the informed traders and the jump entirely. The cost is the ordinary flow missed while you're out, which is why some desks widen rather than leave.";
      else if (news === 1) story = "Widening around the release makes the informed traders' option less valuable: they still trade (the jump is bigger than your wider spread), but each fill costs you less. You keep earning from ordinary flow the rest of the day. Try a wider base width, or pulling, and compare the informed losses.";
      else story = "Keeping your normal quotes through the release leaves you open to the informed traders. Compare this against widening or pulling.";
      if (k === 0 && exits > 0) story += " With no skew, inventory drifts until it hits the limit and has to be dumped.";
      if (width >= 6) story += " Very wide quotes are safe but fill so rarely that the spread earned all day is small.";
      $("rd-story").textContent = story;
    };

    [wIn, kIn].forEach((x) => x.addEventListener("input", () => { setPick(-1); draw(); }));
    $("rd-again").addEventListener("click", () => { seed += 1; draw(); });
    H.charts(draw);
    onResize("chart-rd", draw);
  }
})();