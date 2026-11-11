// Interactives for the note "Alpha, Beta and What Goes Wrong" (Hedge Funds · Strategies).
// Both charts are drawn at their real width, so the labels stay readable on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour } = H;
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
  const sign = (v) => (v > 0 ? "+" : v < 0 ? "−" : "");
  const pct = (v, dp) => sign(Math.round(v * 10 ** (dp || 0)) / 10 ** (dp || 0)) + Math.abs(v).toFixed(dp === undefined ? 1 : dp) + "%";
  const plain = (v, dp) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(dp === undefined ? 1 : dp);
  const texNum = (v, dp) => (v < 0 ? "-" : "") + Math.abs(v).toFixed(dp === undefined ? 1 : dp);

  // Horizontal bars around a zero line: rows = [{ n, v, total }]
  const bars = (svg, w, rows, fmt) => {
    const t = tone(), g = grey();
    const lab = w < 480 ? 116 : 170, padR = w < 480 ? 50 : 64, top = 8, rowH = 32;
    const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.v)));
    const half = (w - lab - 2 * padR) / 2, x0 = lab + padR + half;
    const sx = (v) => x0 + (v / maxAbs) * half;
    el("line", { x1: x0, x2: x0, y1: top - 2, y2: top + rows.length * rowH, stroke: colour("--text-2"), "stroke-width": 1 }, svg);
    rows.forEach((r, i) => {
      const y = top + i * rowH, strong = r.total;
      el("text", { x: 4, y: y + 20, style: strong ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = r.n;
      const a = Math.min(sx(0), sx(r.v)), b = Math.max(sx(0), sx(r.v));
      if (Math.abs(r.v) > 1e-9) el("rect", { x: a, y: y + 6, width: Math.max(1.5, b - a), height: 20, rx: 3, fill: r.v >= 0 ? t : g, "fill-opacity": strong ? 1 : 0.8 }, svg);
      el("text", { x: r.v >= 0 ? sx(r.v) + 6 : sx(r.v) - 6, y: y + 20, "text-anchor": r.v >= 0 ? "start" : "end", style: strong ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = fmt(r.v);
    });
    return top + rows.length * rowH + 6;
  };

  // ---------- Peel the return ----------
  if ($("chart-pr")) {
    const IDS = ["tot", "mkt", "net", "short", "rate", "fac"];
    const draw = () => {
      const v = {};
      IDS.forEach((k) => { v[k] = parseFloat($("pr-" + k).value); });
      $("pr-tot-out").textContent = plain(v.tot, 0) + "%";
      $("pr-mkt-out").textContent = plain(v.mkt, 0) + "%";
      $("pr-net-out").textContent = v.net + "%";
      $("pr-short-out").textContent = v.short + "%";
      $("pr-rate-out").textContent = (v.rate % 1 ? v.rate.toFixed(1) : v.rate) + "%";
      $("pr-fac-out").textContent = plain(v.fac, v.fac % 1 ? 1 : 0) + "%";

      const fromMkt = (v.net / 100) * v.mkt, fromReb = (v.short / 100) * v.rate, fromFac = v.fac;
      const alpha = v.tot - fromMkt - fromReb - fromFac;
      const rows = [
        { n: "Fund's return", v: v.tot, total: true },
        { n: "From the market", v: fromMkt },
        { n: "From the rebate", v: fromReb },
        { n: "From factor tilts", v: fromFac },
        { n: "Alpha (what's left)", v: alpha, total: true },
      ];
      const svg = $("chart-pr"), w = fit(svg, 200);
      const used = bars(svg, w, rows, (x) => pct(x, 1));
      svg.setAttribute("viewBox", "0 0 " + w + " " + used);

      const out = $("pr-read"); out.textContent = "";
      const a = document.createElement("span"); out.append(a);
      tex(a, "\\alpha = " + texNum(v.tot, 0) + "\\% - " + (v.net / 100).toFixed(2) + " \\times " + (v.mkt < 0 ? "(" + texNum(v.mkt, 0) + "\\%)" : texNum(v.mkt, 0) + "\\%") +
        " - " + (v.short / 100).toFixed(2) + " \\times " + texNum(v.rate, 1) + "\\% - " + (v.fac < 0 ? "(" + texNum(v.fac, 1) + "\\%)" : texNum(v.fac, 1) + "\\%") + " = " + texNum(alpha, 1) + "\\%");

      const share = v.tot > 0 ? Math.round((alpha / v.tot) * 100) : null;
      let story;
      if (alpha < -0.05) story = "Once the parts anyone could buy cheaply are taken away, the manager subtracted " + plain(-alpha) + "% a year. An index fund, cash and a factor ETF in the same proportions would have done better, for a fraction of the fee.";
      else if (alpha < 0.5) story = "Almost nothing is left: the " + pct(v.tot, 0) + " is explained by market exposure, interest on cash and style. The investor paid hedge fund fees for things available far more cheaply.";
      else if (share !== null && share < 50) story = "Only " + pct(alpha) + " of the " + pct(v.tot, 0) + " is skill, about " + share + "% of the return. The rest came from the wind and the current. An allocator would judge the manager on the " + pct(alpha) + ".";
      else story = "Most of this return is alpha: " + pct(alpha) + " survives after the market, the rebate and factor tilts are taken out. That's what allocators look for, though one year proves little on its own (the next interactive shows why).";
      if (v.short > 0 && v.rate >= 3 && fromReb >= 1) story += " Note the rebate: " + pct(fromReb) + " just from interest on the short sale cash.";
      $("pr-story").textContent = story;
    };
    IDS.forEach((k) => $("pr-" + k).addEventListener("input", draw));
    onResize("chart-pr", draw);
    H.charts(draw);
  }

  // ---------- Skill or wind? ----------
  if ($("chart-sw")) {
    const N = 36;
    let seed = 7;
    // Small seeded random generator, so "Run again" gives a new but repeatable history
    const rng = (s) => () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

    const draw = () => {
      const bT = parseFloat($("sw-b").value), aT = parseFloat($("sw-a").value), noise = parseFloat($("sw-n").value);
      $("sw-b-out").textContent = bT.toFixed(1);
      $("sw-a-out").textContent = plain(aT, 0) + "%/yr";
      $("sw-n-out").textContent = (noise % 1 ? noise.toFixed(1) : noise) + "%/mo";

      // Market months and luck are drawn from the same seed, so moving a slider changes only what it controls
      const r = rng(seed), pts = [];
      for (let i = 0; i < N; i++) {
        const m = Math.max(-12, Math.min(12, 0.8 + 4.5 * normal(r)));
        const e = normal(r);
        pts.push({ m, f: aT / 12 + bT * m + noise * e });
      }
      const mx = pts.reduce((t, p) => t + p.m, 0) / N, fy = pts.reduce((t, p) => t + p.f, 0) / N;
      let sxx = 0, sxy = 0, syy = 0;
      pts.forEach((p) => { sxx += (p.m - mx) ** 2; sxy += (p.m - mx) * (p.f - fy); syy += (p.f - fy) ** 2; });
      const bE = sxy / sxx, aE = fy - bE * mx;
      const sse = pts.reduce((t, p) => t + (p.f - aE - bE * p.m) ** 2, 0);
      const r2 = syy > 0 ? 1 - sse / syy : 0;
      const s = Math.sqrt(sse / (N - 2)), seA = s * Math.sqrt(1 / N + (mx * mx) / sxx);
      const aY = aE * 12, band = 2 * seA * 12;

      const svg = $("chart-sw"), w = fit(svg, 300), h = 300;
      const lo = Math.min(-5, ...pts.map((p) => p.f)), hi = Math.max(5, ...pts.map((p) => p.f));
      const step = hi - lo > 30 ? 10 : 5;
      const yr = [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
      const yt = []; for (let y = yr[0]; y <= yr[1]; y += step) yt.push(y);
      const pad = { l: 40, r: 14, t: 22, b: 40 };
      const sc = H.frame(svg, w, h, pad, [-12, 12], yr, w < 420 ? [-10, 0, 10] : [-10, -5, 0, 5, 10], yt, (y) => y);
      el("text", { x: w - pad.r, y: h - 6, "text-anchor": "end" }, svg).textContent = "Market's month (%)";
      el("text", { x: pad.l - 34, y: 12 }, svg).textContent = "Fund's month (%)";

      // Clip lines to the plot area
      const clipId = "sw-clip";
      const defs = el("defs", {}, svg), cp = el("clipPath", { id: clipId }, defs);
      el("rect", { x: pad.l, y: pad.t, width: w - pad.l - pad.r, height: h - pad.t - pad.b }, cp);
      const g = el("g", { "clip-path": "url(#" + clipId + ")" }, svg);
      const gl = (a, b, stroke, width, dash) => {
        el("line", { x1: sc.sx(-12), y1: sc.sy(a - 12 * b), x2: sc.sx(12), y2: sc.sy(a + 12 * b), stroke, "stroke-width": width, "stroke-dasharray": dash || "none", "stroke-linecap": "round" }, g);
      };
      gl(aT / 12, bT, grey(), 2, "6 5");
      pts.forEach((p) => el("circle", { cx: sc.sx(p.m), cy: sc.sy(p.f), r: 4, fill: tone(), "fill-opacity": 0.35, stroke: tone(), "stroke-width": 1 }, g));
      gl(aE, bE, tone(), 2.5);

      const out = $("sw-read"); out.textContent = "";
      const x = document.createElement("span"), y = document.createElement("span"); out.append(x, y);
      tex(x, "\\text{Estimated } \\beta = " + bE.toFixed(2) + " \\quad \\alpha = " + texNum(aY, 1) + "\\%\\text{/yr} \\quad R^2 = " + r2.toFixed(2));
      tex(y, "\\text{Truth: } \\beta = " + bT.toFixed(1) + " \\quad \\alpha = " + texNum(aT, 0) + "\\%\\text{/yr}");

      let story = "The line found alpha of " + pct(aY) + " a year against a true " + pct(aT, 0) + ". With this much luck, an estimate from three years could easily be off by about " + band.toFixed(1) + " points either way";
      if (Math.abs(aY) < band) story += ", so a statistician couldn't yet tell this fund from one with no skill at all" + (aT > 0 ? ", even though you know it has some." : ".");
      else if (aY > 0) story += ", and the estimate is clear of that range: strong evidence of real skill" + (aT <= 0 ? ". You know it isn't there, so this history is a lucky one. Press \"Run again\"." : ".");
      else story += ", and the estimate is clearly negative: the manager has been costing money" + (aT >= 0 ? ", though you know that's bad luck here." : ".");
      if (r2 > 0.7) story += " R-squared of " + r2.toFixed(2) + " means most of the fund's monthly ups and downs are just the market.";
      else if (r2 < 0.2 && bT > 0) story += " R-squared is low because luck swamps the market's effect; try less luck.";
      $("sw-story").textContent = story;
    };
    ["sw-b", "sw-a", "sw-n"].forEach((id) => $(id).addEventListener("input", draw));
    $("sw-again").addEventListener("click", () => { seed = (seed * 48271 + 11) % 2147483647; draw(); });
    onResize("chart-sw", draw);
    H.charts(draw);
  }
})();