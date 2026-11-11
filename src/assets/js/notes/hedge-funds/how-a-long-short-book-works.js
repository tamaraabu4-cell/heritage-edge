// Interactives for the note "How a Long/Short Book Works" (Hedge Funds · Strategies).
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
  // Toggle chips (several can be on) or a single-choice row
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
  const pct = (v, dp) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(dp === undefined ? 1 : dp) + "%";

  // Horizontal bars around a zero line: rows = [{ n, v, off, ghost }]
  const bars = (svg, w, rows, fmt) => {
    const t = tone(), g = grey();
    const lab = w < 480 ? 104 : 150, padR = w < 480 ? 54 : 70, top = 8, rowH = 32;
    const maxAbs = Math.max(0.5, ...rows.map((r) => Math.abs(r.v)), ...rows.map((r) => Math.abs(r.ghost || 0)));
    // Leave room for value labels on both sides of the zero line
    const half = (w - lab - 2 * padR) / 2, x0 = lab + padR + half;
    const sx = (v) => x0 + (v / maxAbs) * half;
    el("line", { x1: x0, x2: x0, y1: top - 2, y2: top + rows.length * rowH, stroke: colour("--text-2"), "stroke-width": 1 }, svg);
    rows.forEach((r, i) => {
      const y = top + i * rowH, strong = r.total;
      el("text", { x: 4, y: y + 20, style: strong ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = r.n;
      if (r.off) { el("text", { x: x0 + 6, y: y + 20, style: "font-style:italic" }, svg).textContent = "off"; return; }
      if (r.ghost) {
        const a = Math.min(sx(0), sx(r.ghost)), b2 = Math.max(sx(0), sx(r.ghost));
        el("rect", { x: a, y: y + 6, width: Math.max(1, b2 - a), height: 20, rx: 3, fill: "none", stroke: g, "stroke-width": 1.2, "stroke-dasharray": "4 3" }, svg);
      }
      const a = Math.min(sx(0), sx(r.v)), b2 = Math.max(sx(0), sx(r.v));
      if (Math.abs(r.v) > 1e-9) el("rect", { x: a, y: y + 6, width: Math.max(1.5, b2 - a), height: 20, rx: 3, fill: r.v >= 0 ? t : g, "fill-opacity": strong ? 1 : 0.85 }, svg);
      const tx = r.v >= 0 ? Math.max(sx(r.v), r.ghost && r.ghost > 0 ? sx(r.ghost) : 0) + 6 : Math.min(sx(r.v), r.ghost && r.ghost < 0 ? sx(r.ghost) : x0) - 6;
      el("text", { x: tx, y: y + 20, "text-anchor": r.v >= 0 ? "start" : "end", style: strong ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = r.label || fmt(r.v);
    });
    return top + rows.length * rowH + 6;
  };

  // ---------- Build the book ----------
  if ($("chart-ls")) {
    const LAYERS = ["Single names", "Pairs", "Thematic baskets", "Index hedges", "Sector hedges", "Country hedge", "Factor hedges", "Custom basket"];
    // w = % of NAV (shorts negative). b = beta; tech, hc (healthcare), jp (Japan), mom (momentum), q (quality) = illustrative tilts.
    // idio = how much this position gains if the fund's picks are right (shorts gain when the stock lags).
    const BOOK = [
      { n: "Apple", layer: 0, w: 8, b: 1.1, tech: 1, mom: 0.5, q: 1, idio: 6 },
      { n: "Microsoft", layer: 0, w: 7, b: 1.0, tech: 1, mom: 0.5, q: 1, idio: 6 },
      { n: "Alphabet", layer: 0, w: 6, b: 1.1, tech: 0.8, mom: 0.4, q: 0.8, idio: 6 },
      { n: "Eli Lilly", layer: 0, w: 6, b: 0.6, hc: 1, mom: 1, q: 0.8, idio: 6 },
      { n: "JPMorgan", layer: 0, w: 5, b: 1.1, q: 0.3, idio: 6 },
      { n: "Smaller SaaS co", layer: 0, w: -3, b: 1.4, tech: 1.2, mom: -0.3, q: -0.5, idio: -6 },
      { n: "Weak EV maker", layer: 0, w: -2.5, b: 1.8, q: -1, idio: -6 },
      { n: "Boeing", layer: 1, w: 4, b: 1.3, idio: 4 },
      { n: "Airbus", layer: 1, w: -4, b: 1.1, idio: -4 },
      { n: "PepsiCo", layer: 1, w: 3, b: 0.6, q: 0.5, idio: 4 },
      { n: "Coca-Cola", layer: 1, w: -3, b: 0.6, q: 0.5, idio: -4 },
      { n: "AI chips basket", layer: 2, w: 6, b: 1.6, tech: 1.5, mom: 1, idio: 2 },
      { n: "Energy transition basket", layer: 2, w: 4, b: 1.2, mom: 0.3, idio: 2 },
      { n: "Japanese banks", layer: 2, w: 5, b: 0.3, jp: 1, idio: 2 },
      { n: "SPY", layer: 3, w: -9, b: 1 },
      { n: "QQQ", layer: 3, w: -5, b: 1.2, tech: 0.6 },
      { n: "XLK (tech)", layer: 4, w: -8, b: 1.1, tech: 1 },
      { n: "XLV (healthcare)", layer: 4, w: -4, b: 0.7, hc: 1 },
      { n: "EWJ (Japan)", layer: 5, w: -6, b: 0.3, jp: 1 },
      { n: "MTUM (momentum)", layer: 6, w: -4, b: 1, mom: 1 },
      { n: "QUAL (quality)", layer: 6, w: -3, b: 0.95, q: 1 },
      { n: "Custom basket", layer: 7, w: -9, b: 1.0, tech: 0.4, mom: 0.3, q: 0.3 },
    ];
    const SHOCKS = [
      { n: "Market −10%", m: -10, story: "the whole market falls 10%" },
      { n: "Tech sell-off", m: -3, tech: -12, story: "tech stocks fall 12% more than a slightly weaker market" },
      { n: "Momentum crash", mom: -10, story: "last year's winners suddenly fall 10% behind last year's losers" },
      { n: "Japan −8%", jp: -8, story: "Japan's market (and the yen) falls 8%, with everything else unchanged" },
      { n: "Our picks were right", pick: 1, story: "the market does nothing, but the fund's researched ideas beat their rivals" },
    ];
    const on = {}; LAYERS.forEach((l) => (on[l] = true));
    let si = 0;
    const ret = (p, s) => (p.b || 0) * (s.m || 0) + (p.tech || 0) * (s.tech || 0) + (p.hc || 0) * (s.hc || 0) + (p.jp || 0) * (s.jp || 0) +
      (p.mom || 0) * (s.mom || 0) + (p.q || 0) * (s.q || 0) + (s.pick ? (p.idio || 0) * Math.sign(p.w) : 0);

    const draw = () => {
      const live = BOOK.filter((p) => on[LAYERS[p.layer]]);
      const L = live.filter((p) => p.w > 0).reduce((t, p) => t + p.w, 0), S = -live.filter((p) => p.w < 0).reduce((t, p) => t + p.w, 0);
      const Nb = live.reduce((t, p) => t + p.w * p.b, 0);
      const tilt = (k) => live.reduce((t, p) => t + p.w * (p[k] || 0), 0);
      const out = $("ls-exp"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Long } " + L.toFixed(1) + "\\% \\quad \\text{Short } " + S.toFixed(1) + "\\% \\quad \\text{Gross } " + (L + S).toFixed(1) + "\\% \\quad \\text{Net } " + (L - S).toFixed(1) + "\\%");
      tex(b, "\\text{Beta-adjusted net } " + Nb.toFixed(1) + "\\% \\quad \\text{Tech tilt } " + tilt("tech").toFixed(1) + " \\quad \\text{Momentum tilt } " + tilt("mom").toFixed(1));

      const s = SHOCKS[si];
      const rows = LAYERS.map((l, i) => {
        const v = BOOK.filter((p) => p.layer === i).reduce((t, p) => t + (p.w * ret(p, s)) / 100, 0);
        return { n: l, v: on[l] ? v : 0, off: !on[l] };
      });
      const total = rows.reduce((t, r) => t + r.v, 0);
      rows.push({ n: "Whole book", v: total, total: true });
      const svg = $("chart-ls"), w = fit(svg, 330);
      const used = bars(svg, w, rows, (v) => pct(v, 2));
      svg.setAttribute("viewBox", "0 0 " + w + " " + used);

      const live2 = rows.filter((r) => !r.off && !r.total);
      const best = live2.slice().sort((x, y) => y.v - x.v)[0], worst = live2.slice().sort((x, y) => x.v - y.v)[0];
      let story = "If " + s.story + ", the whole book makes " + pct(total, 2) + " of the fund.";
      if (best && best.v > 0.05) story += " " + best.n + " helped most (" + pct(best.v, 2) + ")";
      if (worst && worst.v < -0.05) story += (best && best.v > 0.05 ? ", while " : " ") + worst.n.toLowerCase() + " hurt most (" + pct(worst.v, 2) + ").";
      else if (best && best.v > 0.05) story += ".";
      const offHedges = ["Index hedges", "Sector hedges", "Country hedge", "Factor hedges", "Custom basket"].filter((l) => !on[l]);
      if (s.pick) story += " This is the result the hedges exist to protect: with the market flat, the profit comes from picking.";
      else if (offHedges.length) story += " With " + offHedges.length + " hedge layer" + (offHedges.length > 1 ? "s" : "") + " switched off, more of the event leaks into the result. Switch them back on to compare.";
      else if ((s.mom || s.tech) && total < -0.8) story += " The hedges only partly cover it: the book's " + (s.mom ? "momentum" : "tech") + " tilt is still large, and a risk team would ask the PM to add a bigger " + (s.mom ? "factor" : "sector") + " hedge or a custom basket.";
      else if (Math.abs(total) < 0.4) story += " The hedges have absorbed most of the event, which is the point: the book isn't meant to make or lose much from things it has no view on.";
      $("ls-story").textContent = story;
    };
    toggles("ls-layers", LAYERS, on, (l) => { on[l] = !on[l]; draw(); });
    choice("ls-shock", SHOCKS, si, (i) => { si = i; draw(); });
    onResize("chart-ls", draw);
    H.charts(draw);
  }

  // ---------- Hedge it away ----------
  if ($("chart-sh")) {
    const POS = 10; // $10m of Shell
    const SENS = { mkt: 0.8, oil: 0.7, fx: 1, own: 1 }; // illustrative: how much of each move Shell takes on
    const HEDGES = ["Short FTSE 100", "Short oil stocks", "Sell pounds forward", "Custom basket (all three)"];
    const hedge = {}; HEDGES.forEach((h) => (hedge[h] = false));
    const cancels = { mkt: "Short FTSE 100", oil: "Short oil stocks", fx: "Sell pounds forward" };
    const covered = (k) => hedge[cancels[k]] || hedge["Custom basket (all three)"];
    const m = (v) => (v < 0 ? "−$" : v > 0 ? "+$" : "$") + Math.abs(v).toFixed(2) + "m";

    const draw = () => {
      const v = {};
      ["mkt", "oil", "fx", "own"].forEach((k) => {
        v[k] = parseInt($("sh-" + k).value, 10);
        $("sh-" + k + "-out").textContent = (v[k] > 0 ? "+" : v[k] < 0 ? "−" : "") + Math.abs(v[k]) + "%";
      });
      const raw = { mkt: POS * SENS.mkt * v.mkt / 100, oil: POS * SENS.oil * v.oil / 100, fx: POS * SENS.fx * v.fx / 100, own: POS * SENS.own * v.own / 100 };
      const names = { mkt: "UK market", oil: "Oil sector", fx: "Pound vs dollar", own: "Shell's own news" };
      const rows = ["mkt", "oil", "fx", "own"].map((k) => {
        const hedged = k !== "own" && covered(k);
        return { n: names[k], v: hedged ? 0 : raw[k], ghost: hedged ? raw[k] : 0, label: hedged ? "hedged" : m(raw[k]) };
      });
      const unhedged = raw.mkt + raw.oil + raw.fx + raw.own;
      const total = rows.reduce((t, r) => t + r.v, 0);
      rows.push({ n: "Your result", v: total, total: true, label: m(total) });
      const svg = $("chart-sh"), w = fit(svg, 250);
      const used = bars(svg, w, rows, m);
      svg.setAttribute("viewBox", "0 0 " + w + " " + used);

      const out = $("sh-read"); out.textContent = "";
      const a = document.createElement("span"); out.append(a);
      tex(a, "\\text{Without hedges: " + m(unhedged).replace("$", "\\$") + "} \\quad \\text{With your hedges: " + m(total).replace("$", "\\$") + "}");
      const all = covered("mkt") && covered("oil") && covered("fx");
      let story;
      if (all) story = "Every outer layer is cancelled, so the result is exactly Shell's own news: " + m(raw.own) + ". That's orthogonal alpha. If your view on Shell is right, you're paid for it, whatever the UK market, oil and the pound do.";
      else if (!HEDGES.some((h) => hedge[h])) story = (raw.own > 0 && unhedged < 0)
        ? "Your research was right (Shell's own news is good), but the position still lost $" + Math.abs(unhedged).toFixed(2) + "m because the UK market, oil stocks and the pound moved against it. Add hedges to keep only the part you had a view on."
        : "Unhedged, the result mixes four things and only one of them is your research. Add hedges to strip out the others.";
      else story = "Partly hedged: the layers you've covered no longer move your result, but the ones left open still do. The custom basket covers all three in one trade.";
      $("sh-story").textContent = story;
    };
    ["mkt", "oil", "fx", "own"].forEach((k) => $("sh-" + k).addEventListener("input", draw));
    toggles("sh-hedges", HEDGES, hedge, (h) => {
      const custom = "Custom basket (all three)";
      if (h === custom) { const now = !hedge[custom]; HEDGES.forEach((x) => (hedge[x] = false)); hedge[custom] = now; }
      else { hedge[h] = !hedge[h]; hedge[custom] = false; }
      draw();
    });
    onResize("chart-sh", draw);
    H.charts(draw);
  }
})();