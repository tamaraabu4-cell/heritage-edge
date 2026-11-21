// Interactives for the note "The Price Grid" (Quant · Microstructure).
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
  const signed = (v, d) => (v < -0.0005 ? "−" : v > 0.0005 ? "+" : "") + Math.abs(v).toFixed(d);
  const bpFmt = (v) => (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2)) + " bp";

  // ---------- Large tick or small tick? ----------
  if ($("chart-lt")) {
    const TICKS = [0.01, 0.05, 0.25];
    const TICK_NAMES = ["1 cent", "5 cents", "0.25"];
    const PRESETS = [
      { name: "$5 stock", p: 5, t: 0, f: 4 },
      { name: "$40 stock", p: 40, t: 0, f: 4 },
      { name: "$400 stock", p: 400, t: 0, f: 4 },
      { name: "E-mini S&P", p: 6000, t: 2, f: 0.15 },
    ];
    // A day of snapshots: the spread makers want wobbles around their floor
    const r = rng(20261121), Z = Array.from({ length: 400 }, () => normal(r));
    let tickIx = 0;
    const pIn = $("lt-p"), fIn = $("lt-f");
    const setPick = buttons("lt-pick", PRESETS.map((p) => p.name), 1, (i) => {
      const p = PRESETS[i];
      pIn.value = Math.log10(p.p); fIn.value = Math.log10(p.f); tickIx = p.t; setTick(p.t); draw();
    });
    const setTick = buttons("lt-tick", TICK_NAMES, 0, (i) => { tickIx = i; setPick(-1); draw(); });

    const draw = () => {
      const P = 10 ** +pIn.value, fbp = 10 ** +fIn.value, tick = TICKS[tickIx];
      $("lt-p-out").textContent = (tickIx === 2 ? "" : "$") + (P >= 10 ? num(P) : P.toFixed(2));
      $("lt-f-out").textContent = bpFmt(fbp);
      const tickBp = 1e4 * tick / P, floorTicks = fbp / tickBp;
      const counts = new Array(10).fill(0);
      let sum = 0;
      Z.forEach((z) => {
        const want = floorTicks * Math.exp(0.35 * z - 0.06);
        const n = Math.max(1, Math.ceil(want - 1e-9));
        counts[Math.min(n, 10) - 1]++; sum += n;
      });
      const share = counts.map((c) => (100 * c) / Z.length), avg = sum / Z.length;

      const svg = $("chart-lt");
      const hh = 240, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: 44, r: 12, t: 22, b: 44 };
      const iw = w - pad.l - pad.r, ih = hh - pad.t - pad.b;
      const sy = (v) => pad.t + ih - (v / 100) * ih;
      [0, 25, 50, 75, 100].forEach((v) => {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(v), y2: sy(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v + "%";
      });
      const bw = iw / 10;
      share.forEach((s, i) => {
        const x = pad.l + i * bw;
        if (s > 0) el("rect", { x: x + bw * 0.15, y: sy(s), width: bw * 0.7, height: sy(0) - sy(s), rx: 3, fill: tone(), "fill-opacity": i === 0 ? 1 : 0.6 }, svg);
        if (s >= 1) el("text", { x: x + bw / 2, y: sy(s) - 6, "text-anchor": "middle", style: "fill:var(--text)" }, svg).textContent = Math.round(s) + (narrow ? "" : "%");
        el("text", { x: x + bw / 2, y: hh - pad.b + 18, "text-anchor": "middle" }, svg).textContent = i === 9 ? "10+" : i + 1;
      });
      el("text", { x: pad.l + iw / 2, y: hh - 6, "text-anchor": "middle" }, svg).textContent = "Quoted spread, in ticks";

      const pinned = share[0];
      const kind = pinned >= 85 ? "Large-tick" : avg >= 3 ? "Small-tick" : "In between";
      const box = $("lt-read"); box.textContent = "";
      span(box, "One tick = " + bpFmt(tickBp));
      span(box, "Floor = " + (floorTicks >= 10 ? floorTicks.toFixed(0) : floorTicks.toFixed(2)) + " ticks");
      span(box, "At one tick: " + Math.round(pinned) + "% of the day");
      span(box, "Average spread: " + avg.toFixed(1) + " ticks (" + bpFmt(avg * tickBp) + ")");
      span(box, kind).style.fontWeight = "600";

      let story;
      if (kind === "Large-tick") story = "The grid is coarser than the market wants. Makers would accept " + bpFmt(fbp) + ", but the spread can't go below one tick (" + bpFmt(tickBp) + "), so it's pinned there almost all day. The spare profit can't be competed away on price, so it goes to the front of the queue: expect long queues and a race to join each new price level.";
      else if (kind === "Small-tick") story = "The grid is fine compared with what makers need, so the spread floats around " + avg.toFixed(1) + " ticks and moves with conditions. Makers compete on price, stepping a tick ahead of each other; queues are short and quotes change often.";
      else story = "Close to the boundary: the spread is one tick some of the time and wider at others. A calm morning can make it large-tick and a jumpy afternoon small-tick, so the game makers play changes during the day.";
      if (tickIx === 2 && P > 1000) story += " The E-mini's level here is only an example; the point is that a tick of a fraction of a basis point can still be large when the market is this liquid.";
      $("lt-story").textContent = story;
    };

    [pIn, fIn].forEach((x) => x.addEventListener("input", () => { setPick(-1); draw(); }));
    onResize("chart-lt", draw);
    H.charts(draw);
  }

  // ---------- What is your queue spot worth? ----------
  if ($("chart-qv")) {
    const PRESETS = [
      { name: "Normal day", q: 5000, mu: 2000, pi: 10 },
      { name: "Busy news day", q: 5000, mu: 2000, pi: 30 },
      { name: "Huge queue", q: 20000, mu: 2000, pi: 10 },
    ];
    const qIn = $("qv-q"), muIn = $("qv-mu"), piIn = $("qv-pi"), kIn = $("qv-k");
    const setPick = buttons("qv-pick", PRESETS.map((p) => p.name), 0, (i) => {
      const p = PRESETS[i]; qIn.value = p.q; muIn.value = p.mu; piIn.value = p.pi; draw();
    });
    // The model: value in ticks per share at position k
    const model = (k, Q, mu, pi) => {
      const a = Math.exp(-k / mu), b = Math.exp(-Q / mu);
      const pf = (1 - pi) * a + pi, ev = 0.5 * (1 - pi) * (a - 2 * b) - 0.5 * pi;
      return { pf, ev, cond: ev / pf };
    };

    const draw = () => {
      const Q = +qIn.value, mu = +muIn.value, pi = +piIn.value / 100;
      kIn.max = Q; if (+kIn.value > Q) kIn.value = Q;
      const k = +kIn.value;
      $("qv-q-out").textContent = num(Q);
      $("qv-mu-out").textContent = num(mu);
      $("qv-pi-out").textContent = piIn.value + "%";
      $("qv-k-out").textContent = num(k);
      const here = model(k, Q, mu, pi), front = model(0, Q, mu, pi), back = model(Q, Q, mu, pi);
      const aStar = 2 * Math.exp(-Q / mu) + (pi < 1 ? pi / (1 - pi) : Infinity);
      const kStar = aStar >= 1 ? 0 : -mu * Math.log(aStar);

      const svg = $("chart-qv");
      const hh = 280, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: 48, r: 14, t: 30, b: 44 };
      const iw = w - pad.l - pad.r, ih = hh - pad.t - pad.b;
      const sx = (x) => pad.l + (x / Q) * iw, sy = (v) => pad.t + ((0.5 - v) / 1) * ih;
      [-0.5, -0.25, 0, 0.25, 0.5].forEach((v) => {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(v), y2: sy(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = signed(v, 2);
      });
      const raw = Q / (narrow ? 4 : 5), mag = 10 ** Math.floor(Math.log10(raw));
      const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
      for (let x = 0; x <= Q + 1e-6; x += step) {
        el("line", { x1: sx(x), x2: sx(x), y1: pad.t, y2: pad.t + ih, class: "grid" }, svg);
        el("text", { x: sx(x), y: pad.t + ih + 18, "text-anchor": "middle" }, svg).textContent = num(x);
      }
      el("text", { x: pad.l + iw / 2, y: hh - 6, "text-anchor": "middle" }, svg).textContent = "Shares ahead of you in the queue";
      el("text", { x: 4, y: 12 }, svg).textContent = "Ticks a share";

      // Break-even line
      if (kStar > 0 && kStar < Q) {
        el("line", { x1: sx(kStar), x2: sx(kStar), y1: pad.t, y2: pad.t + ih, stroke: tone(), "stroke-opacity": 0.5, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
        const right = sx(kStar) < pad.l + iw * 0.7;
        el("text", { x: sx(kStar) + (right ? 5 : -5), y: pad.t + 12, "text-anchor": right ? "start" : "end", style: "fill:var(--tone)" }, svg).textContent = "Break-even";
      }
      // Lines: value if filled (grey, dashed) and expected value (tone)
      const path = (f) => {
        let d = "";
        for (let i = 0; i <= 200; i++) { const x = (i / 200) * Q, v = Math.max(-0.5, Math.min(0.5, f(x))); d += (i ? "L" : "M") + sx(x).toFixed(1) + " " + sy(v).toFixed(1); }
        return d;
      };
      el("path", { d: path((x) => model(x, Q, mu, pi).cond), fill: "none", stroke: grey(), "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
      el("path", { d: path((x) => model(x, Q, mu, pi).ev), fill: "none", stroke: tone(), "stroke-width": 3, "stroke-linecap": "round" }, svg);
      // You
      el("line", { x1: sx(k), x2: sx(k), y1: pad.t, y2: pad.t + ih, stroke: "var(--text)", "stroke-width": 1 }, svg);
      el("circle", { cx: sx(k), cy: sy(Math.max(-0.5, here.cond)), r: 4.5, fill: grey() }, svg);
      el("circle", { cx: sx(k), cy: sy(here.ev), r: 6, fill: tone(), stroke: "var(--bg)", "stroke-width": 2 }, svg);
      const youRight = sx(k) < pad.l + iw * 0.8;
      el("text", { x: sx(k) + (youRight ? 6 : -6), y: pad.t + ih - 8, "text-anchor": youRight ? "start" : "end", style: "fill:var(--text);font-weight:600" }, svg).textContent = "You";

      const box = $("qv-read"); box.textContent = "";
      span(box, "Chance of a fill: " + Math.round(here.pf * 100) + "%");
      span(box, "Value if filled: " + signed(here.cond, 2) + " ticks");
      span(box, "Expected value: " + signed(here.ev, 2) + " ticks a share");
      span(box, kStar <= 0 ? "Break-even: no place in the queue pays" : kStar >= Q ? "Break-even: the whole queue pays" : "Break-even: " + num(kStar) + " shares ahead");
      span(box, "Front minus back: " + (front.ev - back.ev).toFixed(2) + " ticks");

      let story;
      if (kStar <= 0) story = "With sweeps this common, even the front of the queue expects to lose: every sweep fills everyone just before the price drops. A maker here should widen, size down or pull its bid, not just move up the line.";
      else if (k <= kStar * 0.35) story = "You're near the front. Most of your fills come from ordinary selling that doesn't move the price, so you earn close to the half-spread. This is the spot every large-tick market maker is fighting for.";
      else if (k < kStar) story = "You're still on the right side of break-even, but fills are rarer and a bigger share of them come from sweeps. Each extra share ahead of you is worth a little less.";
      else story = "You're behind break-even. Ordinary selling rarely reaches you, so when you are filled it's usually by a sweep that's about to take the price through your level: the grey line is close to minus half a tick. Better to cancel and rejoin later than to wait here.";
      $("qv-story").textContent = story;
    };

    [qIn, muIn, piIn].forEach((x) => x.addEventListener("input", () => { setPick(-1); draw(); }));
    kIn.addEventListener("input", draw);
    onResize("chart-qv", draw);
    H.charts(draw);
  }
})();