// Interactives for the note "Global Macro" (Hedge Funds · Strategies).
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
  const toggles = (boxId, items, state, onChange) => {
    const box = $(boxId);
    items.forEach((name) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = name;
      b.setAttribute("aria-pressed", state[name] ? "true" : "false");
      b.addEventListener("click", () => { onChange(name); [...box.children].forEach((c) => c.setAttribute("aria-pressed", state[c.textContent] ? "true" : "false")); });
      box.append(b);
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
  const pct = (v, dp) => {
    const d = dp === undefined ? 2 : dp, r = Number(v.toFixed(d));
    return (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r).toFixed(d) + "%";
  };
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };

  // Horizontal bars around a zero line: rows = [{ n, v, total, off }]
  const bars = (svg, w, rows, fmt) => {
    const t = tone(), g = grey();
    const lab = w < 480 ? 112 : 160, padR = w < 480 ? 54 : 66, top = 8, rowH = 32;
    const maxAbs = Math.max(0.5, ...rows.map((r) => Math.abs(r.v)));
    const half = (w - lab - 2 * padR) / 2, x0 = lab + padR + half;
    const sx = (v) => x0 + (v / maxAbs) * half;
    el("line", { x1: x0, x2: x0, y1: top - 2, y2: top + rows.length * rowH, stroke: colour("--text-2"), "stroke-width": 1 }, svg);
    rows.forEach((r, i) => {
      const y = top + i * rowH, strong = r.total;
      el("text", { x: 4, y: y + 20, style: strong ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = r.n;
      if (r.off) { el("text", { x: x0 + 6, y: y + 20, style: "font-style:italic" }, svg).textContent = "off"; return; }
      const a = Math.min(sx(0), sx(r.v)), b = Math.max(sx(0), sx(r.v));
      if (Math.abs(r.v) > 1e-9) el("rect", { x: a, y: y + 6, width: Math.max(1.5, b - a), height: 20, rx: 3, fill: r.v >= 0 ? t : g, "fill-opacity": strong ? 1 : 0.85 }, svg);
      el("text", { x: r.v >= 0 ? sx(r.v) + 6 : sx(r.v) - 6, y: y + 20, "text-anchor": r.v >= 0 ? "start" : "end", style: strong ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = fmt(r.v);
    });
    return top + rows.length * rowH + 6;
  };

  // ---------- The Japan trade, step by step ----------
  if ($("chart-jp")) {
    // Rounded market levels. Entry 19 Dec 2022: USD/JPY 137.0, 10-year JGB 0.25%, Nikkei 225 27,237.
    const ENTRY = { fx: 137.0, y: 0.25, nk: 27237 };
    // Sizes as a share of the fund (illustrative, about 2% of NAV at risk overall)
    const JGB = { notional: 0.25, dur: 8.5 }, YEN = { notional: 0.15 };
    const PUT = { notional: 0.15, premium: 0.5, otm: 0.9 }; // premium in % of NAV per year; strike 10% below the Nikkei, bought each December
    const DATES = [
      { n: "20 Dec 2022", fx: 132.5, y: 0.45, nk: 26568, rolls: 1, strike: 0.9 * 27237,
        story: "The BoJ surprised everyone by widening the band around its yield target from 0.25% to 0.5%. The yen jumped about 3.5% against the dollar in minutes and JGB yields shot up. Day one: the view looks brilliant, and many funds piled into the same trade." },
      { n: "End of 2023", fx: 141.0, y: 0.61, nk: 33464, rolls: 2, strike: 0.9 * 33464,
        story: "The BoJ loosened its grip again in July and October, and JGB yields kept rising (to almost 1% in November). But US rates were above 5%, so money kept leaving the yen: it fell about 11% against the dollar over 2023. The Nikkei rose by more than a quarter, so the first year's puts expired worthless and new ones were bought." },
      { n: "19 Mar 2024", fx: 150.9, y: 0.73, nk: 40004, rolls: 2, strike: 0.9 * 33464,
        story: "The view comes true: the BoJ ends yield curve control and negative rates, its first rate rise in 17 years. But everyone expected it, the BoJ promised to stay gentle, and US rates were still high. The yen fell past 150 per dollar the same day. Right about the central bank, and still losing money." },
      { n: "5 Aug 2024", fx: 144.0, y: 0.78, nk: 31458, rolls: 2, strike: 0.9 * 33464,
        story: "The BoJ raised rates again on 31 July, then weak US jobs data hit. The carry trade unwound all at once: the dollar fell from about 155 to 144 yen in days and the Nikkei dropped 12.4% on 5 August. Note what didn't help: even after that crash, the Nikkei was still above the puts' strike." },
    ];
    const LEGS = ["Short JGBs", "Long yen", "Nikkei puts"];
    const on = {}; LEGS.forEach((l) => (on[l] = true));
    let di = 0;

    const draw = () => {
      const d = DATES[di];
      const jgb = JGB.notional * JGB.dur * (d.y - ENTRY.y);          // % of NAV (yields in percentage points)
      const yen = YEN.notional * (ENTRY.fx / d.fx - 1) * 100;          // % of NAV
      const put = PUT.notional * Math.max(0, d.strike - d.nk) / d.nk * 100 - PUT.premium * d.rolls;
      const vals = { "Short JGBs": jgb, "Long yen": yen, "Nikkei puts": put };
      const rows = LEGS.map((l) => ({ n: l, v: on[l] ? vals[l] : 0, off: !on[l] }));
      const total = rows.reduce((t, r) => t + r.v, 0);
      rows.push({ n: "Whole trade", v: total, total: true });

      const svg = $("chart-jp"), w = fit(svg, 200);
      const used = bars(svg, w, rows, (v) => pct(v, 2));
      svg.setAttribute("viewBox", "0 0 " + w + " " + used);

      const out = $("jp-read"); out.textContent = "";
      span(out, "Dollar–yen " + d.fx.toFixed(1) + " (was " + ENTRY.fx.toFixed(1) + ")");
      span(out, "10-year JGB " + d.y.toFixed(2) + "% (was " + ENTRY.y.toFixed(2) + "%)");
      span(out, "Nikkei " + d.nk.toLocaleString("en-GB") + " (was " + ENTRY.nk.toLocaleString("en-GB") + ")");

      let story = d.story + " Whole trade: " + pct(total) + " of the fund.";
      if (!on["Long yen"] && on["Short JGBs"] && di > 0) story += " Without the yen leg, the bond short alone would have been a winner: the trade's problem was the currency, not the view on Japan.";
      else if (!on["Nikkei puts"] && di > 0) story += " Dropping the puts saves the premium, but leaves the fund unprotected if Japanese shares crash.";
      $("jp-story").textContent = story;
    };
    toggles("jp-legs", LEGS, on, (l) => { on[l] = !on[l]; draw(); });
    choice("jp-date", DATES, di, (i) => { di = i; draw(); });
    onResize("chart-jp", draw);
    H.charts(draw);
  }

  // ---------- Right, but too early ----------
  if ($("chart-te")) {
    const STEPS = 52, SIMS = 1000, SHOW = 40, DRIFT = 10; // expected move +10% over the year
    let seed = 11;
    const rng = (s) => () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

    const draw = () => {
      const vol = parseFloat($("te-vol").value), stop = parseFloat($("te-stop").value);
      $("te-vol-out").textContent = vol + "%/yr";
      $("te-stop-out").textContent = "−" + stop + "%";

      // The same random shocks for every setting, so sliders change only what they control
      const r = rng(seed), mu = DRIFT / STEPS, sd = vol / Math.sqrt(STEPS);
      const premium = 0.4 * vol; // at-the-money call, one year: about 0.4 × σ × √T
      let right = 0, stopped = 0, stoppedRight = 0, futSum = 0, optSum = 0, rawSum = 0, rawWorst = 0;
      const shown = [];
      for (let k = 0; k < SIMS; k++) {
        let x = 0, hit = -1; const path = k < SHOW ? [0] : null;
        for (let i = 1; i <= STEPS; i++) {
          x += mu + sd * normal(r);
          if (hit < 0 && x <= -stop) hit = i;
          if (path) path.push(x);
        }
        if (x > 0) right++;
        if (hit >= 0) { stopped++; if (x > 0) stoppedRight++; }
        futSum += hit >= 0 ? -stop : x;
        optSum += Math.max(x, 0) - premium;
        rawSum += x; rawWorst = Math.min(rawWorst, x);
        if (path) shown.push({ path, hit });
      }

      const svg = $("chart-te"), w = fit(svg, 300), h = 300;
      let lo = Math.min(-stop - 2, ...shown.map((p) => Math.min(...p.path.slice(0, p.hit >= 0 ? p.hit : STEPS + 1)))), hi = Math.max(DRIFT + 2, ...shown.map((p) => Math.max(...p.path)));
      const step = hi - lo > 60 ? 20 : 10;
      const yr = [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
      const yt = []; for (let y = yr[0]; y <= yr[1]; y += step) yt.push(y);
      const pad = { l: 44, r: 12, t: 22, b: 40 };
      const sc = H.frame(svg, w, h, pad, [0, 12], yr, [0, 3, 6, 9, 12], yt, (y) => (y > 0 ? "+" : "") + y + "%");
      el("text", { x: w - pad.r, y: h - 6, "text-anchor": "end" }, svg).textContent = "Months";
      el("text", { x: 4, y: 12 }, svg).textContent = "Price move";
      const mx = (i) => sc.sx((i / STEPS) * 12);

      // Stop-loss and expected-path guides
      el("line", { x1: pad.l, x2: w - pad.r, y1: sc.sy(-stop), y2: sc.sy(-stop), stroke: grey(), "stroke-width": 1.5, "stroke-dasharray": "6 4" }, svg);
      el("text", { x: w - pad.r - 4, y: sc.sy(-stop) + 15, "text-anchor": "end" }, svg).textContent = "stop −" + stop + "%";
      el("line", { x1: sc.sx(0), y1: sc.sy(0), x2: sc.sx(12), y2: sc.sy(DRIFT), stroke: colour("--text-2"), "stroke-width": 1.2, "stroke-dasharray": "2 4" }, svg);

      shown.forEach(({ path, hit }) => {
        const end = hit >= 0 ? hit : STEPS;
        let d = "";
        for (let i = 0; i <= end; i++) d += (i ? "L" : "M") + mx(i).toFixed(1) + " " + sc.sy(i === hit ? -stop : path[i]).toFixed(1);
        el("path", { d, fill: "none", stroke: hit >= 0 ? grey() : tone(), "stroke-width": 1.3, "stroke-opacity": hit >= 0 ? 0.55 : 0.5 }, svg);
        if (hit >= 0) {
          const cx = mx(hit), cy = sc.sy(-stop);
          el("path", { d: "M" + (cx - 3) + " " + (cy - 3) + "L" + (cx + 3) + " " + (cy + 3) + "M" + (cx + 3) + " " + (cy - 3) + "L" + (cx - 3) + " " + (cy + 3), stroke: grey(), "stroke-width": 1.5 }, svg);
        }
      });

      const P = (n) => Math.round((n / SIMS) * 100);
      const out = $("te-read"); out.textContent = "";
      span(out, "View right by year-end: " + P(right) + "% of runs");
      span(out, "Futures with stop: stopped out " + P(stopped) + "%, average " + pct(futSum / SIMS, 1));
      span(out, "Call option: costs " + premium.toFixed(1) + "%, average " + pct(optSum / SIMS, 1) + ", worst " + pct(-premium, 1));
      span(out, "Futures, no stop: average " + pct(rawSum / SIMS, 1) + ", worst " + pct(rawWorst, 1));

      const wasted = stopped ? Math.round((stoppedRight / stopped) * 100) : 0;
      let story = "The view came good in " + P(right) + "% of runs, yet the stop-loss threw you out " + P(stopped) + "% of the time";
      story += stopped ? ", and in " + wasted + "% of those stop-outs the price went on to finish higher. That's timing risk: right, but out of the trade." : ".";
      const best = futSum >= optSum ? "futures with the stop" : "the option";
      story += " On average " + best + (Math.abs(futSum - optSum) / SIMS < 1.5 ? " came out slightly ahead here (" : " came out ahead here (") + pct(Math.max(futSum, optSum) / SIMS, 1) + " against " + pct(Math.min(futSum, optSum) / SIMS, 1) + "), but the shapes differ: the stop caps each loss at " + stop + "% and cuts many winners short; the option's worst case is its " + premium.toFixed(1) + "% premium, and it's never shaken out.";
      story += " Holding with no stop does best on average, but its worst year (" + pct(rawWorst, 1) + ") is why no risk manager allows it.";
      $("te-story").textContent = story;
    };
    ["te-vol", "te-stop"].forEach((id) => $(id).addEventListener("input", draw));
    $("te-again").addEventListener("click", () => { seed = (seed * 48271 + 7) % 2147483647; draw(); });
    onResize("chart-te", draw);
    H.charts(draw);
  }
})();