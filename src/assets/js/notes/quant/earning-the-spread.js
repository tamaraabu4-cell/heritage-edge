// Interactives for the note "Earning the Spread" (Quant · Market Making).
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
  const usd = (v) => (v < -0.5 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-GB");
  const niceStep = (span, parts) => {
    const raw = span / parts, mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
  };

  // ---------- Find the peak ----------
  if ($("chart-fp")) {
    const TICK = 12.5;
    // Deltashark's book: 800 fills at 4 ticks, 440 at 6 ticks -> kappa = ln(800/440)/2
    const K0 = Math.log(800 / 440) / 2;
    const PRESETS = [
      { name: "Deltashark's book", k: 0.3, s: 4, A: 800 * Math.exp(4 * K0) },
      { name: "Crowded, competitive", k: 0.9, s: 3, A: 12000 },
      { name: "Thin, few rivals", k: 0.12, s: 4, A: 400 },
    ];
    let A = PRESETS[0].A;
    const sIn = $("fp-s"), kIn = $("fp-k"), pick = $("fp-pick");
    PRESETS.forEach((ps, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = ps.name;
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", () => {
        [...pick.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
        A = ps.A; kIn.value = ps.k; sIn.value = ps.s; draw();
      });
      pick.append(b);
    });

    const draw = () => {
      const s = +sIn.value, k = +kIn.value;
      $("fp-s-out").textContent = s + " ticks";
      $("fp-k-out").textContent = k.toFixed(2);
      const fills = (x) => A * Math.exp(-k * x);
      const rev = (x) => (x / 2) * fills(x) * TICK;
      const best = 1 / k, bestRev = rev(best);

      const svg = $("chart-fp");
      const h = 280, w = fit(svg, h), narrow = w < 480;
      const pad = { l: 58, r: 48, t: 16, b: 40 };
      const yMax = niceStep(bestRev * 1.15, 4) * 4;
      const yt = [0, 1, 2, 3, 4].map((i) => (yMax / 4) * i);
      const sc = H.frame(svg, w, h, pad, [0, 12], [0, yMax], [0, 2, 4, 6, 8, 10, 12], yt, (v) => "$" + (v >= 1000 ? Math.round(v / 1000) + "k" : v));
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 6, "text-anchor": "middle" }, svg).textContent = "Your quoted width (ticks)";

      // Round trips on a right-hand scale
      const rtMax = niceStep((fills(0) / 2) * 1.02, 4) * 4;
      const ry = (v) => h - pad.b - (v / rtMax) * (h - pad.t - pad.b);
      [0, 0.5, 1].forEach((f) => {
        el("text", { x: w - pad.r + 6, y: ry(rtMax * f) + 4 }, svg).textContent = Math.round(rtMax * f).toLocaleString("en-GB");
      });
      let d = "";
      for (let i = 0; i <= 240; i++) { const x = (12 * i) / 240; d += (i ? "L" : "M") + sc.sx(x).toFixed(1) + " " + ry(fills(x) / 2).toFixed(1); }
      el("path", { d, fill: "none", stroke: grey(), "stroke-width": 1.6, "stroke-dasharray": "5 4" }, svg);
      H.curve(svg, sc, rev, [0, 12], yMax * 1.01, tone(), 2.4);

      if (best <= 12) {
        el("line", { x1: sc.sx(best), x2: sc.sx(best), y1: sc.sy(bestRev), y2: h - pad.b, stroke: tone(), "stroke-dasharray": "3 4", "stroke-width": 1.2 }, svg);
        const right = sc.sx(best) > w * 0.7;
        el("text", { x: sc.sx(best) + (right ? -6 : 6), y: sc.sy(bestRev) - 8, "text-anchor": right ? "end" : "start", style: "fill:var(--text)" }, svg).textContent = (narrow ? "peak " : "best width ") + best.toFixed(1);
      }
      el("circle", { cx: sc.sx(s), cy: sc.sy(rev(s)), r: 6, fill: tone(), stroke: "var(--hub-card, #fff)", "stroke-width": 2 }, svg);

      const box = $("fp-read"); box.textContent = "";
      span(box, "At " + s + " ticks: " + Math.round(fills(s) / 2).toLocaleString("en-GB") + " round trips, " + usd(rev(s)) + " a day");
      span(box, "Best width: " + best.toFixed(2) + " ticks, " + usd(bestRev) + " a day");
      const gap = bestRev - rev(s);
      span(box, gap < 1 ? "You're at the peak" : "Left on the table: " + usd(gap) + " a day (" + Math.round((gap / bestRev) * 100) + "%)");

      let story;
      if (gap / bestRev < 0.03) story = "At or very near the top of the hump: small changes either way barely move revenue. Go further and widening loses more flow than it gains in margin, while tightening gives away more margin than the extra flow brings in.";
      else if (s < best) story = "Too tight: lots of round trips, but each earns too little. You could widen and lose some flow without losing revenue. (Before adverse selection: the next note shows why tight quotes can also be picked off.)";
      else story = "Too wide: each fill earns more, but competitors' tighter quotes are taking the flow. Revenue falls faster than the margin rises.";
      if (k >= 0.7) story += " In a crowded market the peak sits very close to zero width, so competition squeezes spreads to the bone.";
      else if (k <= 0.15) story += " With few rivals, customers have nowhere else to go and the best width is wide.";
      $("fp-story").textContent = story;
    };

    sIn.addEventListener("input", draw);
    kIn.addEventListener("input", () => { [...pick.children].forEach((c) => c.setAttribute("aria-pressed", "false")); draw(); });
    H.charts(draw);
    onResize("chart-fp", draw);
  }

  // ---------- Three spreads, one trade ----------
  if ($("chart-ts")) {
    const BID = 150.0, OFFER = 150.02, MID = 150.01;
    const TRADES = [
      { name: "At the offer, 150.02", p: 150.02 },
      { name: "Price-improved, 150.015", p: 150.015 },
      { name: "Walked the book, 150.03", p: 150.03 },
    ];
    let t = 0;
    const mIn = $("ts-m"), pick = $("ts-pick");
    TRADES.forEach((tr, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = tr.name;
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", () => { [...pick.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); t = i; draw(); });
      pick.append(b);
    });
    const c = (v) => Math.round(v * 1000) / 10; // dollars -> cents, to a tenth

    const draw = () => {
      const m5 = +mIn.value, P = TRADES[t].p;
      $("ts-m-out").textContent = m5.toFixed(3);
      const quoted = c(OFFER - BID), eff = c(2 * (P - MID)), real = c(2 * (P - m5)), as = c(2 * (m5 - MID));
      const rows = [
        { label: "Quoted", v: quoted, col: grey() },
        { label: "Effective", v: eff, col: grey() },
        { label: "Realised", v: real, col: tone() },
        { label: "Adverse selection", short: "Adverse sel.", v: as, col: tone(), hollow: true },
      ];
      const svg = $("chart-ts");
      const h = 230, w = fit(svg, h), narrow = w < 480;
      const pad = { l: narrow ? 108 : 132, r: 46, t: 10, b: 34 };
      const M = Math.max(4, Math.ceil(Math.max(...rows.map((r) => Math.abs(r.v))) / 2) * 2);
      const lo = -M, hi = M;
      const sx = (v) => pad.l + ((v - lo) / (hi - lo)) * (w - pad.l - pad.r);
      [-M, -M / 2, 0, M / 2, M].forEach((v) => {
        el("line", { x1: sx(v), x2: sx(v), y1: pad.t, y2: h - pad.b, class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: sx(v), y: h - pad.b + 16, "text-anchor": "middle" }, svg).textContent = v;
      });
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 2, "text-anchor": "middle" }, svg).textContent = "Cents per share";
      const rowH = (h - pad.t - pad.b) / rows.length, barH = Math.min(26, rowH * 0.6);
      rows.forEach((r, i) => {
        const y = pad.t + rowH * i + (rowH - barH) / 2;
        const v = Math.max(lo, Math.min(hi, r.v));
        const x0 = sx(Math.min(0, v)), x1 = sx(Math.max(0, v));
        el("text", { x: pad.l - 10, y: y + barH / 2 + 4, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = narrow && r.short ? r.short : r.label;
        if (Math.abs(v) > 0.001) {
          el("rect", r.hollow
            ? { x: x0, y: y + 1, width: x1 - x0, height: barH - 2, fill: "none", stroke: r.col, "stroke-width": 1.6, "stroke-dasharray": "4 3", rx: 3 }
            : { x: x0, y, width: x1 - x0, height: barH, fill: r.col, rx: 3 }, svg);
        }
        const neg = r.v < 0;
        el("text", { x: neg ? x0 - 6 : x1 + 6, y: y + barH / 2 + 4, "text-anchor": neg ? "end" : "start", style: "fill:var(--text)" }, svg).textContent = (r.v < 0 ? "−" : "") + Math.abs(r.v).toFixed(1);
      });

      const box = $("ts-read"); box.textContent = "";
      span(box, "Effective = 2 × (" + P.toFixed(3) + " − 150.010) = " + eff.toFixed(1) + "¢");
      span(box, "Realised = 2 × (" + P.toFixed(3) + " − " + m5.toFixed(3) + ") = " + (real < 0 ? "−" : "") + Math.abs(real).toFixed(1) + "¢");
      span(box, "Adverse selection = effective − realised = " + (as < 0 ? "−" : "") + Math.abs(as).toFixed(1) + "¢");

      let story;
      if (real < 0) story = "The maker lost on this trade. The price kept rising after the customer bought, by more than the spread the maker charged. The buyer was probably informed, and a run of trades like this is what being picked off looks like.";
      else if (as > 0.05) story = "The maker kept some of the spread, but the price drifted up after the buy, eating part of it. That drift is the adverse selection: the information in the order.";
      else if (as < -0.05) story = "The price fell back after the customer bought, so the maker kept more than the effective spread: the trade was uninformed, the kind of flow makers compete for.";
      else story = "The mid didn't move, so the maker kept the whole effective spread: an uninformed trade.";
      if (t === 1) story += " With price improvement, the customer paid less than the quoted spread, so there was less for the maker to keep to start with.";
      if (t === 2) story += " This buy was large enough to walk the book, so the taker paid more than the quoted spread.";
      $("ts-story").textContent = story;
    };

    mIn.addEventListener("input", draw);
    H.charts(draw);
    onResize("chart-ts", draw);
  }
})();