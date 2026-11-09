// Interactives for the note "The Price of Money" (Macro · Central Banks and Rates).
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
    return (Object.is(x, -0) ? 0 : x).toString();
  };
  const money = (v) => "£" + Math.round(v).toLocaleString("en-GB");

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
  const yTicks = (max) => {
    const step = max / 4, out = [];
    for (let i = 0; i <= 4; i++) out.push(Math.round(step * i));
    return out;
  };

  // ---------- Interest on interest ----------
  if (has("chart-comp")) {
    const FREQ = [
      { n: "Once a year", m: 1 }, { n: "Monthly", m: 12 }, { n: "Daily", m: 365 }, { n: "Continuously", m: Infinity },
    ];
    const PRESETS = [
      { n: "UK easy-access savings (about 2.5%)", r: 2.5 },
      { n: "Bank Rate (4%)", r: 4 },
      { n: "Nigerian MPR (23%)", r: 23 },
      { n: "Credit card (about 25%)", r: 25 },
    ];
    let fi = 0;
    const grow = (P, r, m, t) => (m === Infinity ? P * Math.exp(r * t) : P * Math.pow(1 + r / m, m * t));

    const draw = () => {
      const r = parseFloat($("cp-r").value) / 100, T = parseInt($("cp-t").value, 10), P = 1000, m = FREQ[fi].m;
      $("cp-r-out").textContent = fmt(r * 100, 1) + "%";
      $("cp-t-out").textContent = T + (T === 1 ? " year" : " years");
      const end = grow(P, r, m, T), simpleEnd = P * (1 + r * T);
      const ear = (m === Infinity ? Math.exp(r) : Math.pow(1 + r / m, m)) - 1;

      const svg = $("chart-comp");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 250 : 280;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: W < 480 ? 54 : 62, r: 14, t: 16, b: 36 };
      const top = end * 1.05, mag = Math.pow(10, Math.floor(Math.log10(top)));
      const yMax = [1, 1.2, 1.6, 2, 2.4, 3, 4, 6, 8, 10].map((k) => k * mag).find((v) => v >= top);
      const xt = []; const xs = T <= 10 ? 1 : T <= 20 ? 5 : 10;
      for (let x = 0; x <= T; x += xs) xt.push(x);
      const s = frame(svg, W, HT, pad, [0, T], [0, yMax], W < 480 && T <= 10 ? xt.filter((x) => x % 2 === 0) : xt, yTicks(yMax), (v) => "£" + v.toLocaleString("en-GB"));
      const path = (fn, stroke, w, dash) => {
        let d = "";
        const N = 120;
        for (let i = 0; i <= N; i++) { const t = (T * i) / N; d += (i ? "L" : "M") + s.sx(t).toFixed(1) + " " + s.sy(fn(t)).toFixed(1); }
        el("path", { d, fill: "none", stroke, "stroke-width": w, "stroke-dasharray": dash || "none", "stroke-linejoin": "round" }, svg);
      };
      // Shade the extra you get from interest on interest
      let area = "";
      const N = 120;
      for (let i = 0; i <= N; i++) { const t = (T * i) / N; area += (i ? "L" : "M") + s.sx(t).toFixed(1) + " " + s.sy(grow(P, r, m, t)).toFixed(1); }
      for (let i = N; i >= 0; i--) { const t = (T * i) / N; area += "L" + s.sx(t).toFixed(1) + " " + s.sy(P * (1 + r * t)).toFixed(1); }
      el("path", { d: area + "Z", fill: tone(), "fill-opacity": 0.15, stroke: "none" }, svg);
      el("line", { x1: s.sx(0), x2: s.sx(T), y1: s.sy(P), y2: s.sy(P), stroke: colour("--text-2"), "stroke-width": 1, "stroke-dasharray": "2 4" }, svg);
      path((t) => P * (1 + r * t), grey(), 2.5, "7 5");
      path((t) => grow(P, r, m, t), tone(), 3);
      // Doubling time marker
      const dbl = Math.log(2) / (m === Infinity ? r : m * Math.log(1 + r / m));
      if (r > 0 && dbl <= T) {
        el("line", { x1: s.sx(dbl), x2: s.sx(dbl), y1: s.sy(2 * P), y2: HT - pad.b, stroke: colour("--text-2"), "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);
        el("circle", { cx: s.sx(dbl), cy: s.sy(2 * P), r: 4.5, fill: tone() }, svg);
        el("text", { x: s.sx(dbl) + 7, y: s.sy(2 * P) - 7, style: "fill:var(--text)" }, svg).textContent = "doubled";
      }

      const out = $("cp-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{After " + T + " yrs: } \\text{£}" + Math.round(end).toLocaleString("en-GB") + " \\text{ compound vs } \\text{£}" + Math.round(simpleEnd).toLocaleString("en-GB") + "\\text{ simple}");
      tex(b, "\\text{Effective annual rate: } " + fmt(ear * 100, 2) + "\\% \\quad \\text{Doubles in } " + (r > 0 ? fmt(dbl, 1) + "\\text{ yrs}" : "\\text{never}"));

      const extra = end - simpleEnd;
      let story = "£1,000 at " + fmt(r * 100, 1) + "% for " + T + (T === 1 ? " year" : " years") + ". The shaded wedge is interest earned on earlier interest: " + money(extra) + " that simple interest would never pay. ";
      if (r * 100 >= 15) story += "At rates like these the wedge grows huge, which is why Nigerian savers can grow money fast in naira, and why credit card debt left unpaid gets out of hand so quickly. Rates this high usually come with high inflation, so check the real return.";
      else if (T >= 20) story += "Over long periods the wedge ends up bigger than all the simple interest put together: that's why starting to save early matters more than the amount.";
      else story += "Try 30 years, or a rate above 15%, and watch the wedge take over.";
      if (fi > 0 && r > 0) story += " Compounding " + FREQ[fi].n.toLowerCase() + " instead of once a year adds " + fmt((ear - r) * 100, 2) + " points a year.";
      $("cp-story").textContent = story;
    };

    buttons("cp-freq", FREQ, (k) => { fi = k; draw(); }, 0);
    buttons("cp-preset", PRESETS, (k) => { $("cp-r").value = PRESETS[k].r; draw(); }, 1);
    $("cp-r").addEventListener("input", () => { press("cp-preset", PRESETS.findIndex((p) => p.r === parseFloat($("cp-r").value))); draw(); });
    $("cp-t").addEventListener("input", draw);
    onResize("chart-comp", draw);
    H.charts(draw);
  }

  // ---------- Where does the overnight rate land? ----------
  if (has("chart-corr")) {
    // Ceiling = rate for borrowing from the central bank overnight; floor = rate for leaving cash there.
    const BANKS = [
      { n: "Bank of England", pol: 4, ceil: 4.25, floor: 4, liq: 85, rateName: "SONIA", polName: "Bank Rate",
        note: "Since 2009 the Bank of England has kept banks flush with reserves and pays Bank Rate on them, so the floor is the policy rate. Banks won't lend to each other for much less than the Bank pays them, so SONIA stays within a few hundredths of a point of Bank Rate (in practice just under it, because some lenders in the market can't deposit at the Bank themselves)." },
      { n: "Fed", pol: 3.875, ceil: 4, floor: 3.75, liq: 85, rateName: "Effective fed funds", polName: "Target range midpoint",
        note: "The Fed sets a range (3.75 to 4.00%) instead of one number. It pays interest on banks' reserves inside the range and offers to borrow and lend at its edges, so with plenty of reserves the overnight rate stays inside, near the middle." },
      { n: "CBN before Sept 2026", pol: 26.5, ceil: 27, floor: 22, liq: 90, rateName: "Interbank overnight", polName: "MPR",
        note: "MPR 26.5%, but banks were full of cash after recapitalisation and could earn 22% by leaving it at the CBN. So overnight lending traded around 22%, at the floor: the MPR was the official rate, the floor was the real one." },
      { n: "CBN from Sept 2026", pol: 23, ceil: 23.5, floor: 20, liq: 75, rateName: "Interbank overnight", polName: "MPR",
        note: "The CBN cut the MPR to 23% and narrowed the corridor to +0.5 / −3 points: lending facility 23.5%, deposit facility 20%. The policy rate moved down towards where the market was already trading." },
    ];
    let bi = 0;
    // Spare cash 0 = banks short of reserves (pushed to the ceiling); 100 = flush (rate sinks to the floor)
    const market = (B, L) => {
      const x = L / 100;
      const shape = 1 / (1 + Math.exp((x - 0.5) * 9));
      const lo = B.floor + 0.02 * (B.ceil - B.floor), hi = B.ceil - 0.02 * (B.ceil - B.floor);
      return lo + (hi - lo) * shape;
    };

    const draw = () => {
      const B = BANKS[bi], L = parseInt($("cr-liq").value, 10);
      $("cr-liq-out").textContent = L < 25 ? "Short" : L < 45 ? "Tight" : L < 60 ? "Balanced" : L < 80 ? "Plenty" : "Flush";
      const span = B.ceil - B.floor, yLo = B.floor - span * 0.35, yHi = B.ceil + span * 0.35;
      const svg = $("chart-corr");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 250 : 270;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: 52, r: 14, t: 16, b: 36 };
      const ty = [B.floor, B.pol, B.ceil].filter((v, i, arr) => arr.indexOf(v) === i);
      const s = frame(svg, W, HT, pad, [0, 100], [yLo, yHi], [], ty, (v) => fmt(v, 3) + "%");
      const t = tone(), gr = grey();
      // The corridor
      el("rect", { x: pad.l, y: s.sy(B.ceil), width: W - pad.l - pad.r, height: s.sy(B.floor) - s.sy(B.ceil), fill: t, "fill-opacity": 0.1 }, svg);
      [[B.ceil, "Ceiling: borrow from the central bank"], [B.floor, "Floor: leave cash at the central bank"]].forEach(([v, lab], k) => {
        el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(v), y2: s.sy(v), stroke: gr, "stroke-width": 2 }, svg);
        el("text", { x: W - pad.r - 4, y: k === 0 ? s.sy(v) - 6 : s.sy(v) + 15, "text-anchor": "end", style: W < 480 ? "font-size:11px" : "" }, svg).textContent = W < 480 ? (k === 0 ? "Ceiling" : "Floor") : lab;
      });
      if (B.pol !== B.floor && B.pol !== B.ceil) {
        el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(B.pol), y2: s.sy(B.pol), stroke: colour("--text"), "stroke-width": 1.5, "stroke-dasharray": "6 4" }, svg);
        const nearTop = B.ceil - B.pol < 0.25 * span;
        el("text", { x: pad.l + 6, y: nearTop ? s.sy(B.pol) + 15 : s.sy(B.pol) - 6, style: "fill:var(--text)" }, svg).textContent = B.polName;
      } else {
        el("text", { x: pad.l + 6, y: s.sy(B.pol) - 6, style: "fill:var(--text)" }, svg).textContent = B.polName + " = floor";
      }
      // Where the market rate sits for every amount of spare cash
      let d = "";
      for (let i = 0; i <= 100; i += 2) d += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(market(B, i)).toFixed(1);
      el("path", { d, fill: "none", stroke: t, "stroke-width": 2.5, "stroke-opacity": 0.45 }, svg);
      const mr = market(B, L);
      el("circle", { cx: s.sx(L), cy: s.sy(mr), r: 8, fill: t, stroke: colour("--hub-card") || "#fff", "stroke-width": 2 }, svg);
      el("text", { x: pad.l, y: HT - 10, style: "fill:var(--text)" }, svg).textContent = W < 480 ? "← short" : "← banks short of cash";
      el("text", { x: W - pad.r, y: HT - 10, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = W < 480 ? "flush →" : "banks flush →";

      const out = $("cr-read"); out.textContent = "";
      const a = document.createElement("span"); out.append(a);
      tex(a, "\\text{" + B.rateName + ": about } " + fmt(mr, 2) + "\\% \\quad \\text{" + B.polName + ": } " + fmt(B.pol, 3) + "\\%");
      let story = B.note;
      if (L < 30) story += " Now drag towards \"banks flush\": with cash short, banks bid up overnight money until it's cheaper to borrow from the central bank, so the rate presses against the ceiling.";
      $("cr-story").textContent = story;
    };

    buttons("cr-bank", BANKS, (k) => { bi = k; $("cr-liq").value = BANKS[k].liq; draw(); }, 0);
    $("cr-liq").addEventListener("input", draw);
    onResize("chart-corr", draw);
    H.charts(draw);
  }
})();