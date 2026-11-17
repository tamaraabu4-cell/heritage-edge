// Interactives for the note "Designated Makers, Fees and Special Markets" (Quant · Market Making).
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
  const sgn = (v) => (v < 0 ? "−" : "+") + Math.abs(v);

  // ---------- Who pays whom? ----------
  if ($("chart-wp")) {
    // Fees in mils (hundredths of a cent) per share. Positive = pays the exchange, negative = paid a rebate.
    const MODELS = [
      { name: "Maker-taker", old: { taker: 30, maker: -20 }, cut: { taker: 10, maker: -7 } },
      { name: "Inverted", old: { taker: -15, maker: 18 }, cut: { taker: -5, maker: 6 } },
      { name: "Low flat fee", old: { taker: 9, maker: 0 }, cut: { taker: 9, maker: 0 } },
    ];
    const SPREADS = [{ name: "One cent", mils: 100 }, { name: "Half a cent", mils: 50 }];
    const CAPS = ["Cap today: 30 mils", "Adopted cap: 10 mils"];
    let m = 0, s = 0, c = 0;

    const draw = () => {
      const model = MODELS[m], fees = c === 0 ? model.old : model.cut, half = SPREADS[s].mils / 2;
      const taker = half + fees.taker, maker = half - fees.maker, exch = fees.taker + fees.maker;
      const rows = [
        { label: "Taker pays", base: half, fee: fees.taker, total: taker, feeWord: fees.taker >= 0 ? "fee" : "rebate" },
        { label: "Maker earns", base: half, fee: -fees.maker, total: maker, feeWord: fees.maker <= 0 ? "rebate" : "fee" },
        { label: "Exchange keeps", base: 0, fee: exch, total: exch, feeWord: "net" },
      ];
      const svg = $("chart-wp");
      const h = 230, w = fit(svg, h), narrow = w < 480;
      const pad = { l: narrow ? 96 : 120, r: 52, t: 14, b: 34 };
      const xMax = 100;
      const sx = (v) => pad.l + (v / xMax) * (w - pad.l - pad.r);
      [0, 25, 50, 75, 100].forEach((v) => {
        el("line", { x1: sx(v), x2: sx(v), y1: pad.t, y2: h - pad.b, class: "grid" }, svg);
        el("text", { x: sx(v), y: h - pad.b + 16, "text-anchor": "middle" }, svg).textContent = v;
      });
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 4, "text-anchor": "middle" }, svg).textContent = "Mils per share, against the mid";
      const rowH = (h - pad.t - pad.b) / 3, barH = Math.min(30, rowH * 0.55);
      rows.forEach((r, i) => {
        const y = pad.t + rowH * i + (rowH - barH) / 2;
        el("text", { x: pad.l - 10, y: y + barH / 2 + 4, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = r.label;
        if (r.fee >= 0) {
          if (r.base > 0) el("rect", { x: sx(0), y, width: sx(r.base) - sx(0), height: barH, fill: grey(), rx: 3 }, svg);
          if (r.fee > 0) el("rect", { x: sx(r.base), y, width: sx(r.base + r.fee) - sx(r.base), height: barH, fill: tone(), rx: 3 }, svg);
        } else {
          // A rebate shrinks the bar: show what's left solid, and the part given back as an outline
          el("rect", { x: sx(0), y, width: Math.max(0, sx(r.total) - sx(0)), height: barH, fill: grey(), rx: 3 }, svg);
          el("rect", { x: sx(Math.max(0, r.total)), y: y + 1, width: sx(r.base) - sx(Math.max(0, r.total)), height: barH - 2, fill: "none", stroke: tone(), "stroke-width": 1.5, "stroke-dasharray": "4 3", rx: 3 }, svg);
        }
        const end = Math.max(r.total, r.base);
        el("text", { x: sx(end) + 6, y: y + barH / 2 + 4, style: "fill:var(--text)" }, svg).textContent = r.total;
      });

      const box = $("wp-read"); box.textContent = "";
      span(box, "Taker: " + half + " spread " + sgn(fees.taker) + " " + (fees.taker >= 0 ? "fee" : "rebate") + " = " + taker + " mils");
      span(box, "Maker: " + half + " spread " + sgn(-fees.maker) + " " + (fees.maker <= 0 ? "rebate" : "fee") + " = " + maker + " mils");
      span(box, "Exchange: " + exch + " mils a share");
      span(box, "Taker's fee or rebate as a share of half the spread: " + Math.round((Math.abs(fees.taker) / half) * 100) + "%");
      span(box, "Crossing and coming back costs a taker " + (2 * taker / 100).toFixed(2) + "¢ a share, against a quoted spread of " + (SPREADS[s].mils / 100).toFixed(1) + "¢");

      let story;
      if (m === 0) story = c === 0
        ? (s === 0 ? "Maker-taker at today's cap: the 30-mil fee is 60% of the half-spread, so the screen shows a one-cent spread but a taker really pays 1.6¢ to cross and come back, and the maker earns 70 mils, not 50. That's the gap the SEC wants to close." : "With a half-penny spread, the old 30-mil fee would be bigger than the half-spread itself. That's why the 2024 rules cut the tick and the fee cap together.")
        : "At the adopted 10-mil cap, the fee is a much smaller part of the cost, so the price on the screen is closer to what you really pay. Rebates shrink too, which is why some exchanges worried makers would post fewer orders.";
      else if (m === 1) story = "Inverted: the maker pays to post and the taker is paid to trade. Makers accept this to get filled first: these venues have shorter queues, so brokers send orders there when they need a fill quickly.";
      else story = "Low flat fees, no rebates: no reason to post orders just to collect a rebate, and simple costs. The trade-off is fewer orders resting there, since nobody is paid to wait.";
      $("wp-story").textContent = story;
    };

    choice("wp-model", MODELS.map((x) => x.name), 0, (i) => { m = i; draw(); });
    choice("wp-spread", SPREADS.map((x) => x.name), 0, (i) => { s = i; draw(); });
    choice("wp-cap", CAPS, 0, (i) => { c = i; draw(); });
    H.charts(draw);
    onResize("chart-wp", draw);
  }

  // ---------- Dealer gamma ----------
  if ($("chart-dg")) {
    const MIN = 390, SHOCK_AT = 210, SHOCK = -0.015, SIG = 0.0006;
    const POS = ["Long gamma", "No dealers", "Short gamma"];
    let pos = 0, seed = 3;
    const gIn = $("dg-g");

    const path = (phi, eps) => {
      let p = 100, prev = 0, hi = 100, lo = 100;
      const out = [100];
      for (let t = 1; t <= MIN; t++) {
        const r = eps[t] + phi * prev;
        p *= 1 + r; prev = r;
        hi = Math.max(hi, p); lo = Math.min(lo, p);
        out.push(p);
      }
      return { out, hi, lo };
    };
    // Volatility of 15-minute moves, leaving out the 15 minutes that contain the shock
    const vol = (out) => {
      let s = 0, n = 0;
      for (let t = 15; t <= MIN; t += 15) {
        if (SHOCK_AT > t - 15 && SHOCK_AT <= t) continue;
        const r = Math.log(out[t] / out[t - 15]); s += r * r; n += 1;
      }
      return Math.sqrt(s / n);
    };

    const draw = () => {
      const g = +gIn.value;
      $("dg-g-out").textContent = g.toFixed(2);
      const phi = pos === 0 ? -g : pos === 2 ? g : 0;
      const r = rng(seed * 104729);
      const eps = [0];
      for (let t = 1; t <= MIN; t++) eps.push(SIG * normal(r) + (t === SHOCK_AT ? SHOCK : 0));
      const base = path(0, eps), deal = path(phi, eps);

      const svg = $("chart-dg");
      const h = 280, w = fit(svg, h);
      const pad = { l: 46, r: 14, t: 18, b: 40 };
      const lo = Math.min(base.lo, deal.lo), hi = Math.max(base.hi, deal.hi);
      const yr = [Math.floor(lo * 2) / 2 - 0.5, Math.ceil(hi * 2) / 2 + 0.5];
      const step = yr[1] - yr[0] > 4 ? 1 : 0.5;
      const yt = [];
      for (let v = Math.ceil(yr[0] / step) * step; v <= yr[1] + 1e-9; v += step) yt.push(+v.toFixed(1));
      const hours = [0, 1, 2, 3, 4, 5, 6];
      const s = H.frame(svg, w, h, pad, [0, MIN], yr, [], yt, (v) => v.toFixed(step < 1 ? 1 : 0));
      hours.forEach((hh) => {
        const x = s.sx(hh * 60);
        el("line", { x1: x, x2: x, y1: pad.t, y2: h - pad.b, class: "grid" }, svg);
        el("text", { x, y: h - pad.b + 18, "text-anchor": "middle" }, svg).textContent = hh;
      });
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 6, "text-anchor": "middle" }, svg).textContent = w < 480 ? "Hours (index starts at 100)" : "Hours into the trading day (index starts at 100)";
      const line = (arr, stroke, width) => {
        let d = "";
        arr.forEach((p, t) => { d += (t ? "L" : "M") + s.sx(t).toFixed(1) + " " + s.sy(p).toFixed(1); });
        el("path", { d, fill: "none", stroke, "stroke-width": width, "stroke-linejoin": "round" }, svg);
      };
      const sx0 = s.sx(SHOCK_AT);
      el("line", { x1: sx0, x2: sx0, y1: pad.t, y2: h - pad.b, stroke: grey(), "stroke-dasharray": "3 4" }, svg);
      el("text", { x: sx0 + 6, y: pad.t + 12 }, svg).textContent = "1.5% shock";
      line(base.out, grey(), 1.5);
      if (pos !== 1) line(deal.out, tone(), 2.2);

      const range = (x) => ((x.hi - x.lo) / 100 * 100).toFixed(1) + "%";
      const ratio = vol(deal.out) / vol(base.out);
      const box = $("dg-read"); box.textContent = "";
      span(box, "Close: " + deal.out[MIN].toFixed(2) + " (no dealers: " + base.out[MIN].toFixed(2) + ")");
      span(box, "Day's range: " + range(deal) + " (no dealers: " + range(base) + ")");
      span(box, "15-minute volatility: ×" + ratio.toFixed(2) + " the no-dealer day");
      span(box, "The 1.5% shock ends up as about " + (1.5 / (1 - phi)).toFixed(1) + "%");

      let story;
      if (pos === 0) story = "Long gamma: dealers buy as the price falls and sell as it rises, leaning against every move. The shock is cushioned and the whole day is calmer. Near a big strike into expiry, this is what makes prices 'pin'.";
      else if (pos === 2) story = "Short gamma: dealers have to sell as the price falls and buy as it rises, so their hedging pushes in the same direction as the move. The shock grows and the day is choppier. Pull the hedging size up to see how a market can lurch when dealers are heavily short options.";
      else story = "No options dealers hedging: just the news and ordinary trading. Compare the other two settings against this grey line.";
      $("dg-story").textContent = story;
    };

    choice("dg-pos", POS, 0, (i) => { pos = i; draw(); });
    gIn.addEventListener("input", draw);
    $("dg-again").addEventListener("click", () => { seed += 1; draw(); });
    H.charts(draw);
    onResize("chart-dg", draw);
  }
})();