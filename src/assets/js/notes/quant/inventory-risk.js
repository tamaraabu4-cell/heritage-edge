// Interactives for the note "Inventory Risk" (Quant · Market Making).
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
  const rng = (s) => () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const num = (v) => Math.round(v).toLocaleString("en-GB");
  const usd = (v) => (v < -0.5 ? "−$" : "$") + num(Math.abs(v));
  const niceStep = (span, parts) => {
    const raw = span / parts, mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
  };
  const minutes = (m) => (m < 1 ? Math.round(m * 60) + " seconds" : m < 90 ? m.toFixed(m < 10 ? 1 : 0) + " minutes" : (m / 60).toFixed(1) + " hours");

  // ---------- Hold or pay to exit? ----------
  if ($("chart-hx")) {
    const PRICE = 50;
    const iIn = $("hx-i"), vIn = $("hx-v"), cIn = $("hx-c");
    const TICKS = [[0.1, "6s"], [1, "1m"], [10, "10m"], [60, "1h"], [240, "4h"]];

    const draw = () => {
      const I = +iIn.value, vol = +vIn.value / 100, c = +cIn.value / 100;
      $("hx-i-out").textContent = num(I);
      $("hx-v-out").textContent = (+vIn.value).toFixed(2) + "%";
      $("hx-c-out").textContent = (+cIn.value) + "¢";
      const sig = PRICE * vol;                       // dollars per share per hour
      const risk = (m) => I * sig * Math.sqrt(m / 60);
      const cost = I * c;
      const mStar = 60 * (c / sig) ** 2;

      const svg = $("chart-hx");
      const h = 280, w = fit(svg, h);
      const pad = { l: 60, r: 16, t: 16, b: 40 };
      const LX = Math.log10(240) + 1;                 // x = log10(minutes) + 1, so 6s sits at 0
      const yMax = niceStep(Math.max(risk(240), cost) * 1.1, 4) * 4;
      const s = H.frame(svg, w, h, pad, [0, LX], [0, yMax], [], [0, 1, 2, 3, 4].map((i) => (yMax / 4) * i), (v) => "$" + (v >= 1000 ? (v / 1000) + "k" : v));
      TICKS.forEach(([m, lab]) => {
        const x = s.sx(Math.log10(m) + 1);
        el("line", { x1: x, x2: x, y1: pad.t, y2: h - pad.b, class: "grid" }, svg);
        el("text", { x, y: h - pad.b + 18, "text-anchor": "middle" }, svg).textContent = lab;
      });
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 6, "text-anchor": "middle" }, svg).textContent = "Time held (log scale)";
      el("line", { x1: pad.l, x2: w - pad.r, y1: s.sy(cost), y2: s.sy(cost), stroke: grey(), "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
      let d = "";
      for (let i = 0; i <= 200; i++) { const lx = (i / 200) * LX, m = 10 ** (lx - 1); d += (i ? "L" : "M") + s.sx(lx).toFixed(1) + " " + s.sy(risk(m)).toFixed(1); }
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 2.4 }, svg);
      if (mStar >= 0.1 && mStar <= 240) {
        const x = s.sx(Math.log10(mStar) + 1), y = s.sy(cost);
        el("circle", { cx: x, cy: y, r: 5, fill: tone() }, svg);
        const right = x > w * 0.65;
        el("line", { x1: x, x2: x, y1: y, y2: y - 26, stroke: tone(), "stroke-width": 1 }, svg);
        el("text", { x: x + (right ? -4 : 4), y: y - 30, "text-anchor": right ? "end" : "start", style: "fill:var(--text)" }, svg).textContent = "break-even " + minutes(mStar);
      }

      const box = $("hx-read"); box.textContent = "";
      span(box, "Cost to exit now: " + usd(cost));
      span(box, "One-sigma risk after 1 minute: " + usd(risk(1)) + "; after 1 hour: " + usd(risk(60)));
      span(box, "Break-even holding time: " + minutes(mStar));

      let story;
      if (mStar < 3) story = "In a liquid, normally volatile stock, the risk of holding passes the cost of getting out within a couple of minutes. That's why electronic market makers pass inventory on within seconds, and why they skew hard rather than wait.";
      else if (mStar < 60) story = "A wider spread or a calmer market buys the maker more time: paying to exit costs more, and the risk builds more slowly. It can afford to wait a while for the flow to come back.";
      else story = "With a wide spread and a calm market, holding for hours carries less one-sigma risk than the cost of crossing. That's the world of bond dealers, who warehouse positions for days. But beware: overnight and weekend gaps aren't in this calculation.";
      if (I >= 30000) story += " Notice that the size of the position doesn't change the break-even time, only the size of both lines.";
      $("hx-story").textContent = story;
    };

    [iIn, vIn, cIn].forEach((x) => x.addEventListener("input", draw));
    H.charts(draw);
    onResize("chart-hx", draw);
  }

  // ---------- Path, not the average ----------
  if ($("chart-pa")) {
    const FILLS = 2000, LOT = 100, HALF = 0.02, PRICE = 50, HOURLY = 0.003, HOURS = 6.5;
    const DAYS = [
      { name: "Balanced", tide: 0, buy: 0.5 },
      { name: "Swinging", tide: 0.3, buy: 0.5 },
      { name: "One-sided", tide: 0, buy: 0.42 },
    ];
    let day = 0, seed = 5;
    const lIn = $("pa-l"), pick = $("pa-pick");
    DAYS.forEach((dd, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = dd.name;
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", () => { [...pick.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); day = i; draw(); });
      pick.append(b);
    });

    const draw = () => {
      const L = +lIn.value;
      $("pa-l-out").textContent = num(L);
      const dd = DAYS[day], r = rng(seed * 9973 + day * 101);
      let inv = 0, sum = 0, sumAbs = 0, peak = 0, exits = [], exitCost = 0;
      const path = [{ t: 0, inv: 0 }];
      for (let k = 1; k <= FILLS; k++) {
        // A customer buy (maker sells) or sell (maker buys). On the swinging day, sellers and then
        // buyers come in slow tides (two a day), so the book swings both ways and averages out.
        const pBuy = dd.buy - dd.tide * Math.cos((4 * Math.PI * k) / FILLS);
        const buy = r() < pBuy;
        inv += buy ? -LOT : LOT;
        const t = (k / FILLS) * HOURS;
        if (Math.abs(inv) >= L) {
          path.push({ t, inv });
          const target = Math.sign(inv) * Math.round(L / 2 / LOT) * LOT;
          exitCost += Math.abs(inv - target) * HALF;
          exits.push({ t, inv });
          inv = target;
        }
        path.push({ t, inv });
        sum += inv; sumAbs += Math.abs(inv); peak = Math.max(peak, Math.abs(inv));
      }

      const svg = $("chart-pa");
      const h = 280, w = fit(svg, h);
      const pad = { l: 58, r: 14, t: 16, b: 40 };
      const M = niceStep(L * 1.2, 2) * 2;
      const fmt = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + (Math.abs(v) >= 1000 ? Math.abs(v) / 1000 + "k" : Math.abs(v));
      const s = H.frame(svg, w, h, pad, [0, HOURS], [-M, M], [0, 1, 2, 3, 4, 5, 6], [-M, -M / 2, 0, M / 2, M], fmt);
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 6, "text-anchor": "middle" }, svg).textContent = "Hours into the trading day";
      [L, -L].forEach((y) => el("line", { x1: pad.l, x2: w - pad.r, y1: s.sy(y), y2: s.sy(y), stroke: grey(), "stroke-width": 1.4, "stroke-dasharray": "6 4" }, svg));
      let d = "";
      path.forEach((p, i) => { d += (i ? "L" : "M") + s.sx(p.t).toFixed(1) + " " + s.sy(p.inv).toFixed(1); });
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 1.5, "stroke-linejoin": "round" }, svg);
      exits.forEach((e) => el("circle", { cx: s.sx(e.t), cy: s.sy(e.inv), r: 3.5, fill: grey() }, svg));

      const avg = sum / FILLS, avgAbs = sumAbs / FILLS;
      const earned = FILLS * LOT * HALF;
      const box = $("pa-read"); box.textContent = "";
      span(box, "Average inventory: " + fmt(Math.round(avg / 100) * 100) + " shares");
      span(box, "Average absolute inventory: " + num(avgAbs) + " (one-sigma risk ≈ " + usd(avgAbs * PRICE * HOURLY) + " an hour)");
      span(box, "Peak: " + num(peak) + " shares");
      span(box, "Forced exits: " + exits.length + ", costing " + usd(exitCost) + " against " + usd(earned) + " of spread earned");

      let story;
      if (day === 0) story = "Balanced flow: the average is close to zero, but the absolute inventory isn't, because random flow wanders. Tighten the limit and watch the forced exits start to eat into the spread.";
      else if (day === 1) story = "Swinging flow: sellers and then buyers arrive in slow tides, so the book swings far each way. The average can still look nearly flat, which is exactly Deltashark's trap: the risk is in the swings, and that's what the average absolute inventory and the peak show.";
      else story = "One-sided flow: the book keeps filling on one side and hits the limit again and again. Each forced exit pays the half-spread, so the limit is doing its job but the day's revenue drains away. This is where skewing earns its keep.";
      if (exitCost > earned * 0.5) story += " Here the forced exits cost more than half of everything the spread earned.";
      $("pa-story").textContent = story;
    };

    lIn.addEventListener("input", draw);
    $("pa-again").addEventListener("click", () => { seed += 1; draw(); });
    H.charts(draw);
    onResize("chart-pa", draw);
  }
})();