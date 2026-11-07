// Charts for the note "Algorithmic Execution" (Markets · How Markets Work).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, frame, tex, colour, niceMax } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const n0 = (v) => Math.round(v).toLocaleString("en-GB");
  const k0 = (v) => n0(v).replace(/,/g, "{,}");

  // Small helper: a row of toggle buttons
  const buttons = (boxId, items, onPick, start) => {
    const box = $(boxId);
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = it.n;
      b.setAttribute("aria-pressed", i === start ? "true" : "false");
      b.addEventListener("click", () => {
        [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
        onPick(i);
      });
      box.appendChild(b);
    });
  };

  // ---------- How much does size cost? (square-root law) ----------
  if (has("chart-impact")) {
    const imp = (q, s) => s * Math.sqrt(q) * 10000; // q as a fraction of ADV, s as a fraction → bp
    const draw = () => {
      const qp = parseInt($("imp-q").value, 10), sp = parseFloat($("imp-s").value);
      $("imp-q-out").textContent = qp + "%";
      $("imp-s-out").textContent = (sp % 1 ? sp.toFixed(1) : sp) + "%";
      const q = qp / 100, s = sp / 100, t = tone(), g = grey(), c = card();
      const top = niceMax(imp(0.5, s) * 1.1);
      const svg = $("chart-impact"), W = 640, Ht = 290, pad = { l: 56, r: 24, t: 16, b: 38 };
      const f = frame(svg, W, Ht, pad, [0, 50], [0, top], [], [0, top / 4, top / 2, (3 * top) / 4, top], (y) => Math.round(y) + " bp");
      [0, 10, 20, 30, 40, 50].forEach((x) => {
        el("text", { x: f.sx(x), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = x + "%";
      });
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "order as a share of ADV";

      // Straight-line comparison, matched at 1% of ADV and clipped at the top
      const base = imp(0.01, s), xEnd = Math.min(50, top / base);
      el("line", { x1: f.sx(0), y1: f.sy(0), x2: f.sx(xEnd), y2: f.sy(base * xEnd), stroke: g, "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);

      // Square-root curve
      let d = "";
      for (let x = 0; x <= 50.001; x += 0.5) d += (x ? "L" : "M") + f.sx(x).toFixed(1) + "," + f.sy(imp(x / 100, s)).toFixed(1);
      el("path", { d, fill: "none", stroke: t, "stroke-width": 3, "stroke-linecap": "round" }, svg);

      const now = imp(q, s);
      el("circle", { cx: f.sx(qp), cy: f.sy(now), r: 7, fill: t, stroke: c, "stroke-width": 2 }, svg);
      el("text", { x: f.sx(qp) + (qp > 40 ? -12 : 12), y: f.sy(now) + (qp > 40 ? -14 : 24), "text-anchor": qp > 40 ? "end" : "start", style: "fill:" + t }, svg).textContent = Math.round(now) + " bp per share";

      const out = $("imp-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Impact} \\approx " + s.toFixed(3) + " \\times \\sqrt{" + q.toFixed(2) + "} = " + Math.round(now) + "\\text{ bp}");
      tex(b, "\\text{4} \\times \\text{ the size: } " + Math.round(imp(Math.min(q * 4, 2), s)) + "\\text{ bp per share}");
      const small = q / 4;
      $("imp-story").textContent = qp >= 25
        ? "At " + qp + "% of a day's volume, the order is a big slice of the whole market, and each share costs about " + Math.round(now) + " bp of impact. This is where funds spread trading over several days."
        : "An order a quarter of this size (" + (small * 100).toFixed(1).replace(/\.0$/, "") + "% of ADV) would cost about " + Math.round(imp(small, s)) + " bp per share: half as much, not a quarter. The dashed line shows how much worse it would be if impact grew in a straight line.";
    };
    $("imp-q").addEventListener("input", draw);
    $("imp-s").addEventListener("input", draw);
    H.charts(draw);
  }

  // ---------- Fast or slow? ----------
  if (has("chart-speed")) {
    const K = 40;      // impact (bp) if the order is done in one hour; falls with 1/sqrt(hours)
    const SIG_H = 78;  // a share moving ~2% a day: about 78 bp per sqrt(hour)
    const WHY = [
      { n: "Routine rebalance", d: 0 },
      { n: "Mild view", d: 4 },
      { n: "Strong view before news", d: 12 },
    ];
    let why = 0;
    const impact = (T) => K / Math.sqrt(T);
    const waiting = (T, d) => (d * T) / 2; // on average half the order waits half the time
    const draw = () => {
      const T = parseFloat($("fs-t").value), d = WHY[why].d;
      $("fs-t-out").textContent = (T % 1 ? T.toFixed(2).replace(/0$/, "") : T) + " h";
      const t = tone(), g = grey(), c = card();
      const svg = $("chart-speed"), W = 640, Ht = 300, pad = { l: 56, r: 24, t: 16, b: 38 };
      const f = frame(svg, W, Ht, pad, [0, 6.5], [0, 80], [], [0, 20, 40, 60, 80], (y) => y + " bp");
      [0, 1, 2, 3, 4, 5, 6].forEach((x) => {
        el("text", { x: f.sx(x), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = x + "h";
      });
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "hours to finish the order";

      const path = (fn, attrs) => {
        let p = "", first = true;
        for (let x = 0.5; x <= 6.501; x += 0.05) {
          const y = Math.min(80, fn(x));
          p += (first ? "M" : "L") + f.sx(x).toFixed(1) + "," + f.sy(y).toFixed(1);
          first = false;
        }
        el("path", Object.assign({ d: p, fill: "none" }, attrs), svg);
      };
      path(impact, { stroke: g, "stroke-width": 2, "stroke-dasharray": "6 4" });
      if (d) path((x) => waiting(x, d), { stroke: g, "stroke-width": 2, "stroke-dasharray": "2 4" });
      const total = (x) => impact(x) + waiting(x, d);
      path(total, { stroke: t, "stroke-width": 3, "stroke-linecap": "round" });

      // Cheapest point
      const tBest = d ? Math.min(6.5, Math.pow((K / 2) / (d / 2), 2 / 3)) : 6.5;
      el("line", { x1: f.sx(tBest), x2: f.sx(tBest), y1: f.sy(0), y2: f.sy(80), stroke: g, "stroke-dasharray": "4 4" }, svg);
      el("text", { x: f.sx(tBest) + (tBest > 5 ? -6 : 6), y: f.sy(74), "text-anchor": tBest > 5 ? "end" : "start", style: "fill:" + g }, svg).textContent = "cheapest: " + tBest.toFixed(1) + "h";

      const tot = total(T);
      el("circle", { cx: f.sx(T), cy: f.sy(Math.min(80, tot)), r: 7, fill: t, stroke: c, "stroke-width": 2 }, svg);

      const risk = SIG_H * Math.sqrt(T / 3);
      const out = $("fs-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Impact } " + impact(T).toFixed(0) + " + \\text{waiting } " + waiting(T, d).toFixed(0) + " = " + tot.toFixed(0) + "\\text{ bp expected}");
      tex(b, "\\text{Timing risk: } \\pm " + risk.toFixed(0) + "\\text{ bp}");
      let story;
      if (!d) story = "With no reason for the price to run away, waiting costs nothing on average, so slower is always cheaper. But the timing risk grows: over " + T + " hours the final cost could easily land " + risk.toFixed(0) + " bp better or worse than expected. That's why even patient orders don't drag on for days.";
      else if (Math.abs(T - tBest) < 0.4) story = "About right. Going faster would add more impact than it saves in waiting; going slower would let the price drift away by more than the impact you save.";
      else if (T < tBest) story = "Too fast: you're paying " + impact(T).toFixed(0) + " bp of impact to save waiting costs that aren't that big. Slow down towards " + tBest.toFixed(1) + " hours.";
      else story = "Too slow: the price is drifting away from you while you wait. Speed up towards " + tBest.toFixed(1) + " hours. This is the job an implementation shortfall algo does automatically.";
      $("fs-story").textContent = story;
    };
    buttons("fs-why", WHY, (i) => { why = i; draw(); }, 0);
    $("fs-t").addEventListener("input", draw);
    H.charts(draw);
  }

  // ---------- One order, four schedules ----------
  if (has("chart-schedule")) {
    const ORDER = 120000;
    const PROFILE = [0.30, 0.15, 0.10, 0.10, 0.15, 0.20];
    const EXPECTED = PROFILE.map((p) => p * 1200000);
    const DAYS = [
      { n: "Normal day", v: EXPECTED },
      { n: "Quiet afternoon", v: EXPECTED.map((v, i) => (i >= 3 ? v / 2 : v)) },
    ];
    const ALGOS = [
      { n: "TWAP", plan: () => PROFILE.map(() => ORDER / 6) },
      { n: "VWAP", plan: () => PROFILE.map((p) => p * ORDER) },
      { n: "POV 10%", plan: (vol) => vol.map((v) => 0.1 * v) },
      { n: "Implementation shortfall", plan: () => [60000, 30000, 15000, 7500, 4500, 3000] },
    ];
    let algo = 1, day = 0;
    const draw = () => {
      const vol = DAYS[day].v, mine = ALGOS[algo].plan(vol);
      const t = tone(), g = grey();
      const svg = $("chart-schedule"), W = 640, Ht = 310, pad = { l: 64, r: 16, t: 26, b: 38 };
      const f = frame(svg, W, Ht, pad, [0, 6], [0, 400000], [], [0, 100000, 200000, 300000, 400000], (y) => (y ? y / 1000 + "k" : "0"));
      const bw = 56;
      vol.forEach((v, i) => {
        const cx = f.sx(i + 0.5), m = mine[i], share = m / v;
        el("rect", { x: cx - bw / 2, y: f.sy(v), width: bw, height: f.sy(0) - f.sy(v), rx: 4, fill: g, "fill-opacity": 0.3 }, svg);
        el("rect", { x: cx - bw / 2, y: f.sy(m), width: bw, height: f.sy(0) - f.sy(m), rx: 4, fill: t }, svg);
        el("text", { x: cx, y: f.sy(v) - 8, "text-anchor": "middle", style: share > 0.125 ? "fill:" + t + ";font-weight:600" : "" }, svg).textContent = (share * 100).toFixed(0) + "%";
        el("text", { x: cx, y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = "hour " + (i + 1);
      });
      el("text", { x: W - pad.r, y: 14, "text-anchor": "end" }, svg).textContent = "% = your share of that hour's volume";

      const done = mine.reduce((a, b) => a + b, 0), left = Math.max(0, ORDER - done);
      const peak = Math.max(...mine.map((m, i) => m / vol[i]));
      const out = $("sch-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Bought: } " + k0(done) + (left ? "\\quad \\text{Unfilled: } " + k0(left) : ""));
      tex(b, "\\text{Highest share of an hour: } " + (peak * 100).toFixed(0) + "\\%");

      const stories = [
        ["Equal slices every hour. It's simple, but in the quiet middle of the day the same 20,000 shares are 17% of the market, which is easy for others to notice.",
         "Still 20,000 an hour, so in the quiet afternoon it becomes a third of all trading. That's a footprint other traders will spot and trade ahead of."],
        ["Slices follow the usual volume pattern, so you're always about 10% of the market: you blend in with the average share traded.",
         "VWAP trades to the forecast, so when the afternoon turns quiet it suddenly becomes 20% of each hour. The forecast was wrong, and the algo stands out."],
        ["Takes 10% of whatever actually trades. On a normal day it ends up just like VWAP.",
         "Stays at exactly 10% even in the quiet afternoon, so it never stands out. The cost: only 93,000 shares get bought, and 27,000 are still left at the end of the window."],
        ["Half the order in the first hour, then slowing down. It's done early, so the price has little time to run away, but taking 17% of the busiest hour costs more impact.",
         "Front-loading means most of the order was done before the afternoon went quiet, so the quiet hours barely matter."],
      ];
      $("sch-story").textContent = stories[algo][day];
    };
    buttons("sch-algo", ALGOS, (i) => { algo = i; draw(); }, 1);
    buttons("sch-day", DAYS, (i) => { day = i; draw(); }, 0);
    H.charts(draw);
  }
})();