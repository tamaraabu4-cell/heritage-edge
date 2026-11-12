// Interactives for the note "Credit and Distressed" (Hedge Funds · Strategies).
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
      b.type = "button"; b.textContent = it.n;
      b.setAttribute("aria-pressed", i === start ? "true" : "false");
      b.addEventListener("click", () => { [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); onPick(i); });
      box.append(b);
    });
  };
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const pct = (v, dp) => {
    const d = dp === undefined ? 1 : dp, r = Number(v.toFixed(d));
    return (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r).toFixed(d) + "%";
  };

  // Horizontal bars around a zero line: rows = [{ n, v, total }]
  const bars = (svg, w, rows, fmt) => {
    const t = tone(), g = grey();
    const lab = w < 480 ? 110 : 150, padR = w < 480 ? 54 : 64, top = 8, rowH = 32;
    const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.v)));
    const half = (w - lab - 2 * padR) / 2, x0 = lab + padR + half;
    const sx = (v) => x0 + (v / maxAbs) * half;
    el("line", { x1: x0, x2: x0, y1: top - 2, y2: top + rows.length * rowH, stroke: colour("--text-2"), "stroke-width": 1 }, svg);
    rows.forEach((r, i) => {
      const y = top + i * rowH, strong = r.total;
      el("text", { x: 4, y: y + 20, style: strong ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = r.n;
      const a = Math.min(sx(0), sx(r.v)), b = Math.max(sx(0), sx(r.v));
      if (Math.abs(r.v) > 1e-9) el("rect", { x: a, y: y + 6, width: Math.max(1.5, b - a), height: 20, rx: 3, fill: r.v >= 0 ? t : g, "fill-opacity": strong ? 1 : 0.85 }, svg);
      el("text", { x: r.v >= 0 ? sx(r.v) + 6 : sx(r.v) - 6, y: y + 20, "text-anchor": r.v >= 0 ? "start" : "end", style: strong ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = fmt(r.v);
    });
    return top + rows.length * rowH + 6;
  };

  // ---------- Carry and the credit cycle ----------
  if ($("chart-cc")) {
    const Y = 8, FUND = 5, DUR = 4, LGD = 0.6;
    const PERIODS = [
      { n: "Calm year", ds: -0.5, d: 1.5, t: 1, why: "Spreads tighten half a point and few companies default." },
      { n: "Average year", ds: 0, d: 3.5, t: 1, why: "Spreads end where they started and defaults run at a typical rate." },
      { n: "2008-style year", ds: 8, d: 4, t: 1, why: "Spreads blow out by 8 points as investors flee risk, and defaults start to rise." },
      { n: "A month like March 2020", ds: 3, d: 0, t: 1 / 12, why: "In one month spreads jump 3 points before any defaults have even happened." },
    ];
    let pi = 1;
    const draw = () => {
      const L = parseFloat($("cc-lev").value);
      $("cc-lev-out").textContent = (L % 1 ? L.toFixed(1) : L) + "×";
      const p = PERIODS[pi];
      const carry = L * Y * p.t, defaults = -L * p.d * LGD * p.t, spread = -L * DUR * p.ds, borrow = -(L - 1) * FUND * p.t;
      const total = carry + defaults + spread + borrow;
      const unlev = Y * p.t - p.d * LGD * p.t - DUR * p.ds;
      const rows = [
        { n: "Interest earned", v: carry },
        { n: "Defaults", v: defaults },
        { n: "Spread change", v: spread },
        { n: "Cost of borrowing", v: borrow },
        { n: "Fund's return", v: total, total: true },
      ];
      const svg = $("chart-cc"), w = fit(svg, 220);
      const used = bars(svg, w, rows, (v) => pct(v));
      svg.setAttribute("viewBox", "0 0 " + w + " " + used);

      const out = $("cc-read"); out.textContent = "";
      span(out, "Fund's return: " + pct(total) + (p.t < 1 ? " in a month" : " for the year"));
      span(out, "Without borrowing: " + pct(unlev));
      span(out, "Money at work: $" + L.toFixed(1) + " per $1 of capital");

      let story = p.why + " ";
      if (total >= 0 && p.ds <= 0) story += "Leverage turns an " + pct(unlev) + " return on the bonds into " + pct(total) + " on capital, because the bonds yield more than the " + FUND + "% it costs to borrow. This is why long-biased credit funds borrow.";
      else if (p.ds > 0 && total < -20) story += "At " + L + "×, the fund loses " + pct(-total).replace("+", "") + " of its capital" + (p.t < 1 ? " in a single month" : "") + ". Lenders would be demanding more margin long before this, forcing sales at the worst prices. Years of steady interest can vanish in weeks.";
      else if (p.ds > 0) story += "Even unlevered the bonds lose " + pct(-unlev).replace("+", "") + "; leverage makes it " + pct(total) + ". Try 1× to see the bonds on their own, then push the leverage up.";
      else story += "With no change in spreads, the return is the interest earned, minus defaults and the cost of borrowing.";
      $("cc-story").textContent = story;
    };
    choice("cc-period", PERIODS, pi, (i) => { pi = i; draw(); });
    $("cc-lev").addEventListener("input", draw);
    onResize("chart-cc", draw);
    H.charts(draw);
  }

  // ---------- Find the fulcrum ----------
  if ($("chart-fu")) {
    const LAYERS = [
      { n: "Senior secured", short: "Sr secured", c: 200 },
      { n: "Senior unsecured", short: "Sr unsecured", c: 150 },
      { n: "Subordinated", short: "Subordinated", c: 200 },
      { n: "Preferred shares", short: "Preferred", c: 50 },
    ];
    const SUB = 2, SHARES_BEFORE = 100;
    const draw = () => {
      const V = parseFloat($("fu-ev").value), px = parseFloat($("fu-px").value);
      $("fu-ev-out").textContent = "$" + V + "m";
      $("fu-px-out").textContent = px + "¢";

      let left = V, fulcrum = -1;
      const rec = LAYERS.map((l, i) => {
        const got = Math.max(0, Math.min(l.c, left));
        left -= got;
        if (fulcrum < 0 && got < l.c) fulcrum = i;
        return got;
      });
      const shares = Math.max(0, left);

      const svg = $("chart-fu"), w = fit(svg, 250);
      const narrow = w < 480, lab = narrow ? 96 : 140, padR = narrow ? 46 : 120, rowH = 40, top = 10;
      const scale = (w - lab - padR) / 220;
      const rows = LAYERS.map((l, i) => ({ n: narrow ? l.short : l.n, c: l.c, got: rec[i], f: i === fulcrum }));
      rows.push({ n: narrow ? "Shares" : "Ordinary shares", c: null, got: shares, f: fulcrum < 0 });
      rows.forEach((r, i) => {
        const y = top + i * rowH;
        el("text", { x: 4, y: y + 22, style: r.f ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = r.n;
        if (r.c !== null) {
          el("rect", { x: lab, y: y + 8, width: r.c * scale, height: 20, rx: 3, fill: "none", stroke: grey(), "stroke-width": 1.2 }, svg);
          el("rect", { x: lab, y: y + 8, width: r.c * scale, height: 20, rx: 3, fill: grey(), "fill-opacity": 0.25 }, svg);
          if (r.got > 0) el("rect", { x: lab, y: y + 8, width: r.got * scale, height: 20, rx: 3, fill: tone() }, svg);
          const label = Math.round((r.got / r.c) * 100) + "¢" + (narrow ? "" : " of $" + r.c + "m") + (r.f && !narrow ? "  ← fulcrum" : r.f ? " ←" : "");
          el("text", { x: lab + r.c * scale + 6, y: y + 22, style: r.f ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = label;
        } else {
          el("rect", { x: lab, y: y + 8, width: SHARES_BEFORE * scale, height: 20, rx: 3, fill: "none", stroke: grey(), "stroke-width": 1.2, "stroke-dasharray": "4 3" }, svg);
          if (r.got > 0) el("rect", { x: lab, y: y + 8, width: Math.min(220, r.got) * scale, height: 20, rx: 3, fill: tone() }, svg);
          el("text", { x: lab + Math.max(SHARES_BEFORE, Math.min(220, r.got)) * scale + 6, y: y + 22, style: r.f ? "fill:var(--text);font-weight:600" : "" }, svg).textContent = "$" + Math.round(r.got) + "m" + (narrow ? "" : " left") + (r.f && !narrow ? "  ← value sits here" : r.f ? " ←" : "");
        }
      });
      svg.setAttribute("viewBox", "0 0 " + w + " " + (top + rows.length * rowH + 4));

      const subRec = (rec[SUB] / LAYERS[SUB].c) * 100, ret = (subRec / px - 1) * 100;
      const out = $("fu-read"); out.textContent = "";
      span(out, "Claims: $600m of debt and preferred; company worth $" + V + "m");
      span(out, "Fulcrum: " + (fulcrum >= 0 ? LAYERS[fulcrum].n.toLowerCase() : "the ordinary shares"));
      span(out, "Subordinated debt recovers " + Math.round(subRec) + "¢");
      span(out, "Your return at " + px + "¢: " + pct(ret, 0));

      let story;
      if (fulcrum === 0) story = "The company is worth less than even its senior secured loans. Those lenders become the new owners and everyone else is wiped out.";
      else if (fulcrum === 1) story = "Value runs out in the senior unsecured bonds. The subordinated debt you bought gets nothing: you lose the whole " + px + "¢.";
      else if (fulcrum === SUB && subRec < 1) story = "Value runs out exactly at the top of the subordinated debt, as in Deltashark's example: it's the fulcrum but recovers almost nothing at this value. Buying at " + px + "¢ is a bet that the restructuring values the company higher. Move the value up and watch your return.";
      else if (fulcrum === SUB) story = "The subordinated debt is the fulcrum, recovering " + Math.round(subRec) + "¢. In a real restructuring it would mostly be swapped into the new company's shares, so its holders own the upside if the business recovers. Bought at " + px + "¢, that's " + pct(ret, 0) + ".";
      else if (fulcrum === 3) story = "There's enough to pay all the debt, so the subordinated bonds recover in full: " + pct(ret, 0) + " on a purchase at " + px + "¢. The preferred shares are now the fulcrum.";
      else story = "Every claim is paid in full and $" + Math.round(shares) + "m is left for the ordinary shares, a Hertz-style outcome. The subordinated debt returns " + pct(ret, 0) + ".";
      $("fu-story").textContent = story;
    };
    ["fu-ev", "fu-px"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-fu", draw);
    H.charts(draw);
  }
})();