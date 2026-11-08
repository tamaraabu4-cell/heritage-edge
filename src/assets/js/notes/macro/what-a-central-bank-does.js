// Interactives for the note "What a Central Bank Does" (Macro · Central Banks and Rates).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour, frame } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

  // Small helper: a row of toggle buttons
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
    return box;
  };
  const press = (boxId, i) => [...$(boxId).children].forEach((c, k) => c.setAttribute("aria-pressed", k === i ? "true" : "false"));
  // Redraw a chart when its width changes, so it is always drawn at its real size
  const onResize = (id, draw) => {
    let lastW = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($(id).getBoundingClientRect().width);
      if (w && w !== lastW) { lastW = w; draw(); }
    });
  };
  const fmt = (v) => (Math.round(v * 10) / 10).toString();

  // ---------- Same economy, different rulebook ----------
  if (has("chart-mandate")) {
    // How much each bank weighs inflation above 2% against unemployment above its normal level.
    // A teaching simplification, not a real policy rule.
    const BANKS = [
      { n: "Fed", full: "the Fed", wP: 1, wU: 1, why: "Its dual mandate gives jobs and prices equal billing." },
      { n: "Bank of England", full: "the Bank of England", wP: 1, wU: 0.5, why: "Prices come first; supporting growth and jobs is a secondary objective." },
      { n: "ECB", full: "the ECB", wP: 1, wU: 0.3, why: "Its treaty puts price stability first; growth only counts once prices are under control." },
    ];
    const PRESETS = [
      { n: "Goldilocks (US 2019)", p: 2, u: 3.5 },
      { n: "Slump (US 2009)", p: 0, u: 9.5 },
      { n: "Overheating (US 2022)", p: 8, u: 3.5 },
      { n: "Stagflation (US 1980)", p: 13.5, u: 7 },
      { n: "Mild stagflation (made up)", p: 4.5, u: 7.5 },
    ];
    const U_STAR = 4.5, X = [-2, 14], Y = [2, 12];
    let bi = 0;

    const lean = (b, p, u) => b.wP * (p - 2) - b.wU * (u - U_STAR);

    const draw = () => {
      const p = parseFloat($("cb-pi").value), u = parseFloat($("cb-u").value);
      $("cb-pi-out").textContent = fmt(p) + "%";
      $("cb-u-out").textContent = fmt(u) + "%";
      const b = BANKS[bi], L = lean(b, p, u);

      const svg = $("chart-mandate");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 300 : 340;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: 40, r: 12, t: 30, b: 40 };
      const s = frame(svg, W, HT, pad, X, Y, W < 480 ? [0, 4, 8, 12] : [-2, 0, 2, 4, 6, 8, 10, 12, 14], [2, 4, 6, 8, 10, 12], (v) => v + "%");
      const t = tone(), g = grey();

      // Shade the map: where would this bank lean towards raising (tone) or cutting (grey)?
      const NX = 32, NY = 20, cw = (s.sx(X[1]) - s.sx(X[0])) / NX, ch = (s.sy(Y[0]) - s.sy(Y[1])) / NY;
      const cells = el("g", {}, svg);
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const cp = X[0] + (i + 0.5) * (X[1] - X[0]) / NX, cu = Y[0] + (j + 0.5) * (Y[1] - Y[0]) / NY;
        const v = lean(b, cp, cu);
        if (Math.abs(v) < 0.75) continue;
        const op = Math.min(0.42, 0.08 + Math.abs(v) * 0.035);
        el("rect", { x: s.sx(X[0]) + i * cw, y: s.sy(cu) - ch / 2, width: cw + 0.5, height: ch + 0.5, fill: v > 0 ? t : g, "fill-opacity": op }, cells);
      }
      svg.insertBefore(cells, svg.firstChild);

      // The target and the "normal" unemployment level
      el("line", { x1: s.sx(2), x2: s.sx(2), y1: pad.t, y2: HT - pad.b, stroke: colour("--text-2"), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(U_STAR), y2: s.sy(U_STAR), stroke: colour("--text-2"), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      el("text", { x: s.sx(2) + 5, y: pad.t + 12, style: "fill:var(--text)" }, svg).textContent = "2% target";
      el("text", { x: W - pad.r - 4, y: s.sy(U_STAR) - 6, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = "normal jobless rate";
      if (W >= 480) {
        el("text", { x: W - pad.r - 4, y: pad.t + 12, "text-anchor": "end" }, svg).textContent = "Prices and jobs both bad";
        el("text", { x: W - pad.r - 4, y: HT - pad.b - 8, "text-anchor": "end" }, svg).textContent = "Overheating";
        el("text", { x: s.sx(-2) + 6, y: pad.t + 30 }, svg).textContent = "Slump";
      }
      // Axis titles
      el("text", { x: W - pad.r, y: HT - 6, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = "Inflation →";
      el("text", { x: 4, y: 14, style: "fill:var(--text)" }, svg).textContent = "↑ Unemployment";

      // The economy you set
      const cx = s.sx(p), cy = s.sy(u);
      el("circle", { cx, cy, r: 9, fill: colour("--hub-card") || "#fff", stroke: colour("--text"), "stroke-width": 2.5 }, svg);
      el("circle", { cx, cy, r: 3.5, fill: colour("--text") }, svg);

      const word = L > 0.75 ? "Raise rates" : L < -0.75 ? "Cut rates" : "Hold, or split";
      const out = $("cb-read"); out.textContent = "";
      const a = document.createElement("span"), c = document.createElement("span"); out.append(a, c);
      tex(a, "\\text{" + b.full.replace(/^the /, "The ") + " leans: " + word + "}");
      tex(c, "\\text{Lean score: } (" + fmt(p) + " - 2) - " + b.wU + " \\times (" + fmt(u) + " - " + U_STAR + ") = " + fmt(L));

      let story;
      const pricesBad = p > 2.75, jobsBad = u > U_STAR + 0.75;
      const verb = (x) => { const v = lean(x, p, u); return v > 0.75 ? "lean to raising" : v < -0.75 ? "lean to cutting" : "sit on the fence"; };
      const rest = BANKS.filter((x) => x !== b);
      const others = verb(rest[0]) === verb(rest[1])
        ? [rest[0].full + " and " + rest[1].full + " would both " + verb(rest[0])]
        : rest.map((x) => x.full + " would " + verb(x));
      if (pricesBad && jobsBad) story = "Both goals are being missed at once: prices rising too fast and too many people out of work. Raising rates fights inflation but costs more jobs; cutting helps jobs but lets inflation run. " + b.why + " Under their own rules, " + others.join(", while ") + ". Same economy, different rulebook.";
      else if (pricesBad) story = "Prices are rising too fast while jobs are fine. Every mandate points the same way here: raise rates to cool spending. " + b.why;
      else if (jobsBad) story = "Inflation is at or below target and too many people are out of work. Cutting rates helps jobs and doesn't threaten prices, so every bank leans the same way. " + b.why;
      else story = "Inflation near 2% and unemployment near normal: nothing to fix, so the bank can sit still. This is the calm every central bank is aiming for.";
      $("cb-story").textContent = story;
    };

    buttons("cb-bank", BANKS, (k) => { bi = k; draw(); }, 0);
    buttons("cb-preset", PRESETS, (k) => { $("cb-pi").value = PRESETS[k].p; $("cb-u").value = PRESETS[k].u; draw(); }, 4);
    ["cb-pi", "cb-u"].forEach((id) => $(id).addEventListener("input", () => { press("cb-preset", -1); draw(); }));
    onResize("chart-mandate", draw);
    H.charts(draw);
  }

  // ---------- Same shock, different trust ----------
  if (has("chart-cred")) {
    const MONTHS = 48, Q = 0.06, FADE = 0.85;
    const PRESETS = [{ n: "Trusted", c: 90 }, { n: "Doubted", c: 50 }, { n: "Trust lost", c: 20 }];
    // People expect a mix of the target and last month's inflation; the bank's squeeze removes a little more each month.
    const path = (c, S) => {
      const pi = [2];
      for (let t = 1; t <= MONTHS; t++) pi.push(2 + (1 - c) * (1 - Q) * (pi[t - 1] - 2) + S * Math.pow(FADE, t - 1));
      return pi;
    };
    const extraPrices = (pi) => {
      let a = 1, b = 1;
      for (let t = 1; t < pi.length; t++) { a *= 1 + pi[t] / 1200; b *= 1 + 2 / 1200; }
      return (a / b - 1) * 100;
    };
    const months3 = (pi) => pi.filter((v) => v > 3).length;

    const draw = () => {
      const c = parseInt($("cr-c").value, 10) / 100, S = parseFloat($("cr-s").value);
      $("cr-c-out").textContent = Math.round(c * 100) + "%";
      $("cr-s-out").textContent = "+" + fmt(S) + " pts";
      const mine = path(c, S), best = path(1, S);
      const top = Math.max(...mine, ...best);
      const steps = [6, 8, 10, 12, 16, 20, 25, 30];
      const yMax = steps.find((v) => v >= top + 0.5) || Math.ceil(top);
      const yt = []; const st = yMax <= 8 ? 2 : yMax <= 16 ? 4 : 5;
      for (let v = 0; v <= yMax; v += st) yt.push(v);

      const svg = $("chart-cred");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 250 : 280;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: 40, r: 14, t: 14, b: 36 };
      const s = frame(svg, W, HT, pad, [0, MONTHS], [0, yMax], W < 480 ? [0, 12, 24, 36, 48] : [0, 6, 12, 18, 24, 30, 36, 42, 48], yt, (v) => v + "%");
      const line = (arr, stroke, w, dash) => {
        let d = "";
        arr.forEach((v, i) => { d += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(Math.min(v, yMax)).toFixed(1); });
        el("path", { d, fill: "none", stroke, "stroke-width": w, "stroke-linejoin": "round", "stroke-dasharray": dash || "none" }, svg);
      };
      el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(2), y2: s.sy(2), stroke: colour("--text-2"), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      el("text", { x: W - pad.r - 4, y: s.sy(2) - 6, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = "2% target";
      line(best, grey(), 2.5, "7 5");
      line(mine, tone(), 3);
      el("text", { x: W - pad.r, y: HT - 6, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = "Months after the shock →";

      const peak = Math.max(...mine), m3 = months3(mine), ex = extraPrices(mine), exBest = extraPrices(best);
      const out = $("cr-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Peak inflation: } " + fmt(peak) + "\\% \\quad \\text{Months above } 3\\%\\text{: } " + m3 + (m3 >= MONTHS ? "+" : ""));
      tex(b, "\\text{Extra rise in prices after 4 years: } " + fmt(ex) + "\\%\\ (\\text{fully trusted: } " + fmt(exBest) + "\\%)");

      let story;
      if (c >= 0.85) story = "People believe the bank will get inflation back to 2%, so they don't build the shock into their pay claims and prices. Inflation jumps with the shock, then falls back almost as fast as the shock fades. The bank barely has to squeeze.";
      else if (c >= 0.45) story = "Some people expect today's high inflation to continue, so they ask for bigger pay rises and shops keep raising prices. The shock fades in a few months, but inflation lingers for " + m3 + " months above 3%. The bank has to keep rates high for longer to finish the job, which costs jobs.";
      else story = "Hardly anyone believes the 2% promise, so each month's inflation becomes next month's expectation. The shock feeds on itself: inflation peaks at " + fmt(peak) + "% and stays above 3% for " + (m3 >= MONTHS ? "the whole four years" : m3 + " months") + ". Over the four years, prices rise " + fmt(ex - exBest) + " percentage points more than a trusted bank would have allowed. This is what the 1970s looked like, and why Volcker needed rates near 20% to break it.";
      $("cr-story").textContent = story;
    };

    buttons("cr-preset", PRESETS, (k) => { $("cr-c").value = PRESETS[k].c; draw(); }, -1);
    $("cr-c").addEventListener("input", () => { press("cr-preset", PRESETS.findIndex((p) => p.c === parseInt($("cr-c").value, 10))); draw(); });
    $("cr-s").addEventListener("input", draw);
    press("cr-preset", PRESETS.findIndex((p) => p.c === parseInt($("cr-c").value, 10)));
    onResize("chart-cred", draw);
    H.charts(draw);
  }
})();