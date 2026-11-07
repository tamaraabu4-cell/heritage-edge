// Charts for the note "Margin and Leverage" (Markets · How Markets Work).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, frame, tex, colour, money } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const pct = (v) => Math.round(v * 100);

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
  };
  // A path through points, keeping only the parts inside [lo, hi]
  const clipped = (pts, f, lo, hi) => {
    let d = "", pen = false;
    pts.forEach(([x, y]) => {
      if (y < lo || y > hi || !isFinite(y)) { pen = false; return; }
      d += (pen ? "L" : "M") + f.sx(x).toFixed(1) + "," + f.sy(y).toFixed(1);
      pen = true;
    });
    return d;
  };

  // ---------- Same share, different leverage ----------
  if (has("chart-path")) {
    // The share's price, month by month: down 40% by month 9, up 20% by month 24
    const KEY = [[0, 100], [2, 95], [4, 88], [6, 76], [8, 64], [9, 60], [10, 63], [12, 68], [14, 74], [16, 82], [18, 90], [20, 97], [22, 108], [24, 120]];
    const PRICE = [];
    for (let m = 0; m <= 24; m++) {
      const k = KEY.findIndex(([km]) => km >= m);
      const [m1, p1] = KEY[k], [m0, p0] = KEY[Math.max(0, k - 1)];
      PRICE.push(m1 === m0 ? p1 : p0 + ((p1 - p0) * (m - m0)) / (m1 - m0));
    }
    const MAINT = 0.10;
    const draw = () => {
      const L = parseFloat($("lev-l").value);
      $("lev-l-out").textContent = (L % 1 ? L.toFixed(1) : L) + "×";
      const t = tone(), g = grey(), c = card();
      // Equity starts at 100; the position is L × 100, the loan (L − 1) × 100
      let called = -1;
      const eq = [];
      PRICE.forEach((p, m) => {
        if (called >= 0) { eq.push(eq[called]); return; }
        const r = p / 100, e = 100 * (L * r - (L - 1));
        eq.push(Math.max(0, e));
        if (L > 1 && e / (100 * L * r) < MAINT) called = m;
      });
      const svg = $("chart-path"), W = 640, Ht = 300, pad = { l: 48, r: 24, t: 16, b: 38 };
      const f = frame(svg, W, Ht, pad, [0, 24], [0, 160], [], [0, 40, 80, 120, 160], (y) => y);
      [0, 6, 12, 18, 24].forEach((x) => {
        el("text", { x: f.sx(x), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = x;
      });
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "months (everything starts at 100)";

      // The share itself = equity with no leverage
      el("path", { d: clipped(PRICE.map((p, m) => [m, p]), f, 0, 160), fill: "none", stroke: g, "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);

      // Your equity: solid while open, dashed once you've been closed out
      const end = called >= 0 ? called : 24;
      el("path", { d: clipped(eq.slice(0, end + 1).map((e, m) => [m, e]), f, 0, 160), fill: "none", stroke: t, "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
      if (called >= 0) {
        el("line", { x1: f.sx(called), x2: f.sx(24), y1: f.sy(eq[called]), y2: f.sy(eq[called]), stroke: t, "stroke-width": 2, "stroke-dasharray": "2 5" }, svg);
        el("circle", { cx: f.sx(called), cy: f.sy(eq[called]), r: 7, fill: c, stroke: t, "stroke-width": 3 }, svg);
        el("text", { x: f.sx(called) + 12, y: f.sy(eq[called]) - 10, style: "fill:" + t }, svg).textContent = "closed out, month " + called;
      } else {
        el("circle", { cx: f.sx(24), cy: f.sy(eq[24]), r: 7, fill: t, stroke: c, "stroke-width": 2 }, svg);
      }

      const low = Math.min(...eq.slice(0, end + 1)), lowAt = eq.indexOf(low);
      const out = $("lev-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Lowest: } " + Math.round(low) + "\\ (" + (low < 100 ? "-" : "+") + Math.abs(Math.round(low - 100)) + "\\%)");
      tex(b, called >= 0
        ? "\\text{Closed out in month } " + called + "\\text{ with } " + Math.round(eq[called]) + "\\text{ left}"
        : "\\text{End: } " + Math.round(eq[24]) + "\\ (+" + Math.round(eq[24] - 100) + "\\%)");

      let story;
      if (L === 1) story = "No borrowing, so no lender and no margin call. You sat through a 40% fall and finished 20% up. Uncomfortable, but you were still there for the recovery.";
      else if (called < 0) story = "You survived and finished " + Math.round(eq[24] - 100) + "% up, more than the share's 20%. But in month " + lowAt + " your equity was down " + Math.round(100 - low) + "%. A slightly deeper fall and the lender would have closed you out at the bottom.";
      else story = "The share finished 20% up, so you were right. It didn't matter: in month " + called + " your equity fell below the 10% cushion and the lender sold you out with " + Math.round(eq[called]) + " of your 100 left. The recovery happened without you. A temporary fall became a permanent loss.";
      $("lev-story").textContent = story;
    };
    $("lev-l").addEventListener("input", draw);
    H.charts(draw);
  }

  // ---------- Where does the margin call arrive? ----------
  if (has("chart-call")) {
    const N = 1000, P0 = 50;
    const SIDES = [{ n: "Long" }, { n: "Short" }];
    let side = 0;
    const draw = () => {
      const i = parseInt($("mc-i").value, 10) / 100;
      const m = parseInt($("mc-m").value, 10) / 100;
      const P = parseFloat($("mc-p").value);
      $("mc-i-out").textContent = pct(i) + "%";
      $("mc-m-out").textContent = pct(m) + "%";
      $("mc-p-out").textContent = P.toFixed(2);
      const long = side === 0;
      const loan = N * P0 * (1 - i);          // long: what you borrowed
      const cash = N * P0 * (1 + i);          // short: sale proceeds plus your deposit
      const equity = (p) => (long ? N * p - loan : cash - N * p);
      const ratio = (p) => equity(p) / (N * p);
      const pCall = long ? (loan > 0 ? loan / (N * (1 - m)) : null) : cash / (N * (1 + m));

      const t = tone(), g = grey(), c = card();
      const svg = $("chart-call"), W = 640, Ht = 300, pad = { l: 52, r: 24, t: 16, b: 38 };
      const f = frame(svg, W, Ht, pad, [20, 80], [-20, 100], [], [-20, 0, 20, 40, 60, 80, 100], (y) => y + "%");
      [20, 30, 40, 50, 60, 70, 80].forEach((x) => {
        el("text", { x: f.sx(x), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = x;
      });
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "share price";

      // Entry price
      el("line", { x1: f.sx(P0), x2: f.sx(P0), y1: f.sy(-20), y2: f.sy(100), stroke: g, "stroke-opacity": 0.5 }, svg);
      el("text", { x: f.sx(P0) + 6, y: f.sy(100) + 14, style: "fill:" + g }, svg).textContent = "entry 50";

      // Maintenance line
      el("line", { x1: f.sx(20), x2: f.sx(80), y1: f.sy(m * 100), y2: f.sy(m * 100), stroke: g, "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);

      // Where the call arrives
      if (pCall !== null && pCall >= 20 && pCall <= 80) {
        el("line", { x1: f.sx(pCall), x2: f.sx(pCall), y1: f.sy(-20), y2: f.sy(100), stroke: t, "stroke-dasharray": "2 4" }, svg);
        const leftSide = pCall > 66;
        el("text", { x: f.sx(pCall) + (leftSide ? -6 : 6), y: f.sy(-20) - 8, "text-anchor": leftSide ? "end" : "start", style: "fill:" + t }, svg).textContent = "call at " + pCall.toFixed(2);
      }

      // Equity ratio curve
      const pts = [];
      for (let p = 20; p <= 80.001; p += 0.25) pts.push([p, ratio(p) * 100]);
      el("path", { d: clipped(pts, f, -20, 100), fill: "none", stroke: t, "stroke-width": 3, "stroke-linecap": "round" }, svg);
      const r = ratio(P) * 100, rc = Math.max(-20, Math.min(100, r));
      el("circle", { cx: f.sx(P), cy: f.sy(rc), r: 7, fill: r < m * 100 ? c : t, stroke: t, "stroke-width": 3 }, svg);

      const eq = equity(P);
      const out = $("mc-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Equity } " + (eq < 0 ? "-" : "") + money(Math.abs(eq)) + " = " + Math.round(r) + "\\% \\text{ of the position}");
      if (pCall === null) tex(b, "\\text{No loan, so no margin call}");
      else {
        const move = (pCall - P0) / P0;
        tex(b, "\\text{Call at } " + pCall.toFixed(2) + "\\ (\\text{a } " + Math.abs(move * 100).toFixed(1) + "\\% \\text{ " + (move < 0 ? "fall" : "rise") + "})");
      }

      let story;
      if (pCall === null) story = "You paid for every share with your own money, so there's no lender to protect and no margin call, whatever the price does. That's what no leverage means.";
      else if (r < 0) story = "Your equity is below zero: the position has lost more than your whole deposit, and you'd owe the broker the difference. In real life the broker would have sold you out long before the price got here.";
      else if (r < m * 100) {
        const topUp = m * N * P - eq;
        story = "Margin call. Your equity is only " + Math.round(r) + "% of the position, under the " + pct(m) + "% minimum. Pay in about £" + Math.round(topUp).toLocaleString("en-GB") + " to get back to " + pct(m) + "%, or the broker starts selling." + (ratio(P0) < m ? " (With these settings you'd be called the moment you opened the position: no broker would let you start below maintenance.)" : "");
      } else {
        const room = Math.abs(pCall - P) / P;
        story = (long ? "Safe for now. The price can fall another " : "Safe for now. The price can rise another ") + (room * 100).toFixed(1) + "% before the call arrives." + (long ? " Notice how the curve bends down faster as the price falls: the loan stays the same while your slice shrinks." : " On a short, the call comes on a rise, and there's no limit to how far a price can rise.");
      }
      $("mc-story").textContent = story;
    };
    buttons("mc-side", SIDES, (k) => { side = k; draw(); }, 0);
    ["mc-i", "mc-m", "mc-p"].forEach((id) => $(id).addEventListener("input", draw));
    H.charts(draw);
  }
})();