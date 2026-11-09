// Interactives for the note "Bond Prices and Yields" (Markets · Rates and Bonds).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour, frame } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const fmt = (v, d = 2) => {
    const x = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    return (Object.is(x, -0) ? 0 : x).toFixed(d);
  };
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
  const press = (boxId, i) => [...$(boxId).children].forEach((c, k) => c.setAttribute("aria-pressed", k === i ? "true" : "false"));
  const onResize = (id, draw) => {
    let lastW = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($(id).getBoundingClientRect().width);
      if (w && w !== lastW) { lastW = w; draw(); }
    });
  };
  // Price per 100 of face, annual coupon c (%), yield y (%), n years
  const price = (c, y, n) => {
    const r = y / 100;
    if (Math.abs(r) < 1e-9) return c * n + 100;
    return c * (1 - Math.pow(1 + r, -n)) / r + 100 * Math.pow(1 + r, -n);
  };
  const kind = (c, y) => (Math.abs(c - y) < 0.005 ? "at par" : c > y ? "at a premium" : "at a discount");

  // ---------- Build a bond's price ----------
  if (has("chart-cf")) {
    const PRESETS = [
      { n: "5-year, 5% coupon, 6% yield", c: 5, y: 6, t: 5 },
      { n: "2-year zero at 5%", c: 0, y: 5, t: 2 },
      { n: "10-year, 4% coupon, 5.3% yield", c: 4, y: 5.3, t: 10 },
      { n: "Nigeria-style: 22.6% coupon, 17% yield, 9 years", c: 22.6, y: 17, t: 9 },
    ];
    const draw = () => {
      const c = parseFloat($("cf-c").value), y = parseFloat($("cf-y").value), n = parseInt($("cf-t").value, 10);
      $("cf-c-out").textContent = (+c.toFixed(2)) + "%";
      $("cf-y-out").textContent = (+y.toFixed(2)) + "%";
      $("cf-t-out").textContent = n + (n === 1 ? " year" : " years");
      const flows = [], pvs = [];
      for (let t = 1; t <= n; t++) { const cf = c + (t === n ? 100 : 0); flows.push(cf); pvs.push(cf / Math.pow(1 + y / 100, t)); }
      const P = pvs.reduce((a, b) => a + b, 0);
      const svg = $("chart-cf");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 250 : 280;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: 40, r: 12, t: 16, b: 36 };
      const top = Math.max(...flows), yMax = top <= 120 ? 120 : top <= 140 ? 140 : Math.ceil(top / 20) * 20;
      const yt = []; for (let v = 0; v <= yMax; v += yMax <= 140 ? 20 : 40) yt.push(v);
      const xt = n <= 10 ? Array.from({ length: n }, (_, i) => i + 1) : [1, 5, 10, 15, 20, 25, 30].filter((v) => v <= n);
      const s = frame(svg, W, HT, pad, [0.4, n + 0.6], [0, yMax], W < 480 && n > 6 ? xt.filter((v, i) => i % 2 === 0) : xt, yt, (v) => v);
      const slot = (W - pad.l - pad.r) / (n + 0.2), bw = Math.max(3, Math.min(42, slot * 0.7));
      flows.forEach((cf, i) => {
        const x = s.sx(i + 1) - bw / 2;
        el("rect", { x, y: s.sy(cf), width: bw, height: s.sy(0) - s.sy(cf), fill: grey(), "fill-opacity": 0.28, rx: 2 }, svg);
        el("rect", { x, y: s.sy(pvs[i]), width: bw, height: s.sy(0) - s.sy(pvs[i]), fill: tone(), rx: 2 }, svg);
      });
      if (n <= 6) flows.forEach((cf, i) => {
        el("text", { x: s.sx(i + 1), y: s.sy(Math.max(cf, pvs[i])) - 6, "text-anchor": "middle", style: "fill:var(--text);font-size:11px" }, svg).textContent = fmt(pvs[i], 1);
      });
      el("text", { x: W - pad.r, y: HT - 6, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = "Year of payment →";

      const cy = P > 0 ? (c / P) * 100 : 0;
      const out = $("cf-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Price} = " + fmt(P) + "\\text{ per 100 (trades " + kind(c, y) + ")}");
      tex(b, "\\text{Current yield} = " + fmt(cy) + "\\% \\quad \\text{Yield to maturity} = " + (+y.toFixed(2)) + "\\%");
      const far = pvs[n - 1], farRaw = flows[n - 1];
      let story = "Grey bars are what the bond will pay you; coloured bars are what each payment is worth today at a " + (+y.toFixed(2)) + "% yield. Add up the coloured bars and you get the price: " + fmt(P) + ". ";
      if (c === 0) story += "A zero-coupon bond has just one payment, so its price is a single discount: 100 shrunk by " + n + " years of " + (+y.toFixed(2)) + "% interest.";
      else if (Math.abs(c - y) < 0.005) story += "The coupon exactly matches the yield the market wants, so the bond is worth exactly 100.";
      else if (c > y) story += "The coupon pays more than the market's going rate, so buyers will pay more than 100 for it: a premium. That's why a Nigerian bond issued with a 22.6% coupon traded well above 100 once yields fell towards 17%.";
      else story += "The coupon pays less than the going rate, so the bond must be cheaper than 100 to compete: a discount. The final payment of " + fmt(farRaw, 1) + " is worth only " + fmt(far, 1) + " today.";
      $("cf-story").textContent = story;
    };
    buttons("cf-preset", PRESETS, (k) => { const p = PRESETS[k]; $("cf-c").value = p.c; $("cf-y").value = p.y; $("cf-t").value = p.t; draw(); }, 0);
    ["cf-c", "cf-y", "cf-t"].forEach((id) => $(id).addEventListener("input", () => { press("cf-preset", -1); draw(); }));
    onResize("chart-cf", draw);
    H.charts(draw);
  }

  // ---------- Price versus yield ----------
  if (has("chart-py")) {
    const BONDS = [{ n: 2, dash: "2 4" }, { n: 10, dash: "7 5" }, { n: 30, dash: "none" }];
    const draw = () => {
      const c = parseFloat($("py-c").value), y = parseFloat($("py-y").value);
      $("py-c-out").textContent = (+c.toFixed(2)) + "%";
      $("py-y-out").textContent = (+y.toFixed(2)) + "%";
      const X = [0, 12];
      const hi = Math.max(...BONDS.map((b) => price(c, X[0], b.n)));
      const yMax = Math.min(400, Math.ceil(hi / 50) * 50), yt = [];
      for (let v = 0; v <= yMax; v += yMax > 200 ? 100 : 50) yt.push(v);
      const svg = $("chart-py");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 260 : 300;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: 40, r: 14, t: 16, b: 36 };
      const s = frame(svg, W, HT, pad, X, [0, yMax], W < 480 ? [0, 4, 8, 12] : [0, 2, 4, 6, 8, 10, 12], yt, (v) => v);
      el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(100), y2: s.sy(100), stroke: colour("--text-2"), "stroke-width": 1, "stroke-dasharray": "3 4" }, svg);
      el("text", { x: pad.l + 4, y: s.sy(100) - 5, style: "fill:var(--text)" }, svg).textContent = "par (100)";
      el("line", { x1: s.sx(c), x2: s.sx(c), y1: pad.t, y2: HT - pad.b, stroke: colour("--text-2"), "stroke-width": 1, "stroke-dasharray": "3 4" }, svg);
      el("text", { x: s.sx(c) + 4, y: pad.t + 12, style: "fill:var(--text)" }, svg).textContent = "yield = coupon";
      BONDS.forEach((b, k) => {
        let d = "";
        for (let i = 0; i <= 120; i++) {
          const yy = X[0] + (X[1] - X[0]) * i / 120, p = Math.min(price(c, yy, b.n), yMax);
          d += (i ? "L" : "M") + s.sx(yy).toFixed(1) + " " + s.sy(p).toFixed(1);
        }
        el("path", { d, fill: "none", stroke: tone(), "stroke-width": k === 2 ? 3 : 2.5, "stroke-dasharray": b.dash, "stroke-opacity": k === 0 ? 0.7 : 1 }, svg);
        const p = price(c, y, b.n);
        if (p <= yMax) el("circle", { cx: s.sx(y), cy: s.sy(p), r: 5.5, fill: tone(), stroke: colour("--hub-card") || "#fff", "stroke-width": 2 }, svg);
        const lx = X[1] - 0.2, lp = price(c, lx, b.n);
        el("text", { x: s.sx(lx), y: s.sy(Math.min(lp, yMax)) - 7, "text-anchor": "end", style: "fill:var(--text);font-weight:600" }, svg).textContent = b.n + "-yr";
      });
      el("text", { x: W - pad.r, y: HT - 6, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = "Yield (%) →";

      // Table of prices and what a 1-point move does
      const tb = $("py-table"); tb.textContent = "";
      BONDS.forEach((b) => {
        const p0 = price(c, y, b.n), up = price(c, y + 1, b.n), dn = price(c, Math.max(0, y - 1), b.n);
        const tr = document.createElement("tr");
        [b.n + "-yr", fmt(p0), (up / p0 * 100 - 100 >= 0 ? "+" : "") + fmt(up / p0 * 100 - 100, 1) + "%", "+" + fmt(dn / p0 * 100 - 100, 1) + "%"].forEach((v) => {
          const td = document.createElement("td"); td.textContent = v; tr.append(td);
        });
        tb.append(tr);
      });
      const p30 = price(c, y, 30), up30 = price(c, y + 1, 30) / p30 - 1, dn30 = price(c, Math.max(0, y - 1), 30) / p30 - 1;
      $("py-story").textContent = "All three bonds pay a " + (+c.toFixed(2)) + "% coupon, so all three are worth exactly 100 where the yield equals the coupon. Move the yield and the longer bonds swing much further, because more of their money arrives far in the future. Look at the 30-year: a 1-point rise in yield costs " + fmt(-up30 * 100, 1) + "%, but a 1-point fall gains " + fmt(dn30 * 100, 1) + "%. The curve bends (it's convex), so gains from falling yields beat losses from rising ones.";
    };
    ["py-c", "py-y"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-py", draw);
    H.charts(draw);
  }
})();