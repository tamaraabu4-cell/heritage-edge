// Interactives for the note "Relative Value" (Hedge Funds · Strategies).
// All charts are drawn at their real width, so the labels stay readable on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, colour } = H;
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

  const fit = (svg, h) => {
    const w = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
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
      b.type = "button"; b.textContent = it.n;
      b.setAttribute("aria-pressed", i === start ? "true" : "false");
      b.addEventListener("click", () => { [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); onPick(i); });
      box.append(b);
    });
  };
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const signed = (v, dp) => {
    const r = Number(v.toFixed(dp));
    return (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r).toFixed(dp);
  };
  const line = (svg, pts, stroke, width, dash, opacity) => {
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
    return el("path", { d, fill: "none", stroke, "stroke-width": width, "stroke-dasharray": dash || "none", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-opacity": opacity || 1 }, svg);
  };
  const cross = (svg, x, y, stroke) => el("path", { d: "M" + (x - 4) + " " + (y - 4) + "L" + (x + 4) + " " + (y + 4) + "M" + (x + 4) + " " + (y - 4) + "L" + (x - 4) + " " + (y + 4), stroke, "stroke-width": 2 }, svg);

  // ---------- Convergence or catastrophe? ----------
  if ($("chart-cv-s")) {
    const WEEKS = 52, S0 = 0.5;
    const PATHS = [
      { n: "Calm", peak: S0, at: 0 },
      { n: "Wobble", peak: 1.0, at: 16 },
      { n: "Crisis", peak: 2.5, at: 18 },
    ];
    let pi = 1;
    const spreadAt = (p, t) => {
      if (p.peak <= S0) return S0 * (1 - t / WEEKS);
      if (t <= p.at) return S0 + (p.peak - S0) * Math.sin((Math.PI * t) / (2 * p.at)) ** 2;
      return p.peak * Math.cos((Math.PI * (t - p.at)) / (2 * (WEEKS - p.at))) ** 2;
    };

    const draw = () => {
      const L = parseFloat($("cv-lev").value), lim = parseFloat($("cv-lim").value);
      $("cv-lev-out").textContent = L + "×";
      $("cv-lim-out").textContent = lim + "%";
      const p = PATHS[pi];
      const s = [], held = [], got = [];
      let forced = -1;
      for (let t = 0; t <= WEEKS; t++) {
        s.push(spreadAt(p, t));
        const e = Math.max(0, 100 + L * (S0 - s[t]));
        held.push(e);
        if (forced < 0 && e <= 100 - lim) forced = t;
        got.push(forced >= 0 ? held[forced] : e);
      }
      const xt = [0, 3, 6, 9, 12], mo = (t) => (t * 12) / WEEKS;

      // Spread panel
      const ss = $("chart-cv-s"), w = fit(ss, 170);
      const sTop = p.peak > 1.5 ? Math.ceil(p.peak) : 1.0, sStep = sTop > 1.5 ? 1 : 0.5;
      const sTicks = []; for (let v = 0; v <= sTop + 1e-9; v += sStep) sTicks.push(Number(v.toFixed(1)));
      const pad = { l: 46, r: 12, t: 22, b: 30 };
      const a = H.frame(ss, w, 170, pad, [0, 12], [0, sTop], xt, sTicks, (v) => v.toFixed(1) + "%");
      el("text", { x: 4, y: 12 }, ss).textContent = "The gap between the bonds";
      line(ss, s.map((v, t) => [a.sx(mo(t)), a.sy(v)]), tone(), 2.5);
      if (forced >= 0) cross(ss, a.sx(mo(forced)), a.sy(s[forced]), grey());

      // Capital panel
      const es = $("chart-cv-e"); fit(es, 230);
      const lo = Math.min(...held, 100 - lim), hi = Math.max(...held, 100);
      const yr = [Math.max(0, Math.floor((lo - 5) / 20) * 20), Math.ceil((hi + 5) / 20) * 20];
      const yt = []; for (let y = yr[0]; y <= yr[1]; y += 20) yt.push(y);
      const b = H.frame(es, w, 230, { l: 46, r: 12, t: 22, b: 40 }, [0, 12], yr, xt, yt, (v) => "$" + v);
      el("text", { x: 4, y: 12 }, es).textContent = "Your capital (started at $100)";
      el("text", { x: w - 12, y: 230 - 6, "text-anchor": "end" }, es).textContent = "Months";
      const th = 100 - lim;
      el("line", { x1: 46, x2: w - 12, y1: b.sy(th), y2: b.sy(th), stroke: grey(), "stroke-width": 1.2, "stroke-dasharray": "5 4" }, es);
      el("text", { x: w - 16, y: b.sy(th) - 6, "text-anchor": "end" }, es).textContent = "lenders force a sale";
      if (forced >= 0) line(es, held.map((v, t) => [b.sx(mo(t)), b.sy(v)]), grey(), 2, "6 5");
      line(es, got.map((v, t) => [b.sx(mo(t)), b.sy(v)]), tone(), 2.5);
      if (forced >= 0) cross(es, b.sx(mo(forced)), b.sy(got[forced]), tone());

      const worst = Math.min(...held), endHeld = held[WEEKS], endGot = got[WEEKS];
      const out = $("cv-read"); out.textContent = "";
      span(out, "Widest gap: " + p.peak.toFixed(2) + "%");
      span(out, "Worst point if held: " + signed(worst - 100, 1) + "%");
      span(out, "End of year if held: " + signed(endHeld - 100, 1) + "%");
      span(out, "What you actually got: " + signed(endGot - 100, 1) + "%");

      let story;
      if (forced >= 0) {
        const month = Math.max(1, Math.round(forced / 4.33));
        story = "Forced out in month " + month + " with a loss of " + (100 - endGot).toFixed(1) + "%. The gap did close by the end of the year: holding on would have made " + signed(endHeld - 100, 1) + "%. You were right about the trade, and it didn't matter.";
        story += " Try less leverage: at " + Math.max(1, Math.ceil(lim / (p.peak - S0)) - 1) + "× or below you'd have survived this year.";
      } else if (worst < 100 - 0.5) {
        story = "You survived a dip to " + signed(worst - 100, 1) + "% and finished " + signed(endHeld - 100, 1) + "%. The lenders' limit was " + lim + "%, so the wobble never forced a sale. With more leverage, or a tighter limit, the same year would have ended differently.";
      } else {
        story = "The gap closed smoothly: " + L + "× leverage on a " + S0.toFixed(2) + "% gap earned " + signed(endHeld - 100, 1) + "%. This is the year relative value funds hope for, and the reason they borrow.";
      }
      if (p.peak >= 2 && L >= 25) story += " LTCM ran at roughly 25× when its spreads blew out in 1998.";
      $("cv-story").textContent = story;
    };
    choice("cv-path", PATHS, pi, (i) => { pi = i; draw(); });
    ["cv-lev", "cv-lim"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-cv-s", draw);
    H.charts(draw);
  }

  // ---------- Inside a convertible ----------
  if ($("chart-cb")) {
    const FACE = 100, CPN = 3, T = 3, Y = 0.06, R = 0.04, N = 2, K = 50;
    let floor = FACE / (1 + Y) ** T;
    for (let t = 1; t <= T; t++) floor += CPN / (1 + Y) ** t;
    const ncdf = (x) => {
      const t = 1 / (1 + 0.2316419 * Math.abs(x));
      const d = 0.3989422804 * Math.exp((-x * x) / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x >= 0 ? 1 - p : p;
    };
    const call = (S, v) => {
      const d1 = (Math.log(S / K) + (R + (v * v) / 2) * T) / (v * Math.sqrt(T)), d2 = d1 - v * Math.sqrt(T);
      return { c: S * ncdf(d1) - K * Math.exp(-R * T) * ncdf(d2), delta: ncdf(d1) };
    };
    const cb = (S, v) => floor + N * call(S, v).c;

    const draw = () => {
      const S = parseFloat($("cb-s").value), v = parseFloat($("cb-v").value) / 100;
      $("cb-s-out").textContent = "$" + S;
      $("cb-v-out").textContent = Math.round(v * 100) + "%";

      const svg = $("chart-cb"), w = fit(svg, 300), h = 300;
      const pad = { l: 46, r: 14, t: 22, b: 40 };
      const sc = H.frame(svg, w, h, pad, [10, 100], [0, 220], w < 420 ? [25, 50, 75, 100] : [10, 25, 40, 55, 70, 85, 100], [0, 50, 100, 150, 200], (y) => "$" + y);
      el("text", { x: w - pad.r, y: h - 6, "text-anchor": "end" }, svg).textContent = "Share price ($)";
      el("text", { x: 4, y: 12 }, svg).textContent = "Value of one bond";

      line(svg, [[sc.sx(10), sc.sy(floor)], [sc.sx(100), sc.sy(floor)]], grey(), 1.5, "6 5");
      line(svg, [[sc.sx(10), sc.sy(N * 10)], [sc.sx(100), sc.sy(N * 100)]], grey(), 1.5);
      el("text", { x: sc.sx(12), y: sc.sy(floor) + 16 }, svg).textContent = "bond floor";
      el("text", { x: sc.sx(80), y: sc.sy(N * 80) + 22, "text-anchor": "start" }, svg).textContent = "convert now";
      const pts = []; for (let x = 10; x <= 100; x += 1) pts.push([sc.sx(x), sc.sy(cb(x, v))]);
      line(svg, pts, tone(), 2.6);

      const now = cb(S, v), d = call(S, v).delta, slope = N * d;
      const x1 = Math.max(10, S - 14), x2 = Math.min(100, S + 14);
      line(svg, [[sc.sx(x1), sc.sy(now + slope * (x1 - S))], [sc.sx(x2), sc.sy(now + slope * (x2 - S))]], colour("--text"), 1.4, "3 4");
      el("circle", { cx: sc.sx(S), cy: sc.sy(now), r: 5.5, fill: tone(), stroke: colour("--bg"), "stroke-width": 2 }, svg);

      // Gamma test: shares jump 10% either way, hedge held fixed
      const up = cb(S * 1.1, v) - now - slope * S * 0.1, down = cb(S * 0.9, v) - now + slope * S * 0.1;
      const premium = now / (N * S) - 1;
      const out = $("cb-read"); out.textContent = "";
      span(out, "Convertible $" + now.toFixed(2) + " (converting gives $" + (N * S).toFixed(0) + ")");
      span(out, "Delta " + d.toFixed(2) + ": short " + Math.round(1000 * slope).toLocaleString("en-GB") + " shares per 1,000 bonds");
      span(out, "Shares +10%: hedged position " + signed(1000 * up, 0).replace(/^([+−])/, "$1$") + " per 1,000 bonds");
      span(out, "Shares −10%: hedged position " + signed(1000 * down, 0).replace(/^([+−])/, "$1$") + " per 1,000 bonds");

      let story;
      if (d < 0.25) story = "Far below the $50 conversion price, the convertible behaves like a bond: it sits near its $" + floor.toFixed(0) + " floor, the delta is small and you short few shares. Here the risk is the company's credit, not its shares.";
      else if (d > 0.85) story = "Well above the conversion price, the convertible behaves like the shares themselves: it's worth about the same as converting, the delta is close to 1, and there's little curve left to trade.";
      else story = "This is the convertible arbitrageur's sweet spot: the curve bends most here, so the hedged position makes money whether the shares jump up or down. That's gamma at work.";
      story += " The premium over converting now is " + (premium * 100).toFixed(0) + "%.";
      if (v >= 0.5) story += " Higher volatility makes the option, and so the convertible, worth more: if you bought at a lower implied volatility, the shares moving this much is your profit.";
      else if (v <= 0.2) story += " At low volatility the option is cheap and the gamma profits are small; this is when the coupon does most of the work.";
      $("cb-story").textContent = story;
    };
    ["cb-s", "cb-v"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-cb", draw);
    H.charts(draw);
  }
})();