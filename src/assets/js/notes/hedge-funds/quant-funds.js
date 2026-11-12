// Interactives for the note "Quant Funds" (Hedge Funds · Strategies).
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
  const money = (v) => (v < 0 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-GB");

  // ---------- Trade the spread ----------
  if ($("chart-sa")) {
    const DAYS = 250, PER_Z = 10000, BREAK_AT = 125, SHIFT = 5;
    let mode = 0, seed = 21;
    const draw = () => {
      const hl = parseFloat($("sa-hl").value), E = parseFloat($("sa-e").value), cost = parseFloat($("sa-c").value);
      $("sa-hl-out").textContent = hl + " days";
      $("sa-e-out").textContent = "±" + E.toFixed(2);
      $("sa-c-out").textContent = money(cost * PER_Z);

      // Ornstein-Uhlenbeck spread in z units, scaled so its long-run standard deviation is 1
      const th = Math.log(2) / hl, sd = Math.sqrt(1 - (1 - th) ** 2);
      const r = rng(seed), z = [0];
      for (let t = 1; t <= DAYS; t++) {
        const mu = mode === 1 && t >= BREAK_AT ? SHIFT : 0;
        z.push(z[t - 1] + th * (mu - z[t - 1]) + sd * normal(r));
      }
      // Trading rule: enter beyond ±E, exit at 0, stop if it moves 2 more against you
      let pos = 0, entry = 0, entryDay = 0, pnl = 0, trades = 0, wins = 0, held = 0, stops = 0, pnlBefore = 0;
      const marks = [];
      for (let t = 1; t <= DAYS; t++) {
        const v = z[t];
        if (pos === 0) {
          if (v >= E) { pos = -1; entry = v; entryDay = t; marks.push({ t, v, k: "in" }); }
          else if (v <= -E) { pos = 1; entry = v; entryDay = t; marks.push({ t, v, k: "in" }); }
        } else {
          const crossed = pos === -1 ? v <= 0 : v >= 0;
          const stopped = pos === -1 ? v >= entry + 2 : v <= entry - 2;
          if (crossed || stopped || t === DAYS) {
            const gain = pos * (v - entry) - cost;
            pnl += gain; if (entryDay < BREAK_AT) pnlBefore += gain; trades++; if (gain > 0) wins++; held += t - entryDay; if (stopped) stops++;
            marks.push({ t, v, k: stopped ? "stop" : "out" });
            pos = 0;
          }
        }
      }

      const svg = $("chart-sa"), w = fit(svg, 280), h = 280;
      const lo = Math.min(-E - 1, ...z), hi = Math.max(E + 1, ...z);
      const yr = [Math.floor(lo), Math.ceil(hi)];
      const yt = []; const ys = yr[1] - yr[0] > 8 ? 2 : 1; for (let v = yr[0]; v <= yr[1]; v += ys) yt.push(v);
      const sc = H.frame(svg, w, h, { l: 36, r: 12, t: 22, b: 40 }, [0, DAYS], yr, w < 420 ? [0, 125, 250] : [0, 50, 100, 150, 200, 250], yt, (v) => (v > 0 ? "+" : "") + v);
      el("text", { x: w - 12, y: h - 6, "text-anchor": "end" }, svg).textContent = "Trading days";
      el("text", { x: 4, y: 12 }, svg).textContent = "Spread z-score";
      [E, -E].forEach((b) => el("line", { x1: sc.sx(0), x2: sc.sx(DAYS), y1: sc.sy(b), y2: sc.sy(b), stroke: grey(), "stroke-width": 1.2, "stroke-dasharray": "6 4" }, svg));
      el("line", { x1: sc.sx(0), x2: sc.sx(DAYS), y1: sc.sy(0), y2: sc.sy(0), stroke: colour("--text-2"), "stroke-width": 1 }, svg);
      if (mode === 1) {
        el("line", { x1: sc.sx(BREAK_AT), x2: sc.sx(BREAK_AT), y1: 22, y2: h - 40, stroke: colour("--text"), "stroke-width": 1, "stroke-dasharray": "2 4" }, svg);
        el("text", { x: sc.sx(BREAK_AT) + 4, y: 34 }, svg).textContent = "relationship breaks";
      }
      const d = z.map((v, t) => (t ? "L" : "M") + sc.sx(t).toFixed(1) + " " + sc.sy(v).toFixed(1)).join("");
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 1.6, "stroke-linejoin": "round" }, svg);
      marks.forEach((m) => {
        const x = sc.sx(m.t), y = sc.sy(m.v);
        if (m.k === "in") el("circle", { cx: x, cy: y, r: 4.5, fill: tone(), stroke: colour("--bg"), "stroke-width": 1.5 }, svg);
        else if (m.k === "out") el("circle", { cx: x, cy: y, r: 4, fill: colour("--bg"), stroke: grey(), "stroke-width": 2 }, svg);
        else el("path", { d: "M" + (x - 4) + " " + (y - 4) + "L" + (x + 4) + " " + (y + 4) + "M" + (x + 4) + " " + (y - 4) + "L" + (x - 4) + " " + (y + 4), stroke: colour("--text"), "stroke-width": 2 }, svg);
      });

      const out = $("sa-read"); out.textContent = "";
      span(out, "Trades: " + trades + (trades ? " (" + wins + " won" + (stops ? ", " + stops + " stopped out" : "") + ")" : ""));
      span(out, "Average holding: " + (trades ? Math.round(held / trades) + " days" : "–"));
      span(out, "Profit after costs: " + money(pnl * PER_Z));

      let story;
      if (mode === 1) story = "Before the break the rule made " + money(pnlBefore * PER_Z) + "; after it, " + money((pnl - pnlBefore) * PER_Z) + ". The spread settled around a new level, and the rule kept shorting it, expecting it to come back to zero" + (stops ? ", getting stopped out " + stops + " time" + (stops > 1 ? "s" : "") : "") + ". This is regime change: the statistics said it must revert, but the economics had changed. Real desks retest relationships constantly and cut pairs that stop behaving.";
      else if (trades === 0) story = "The spread never reached ±" + E.toFixed(2) + ", so the rule never traded. A wider entry means fewer, better trades; too wide and you trade nothing.";
      else {
        story = trades + " trades, " + wins + " winners, " + money(pnl * PER_Z) + " after costs. ";
        if (hl >= 30) story += "With a " + hl + "-day half-life the spread is slow to come back, so there are few trades and each ties up capital for a long time.";
        else if (cost >= 0.4) story += "Costs of " + money(cost * PER_Z) + " a trade eat most of the edge: in stat arb, a strategy that looks great before costs often isn't after them.";
        else if (E <= 1.25) story += "Entering at only ±" + E.toFixed(2) + " gives many trades, but each captures a small move, so costs matter more.";
        else story += "A short half-life means the spread snaps back quickly: many quick trades, each capturing about " + E.toFixed(1) + " points. That's the stat arb ideal. Now try breaking the relationship.";
      }
      $("sa-story").textContent = story;
    };
    choice("sa-mode", ["Relationship holds", "It breaks halfway"], mode, (i) => { mode = i; draw(); });
    ["sa-hl", "sa-e", "sa-c"].forEach((id) => $(id).addEventListener("input", draw));
    $("sa-again").addEventListener("click", () => { seed = (seed * 48271 + 9) % 2147483647; draw(); });
    onResize("chart-sa", draw);
    H.charts(draw);
  }

  // ---------- Find a signal, or fool yourself ----------
  if ($("chart-of")) {
    const LIVE_YEARS = 3, TRUE_SR = 0.5;
    let withReal = 0, seed = 8;
    const draw = () => {
      const N = Math.max(1, Math.round(10 ** parseFloat($("of-n").value))), T = parseFloat($("of-t").value);
      $("of-n-out").textContent = N.toLocaleString("en-GB");
      $("of-t-out").textContent = String(T);

      // Backtested Sharpe of a rule = true Sharpe + noise with standard error 1/sqrt(years)
      const r = rng(seed), sr = [];
      for (let i = 0; i < N; i++) sr.push(normal(r) / Math.sqrt(T));
      const realIdx = withReal && N > 0 ? 0 : -1;
      if (realIdx === 0) sr[0] += TRUE_SR;
      let best = 0; sr.forEach((v, i) => { if (v > sr[best]) best = i; });
      const trueOfBest = best === realIdx ? TRUE_SR : 0;
      const live = trueOfBest + normal(r) / Math.sqrt(LIVE_YEARS);

      const svg = $("chart-of"), w = fit(svg, 260), h = 260;
      const lo = Math.min(-1.5, Math.floor(Math.min(...sr, live) * 2) / 2), hi = Math.max(1.5, Math.ceil(Math.max(...sr, live) * 2) / 2);
      const bw = (hi - lo) > 4 ? 0.2 : 0.1, bins = Math.round((hi - lo) / bw), counts = new Array(bins).fill(0);
      sr.forEach((v) => { counts[Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / bw)))]++; });
      const maxC = Math.max(1, ...counts);
      const yTop = H.niceMax(maxC);
      const ys = yTop > 50 ? Math.ceil(yTop / 5 / 10) * 10 : yTop > 10 ? 5 : yTop > 4 ? 2 : 1;
      const yt = []; for (let v = 0; v <= yTop; v += ys) yt.push(v);
      const xt = []; for (let x = Math.ceil(lo); x <= hi; x += 1) xt.push(x);
      const sc = H.frame(svg, w, h, { l: 36, r: 12, t: 30, b: 40 }, [lo, hi], [0, yTop], xt, yt, (v) => v);
      el("text", { x: w - 12, y: h - 6, "text-anchor": "end" }, svg).textContent = "Sharpe ratio";
      el("text", { x: 4, y: 12 }, svg).textContent = "Number of rules";
      counts.forEach((c, i) => {
        if (!c) return;
        const x0 = lo + i * bw;
        el("rect", { x: sc.sx(x0) + 0.5, y: sc.sy(c), width: Math.max(1, sc.sx(x0 + bw) - sc.sx(x0) - 1), height: sc.sy(0) - sc.sy(c), fill: grey(), "fill-opacity": 0.7 }, svg);
      });
      const mark = (x, label, dash, anchorLeft) => {
        el("line", { x1: sc.sx(x), x2: sc.sx(x), y1: 30, y2: h - 40, stroke: tone(), "stroke-width": 2.2, "stroke-dasharray": dash || "none" }, svg);
        el("text", { x: sc.sx(x) + (anchorLeft ? -5 : 5), y: dash ? 56 : 42, "text-anchor": anchorLeft ? "end" : "start", style: "fill:var(--text);font-weight:600" }, svg).textContent = label;
      };
      const bestLeft = sc.sx(sr[best]) > w - 130;
      mark(sr[best], "best backtest " + sr[best].toFixed(2), null, bestLeft);
      mark(live, "live " + live.toFixed(2), "6 4", sc.sx(live) > w - 90);
      if (realIdx === 0 && best !== 0) {
        el("circle", { cx: sc.sx(sr[0]), cy: sc.sy(0) - 8, r: 6, fill: "none", stroke: colour("--text"), "stroke-width": 2 }, svg);
      }

      const a2 = Math.sqrt(2 * Math.log(Math.max(N, 2)));
      const expectedMax = N > 2 ? (a2 - (Math.log(Math.log(N)) + Math.log(4 * Math.PI)) / (2 * a2)) / Math.sqrt(T) : N === 2 ? 0.56 / Math.sqrt(T) : 0;
      const out = $("of-read"); out.textContent = "";
      span(out, "Best backtest Sharpe: " + sr[best].toFixed(2));
      span(out, "Its true Sharpe: " + trueOfBest.toFixed(1));
      span(out, "Live for 3 years: " + live.toFixed(2));
      span(out, "Typical best from luck alone: about " + expectedMax.toFixed(2));

      let story;
      if (N === 1) story = "Testing a single idea, the backtest is an honest estimate, just a noisy one: with " + T + " years of data it's uncertain by about ±" + (1 / Math.sqrt(T)).toFixed(2) + ".";
      else if (best === realIdx) story = "The real signal won this time, but notice its backtest (" + sr[best].toFixed(2) + ") still overstates its true Sharpe of 0.5: the winner of any contest is usually lucky as well as good.";
      else {
        story = "The best of " + N.toLocaleString("en-GB") + " rules showed a Sharpe of " + sr[best].toFixed(2) + " in the backtest, a result most funds would love. But it had no edge at all, and live it delivered " + live.toFixed(2) + ".";
        if (realIdx === 0) story += " The genuine signal (circled) was beaten by luckier noise and never got chosen.";
        else story += " More rules or fewer years make the fake winner look even better; more years of data shrink the luck.";
      }
      $("of-story").textContent = story;
    };
    choice("of-real", ["All noise", "Add one real signal"], withReal, (i) => { withReal = i; draw(); });
    ["of-n", "of-t"].forEach((id) => $(id).addEventListener("input", draw));
    $("of-again").addEventListener("click", () => { seed = (seed * 48271 + 5) % 2147483647; draw(); });
    onResize("chart-of", draw);
    H.charts(draw);
  }
})();