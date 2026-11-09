// Interactives for the note "QE and QT" (Macro · Central Banks and Rates).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour, frame } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const buttons = (boxId, items, onPick, start) => {
    const box = $(boxId);
    box.textContent = "";
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

  // ---------- Follow the money ----------
  if (has("chart-fm")) {
    // Holdings in £m: central bank (gilts, reserves owed to banks), bank (reserves, deposits owed to customers), pension fund (gilts, deposit, other assets)
    const START = { cbG: 0, cbR: 0, bkR: 0, bkD: 0, pfG: 100, pfD: 0, pfO: 0 };
    const MODES = [
      { n: "QE: buying", steps: [
        { n: "Start", s: START, arrows: [],
          text: "A pension fund owns £100m of gilts. The central bank wants long-term interest rates lower, but its policy rate is already near zero." },
        { n: "1. New money", s: { ...START, cbR: 0 }, arrows: ["cb"],
          text: "The central bank decides to buy £100m of gilts. It doesn't need to have the money first: it creates new reserves by typing a number into a commercial bank's account at the central bank. No notes are printed." },
        { n: "2. The swap", s: { cbG: 100, cbR: 100, bkR: 100, bkD: 100, pfG: 0, pfD: 100, pfO: 0 }, arrows: ["pf-cb:gilts", "cb-bk:new reserves", "bk-pf:deposit"],
          text: "The pension fund sells its gilts to the central bank. The central bank pays by adding £100m of new reserves to the pension fund's bank, and the bank adds £100m to the pension fund's deposit. The central bank now owns the gilts; the system has £100m more money in it." },
        { n: "3. Looking for a return", s: { cbG: 100, cbR: 100, bkR: 100, bkD: 100, pfG: 0, pfD: 0, pfO: 100 }, arrows: ["pf-mk:buys"],
          text: "The pension fund doesn't want cash earning almost nothing; it needs returns to pay pensions. So it buys company bonds and shares instead. The deposit passes to whoever sold them, but the £100m of reserves stays in the banking system: only the central bank can remove it." },
        { n: "4. The result", s: { cbG: 100, cbR: 100, bkR: 100, bkD: 100, pfG: 0, pfD: 0, pfO: 100 }, arrows: ["mk"],
          text: "With the central bank buying gilts and investors chasing other assets, gilt prices rise and their yields fall, then company bond yields fall and share and property prices rise. Borrowing for longer gets cheaper across the economy, which is the point." },
      ] },
      { n: "QT: unwinding", steps: [
        { n: "Start", s: { cbG: 100, cbR: 100, bkR: 100, bkD: 100, pfG: 0, pfD: 100, pfO: 0 }, arrows: [],
          text: "Years later, the central bank still owns £100m of gilts and the banking system still holds the £100m of reserves it created. Now it wants to shrink back." },
        { n: "1. Sell (or let mature)", s: { cbG: 0, cbR: 100, bkR: 100, bkD: 100, pfG: 100, pfD: 100, pfO: 0 }, arrows: ["cb-pf:gilts"],
          text: "Either the central bank sells the gilts back to investors (active QT, as the Bank of England has done), or it simply lets them mature and doesn't buy new ones (passive QT, as the Fed did)." },
        { n: "2. Money disappears", s: { cbG: 0, cbR: 0, bkR: 0, bkD: 0, pfG: 100, pfD: 0, pfO: 0 }, arrows: ["pf-bk:pays", "bk-cb:reserves go"],
          text: "The buyer pays from its bank deposit; the bank pays the central bank with its reserves, and those reserves vanish. QE created money out of nothing; QT deletes it again." },
        { n: "3. The result", s: { cbG: 0, cbR: 0, bkR: 0, bkD: 0, pfG: 100, pfD: 0, pfO: 0 }, arrows: ["mk"],
          text: "Private investors now have to hold more gilts, so they want a higher yield to do it: long-term borrowing costs rise a little and the banking system has less spare cash. Done too fast, it can strain markets, which is why QT is slow and announced in advance." },
      ] },
    ];
    let mi = 0, si = 0;
    const BOX = [
      { k: "cb", n: "Central bank", rows: (s) => [["Gilts", s.cbG], ["Reserves*", s.cbR]] },
      { k: "bk", n: "Bank", rows: (s) => [["Reserves", s.bkR], ["Deposits*", s.bkD]] },
      { k: "pf", n: "Pension fund", rows: (s) => [["Gilts", s.pfG], ["Deposit", s.pfD], ["Other", s.pfO]] },
      { k: "mk", n: "Other markets", rows: () => [] },
    ];
    const draw = () => {
      const M = MODES[mi], S = M.steps[si];
      const svg = $("chart-fm");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), narrow = W < 520;
      const cols = narrow ? 2 : 4, bw = (W - 16 - (cols - 1) * 26) / cols, bh = narrow ? 112 : 120, gapY = narrow ? 50 : 0;
      const HT = narrow ? bh * 2 + gapY + 28 : bh + 90;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      svg.textContent = "";
      const pos = {};
      // Order: central bank, bank, pension fund, markets. On a phone: 2x2 (CB, bank / markets, PF)
      const order = narrow ? { cb: [0, 0], bk: [1, 0], pf: [1, 1], mk: [0, 1] } : { cb: [0, 0], bk: [1, 0], pf: [2, 0], mk: [3, 0] };
      const t = tone(), g = grey();
      BOX.forEach((b) => {
        const [c, r] = order[b.k], x = 8 + c * (bw + 26), y = 22 + r * (bh + gapY);
        pos[b.k] = { x, y, cx: x + bw / 2, cy: y + bh / 2 };
        const lit = S.arrows.some((a) => a.split(":")[0].split("-").includes(b.k));
        el("rect", { x, y, width: bw, height: bh, rx: 12, fill: lit ? t : "transparent", "fill-opacity": lit ? 0.12 : 0, stroke: lit ? t : g, "stroke-width": lit ? 2 : 1.5 }, svg);
        el("text", { x: x + 12, y: y + 22, style: "fill:var(--text);font-weight:700;font-size:13px" }, svg).textContent = b.n;
        const rows = b.rows(S.s);
        if (!rows.length) {
          el("text", { x: x + 12, y: y + 46, style: "font-size:12px" }, svg).textContent = mi === 0 && si >= 4 ? "Prices up," : mi === 1 && si >= 3 ? "Yields up a little" : "Company bonds,";
          el("text", { x: x + 12, y: y + 62, style: "font-size:12px" }, svg).textContent = mi === 0 && si >= 4 ? "yields down" : mi === 1 && si >= 3 ? "" : "shares, property";
        }
        rows.forEach(([lab, v], i) => {
          const yy = y + 46 + i * 22;
          el("text", { x: x + 12, y: yy, style: "font-size:12px" }, svg).textContent = lab;
          el("text", { x: x + bw - 12, y: yy, "text-anchor": "end", style: "font-size:13px;font-weight:700;fill:" + (v ? "var(--text)" : "var(--text-2)") }, svg).textContent = "£" + v + "m";
        });
      });
      // Arrows for this step: straight between neighbouring boxes, curved underneath for longer jumps
      const defs = el("defs", {}, svg), mk = el("marker", { id: "fm-head", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
      el("path", { d: "M0 0 L10 5 L0 10 z", fill: t }, mk);
      const label = (x, y, txt, anchor) => {
        const tx = el("text", { x, y, "text-anchor": anchor || "middle", style: "fill:var(--text);font-size:11px;font-weight:600;paint-order:stroke;stroke:var(--hub-card);stroke-width:4px" }, svg);
        tx.textContent = txt;
      };
      S.arrows.filter((a) => a.includes("-")).forEach((spec) => {
        const [pair, txt] = spec.split(":"), [p, q] = pair.split("-"), A = pos[p], B = pos[q];
        const [ca, ra] = order[p], [cb2, rb] = order[q];
        if (ra === rb && Math.abs(ca - cb2) === 1) {
          const dir = Math.sign(cb2 - ca), x1 = dir > 0 ? A.x + bw + 2 : A.x - 2, x2 = dir > 0 ? B.x - 3 : B.x + bw + 3, y = A.cy + (dir > 0 ? -10 : 12);
          el("line", { x1, y1: y, x2, y2: y, stroke: t, "stroke-width": 2.5, "marker-end": "url(#fm-head)" }, svg);
          label((x1 + x2) / 2, Math.min(A.y, B.y) - 7, txt);
        } else if (ca === cb2 && Math.abs(ra - rb) === 1) {
          const dir = Math.sign(rb - ra), y1 = dir > 0 ? A.y + bh + 2 : A.y - 2, y2 = dir > 0 ? B.y - 3 : B.y + bh + 3, x = A.cx;
          el("line", { x1: x, y1, x2: x, y2, stroke: t, "stroke-width": 2.5, "marker-end": "url(#fm-head)" }, svg);
          label(x + 8, (y1 + y2) / 2 + 4, txt, "start");
        } else if (ra === rb) {
          const yb = A.y + bh + 2;
          el("path", { d: "M" + A.cx + " " + yb + " C " + A.cx + " " + (yb + 46) + ", " + B.cx + " " + (yb + 46) + ", " + B.cx + " " + (yb + 3), fill: "none", stroke: t, "stroke-width": 2.5, "marker-end": "url(#fm-head)" }, svg);
          label((A.cx + B.cx) / 2, yb + 50, txt);
        } else {
          const dx = B.cx - A.cx, dy = B.cy - A.cy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
          const x1 = A.cx + ux * bw * 0.45, y1 = A.cy + uy * bh * 0.55, x2 = B.cx - ux * bw * 0.45, y2 = B.cy - uy * bh * 0.55;
          el("line", { x1, y1, x2, y2, stroke: t, "stroke-width": 2.5, "marker-end": "url(#fm-head)" }, svg);
          label((x1 + x2) / 2, (y1 + y2) / 2 - 6, txt);
        }
      });
      $("fm-text").textContent = S.text;
      $("fm-prev").disabled = si === 0;
      $("fm-next").disabled = si === M.steps.length - 1;
    };
    const setMode = (k) => {
      mi = k; si = 0;
      buttons("fm-step", MODES[mi].steps, (j) => { si = j; draw(); }, 0);
      draw();
    };
    buttons("fm-mode", MODES, setMode, 0);
    buttons("fm-step", MODES[0].steps, (j) => { si = j; draw(); }, 0);
    $("fm-prev").addEventListener("click", () => { si = Math.max(0, si - 1); press("fm-step", si); draw(); });
    $("fm-next").addEventListener("click", () => { si = Math.min(MODES[mi].steps.length - 1, si + 1); press("fm-step", si); draw(); });
    onResize("chart-fm", draw);
    H.charts(draw);
  }

  // ---------- The balance sheet over time ----------
  if (has("chart-bs")) {
    // Rounded, approximate year-end levels (2026: latest available)
    const SERIES = [
      { n: "Fed", unit: "$tn", fmt: (v) => "$" + v + "tn",
        data: [[2006, 0.87], [2007, 0.89], [2008, 2.24], [2009, 2.24], [2010, 2.42], [2011, 2.93], [2012, 2.91], [2013, 4.03], [2014, 4.5], [2015, 4.49], [2016, 4.45], [2017, 4.45], [2018, 4.08], [2019, 4.17], [2020, 7.36], [2021, 8.76], [2022, 8.55], [2023, 7.71], [2024, 6.85], [2025, 6.6], [2026, 6.7]],
        events: [
          { y: 2008, n: "2008: QE1", t: "Lehman collapses; the Fed starts buying mortgage bonds and Treasuries, and its balance sheet more than doubles in months." },
          { y: 2012, n: "2012: QE3", t: "Open-ended buying of $85bn a month, with no end date, until the jobs market improved." },
          { y: 2017, n: "2017: first QT", t: "The Fed starts letting bonds mature. It stops in mid-2019; weeks later, in September 2019, overnight rates spike as reserves run short, and it starts buying bills again." },
          { y: 2020, n: "2020: Covid", t: "About $3 trillion of buying in a few months to keep markets working and borrowing costs low." },
          { y: 2022, n: "2022: peak, QT", t: "Assets peak near $9 trillion. QT starts in June, letting up to $95bn a month mature." },
          { y: 2025, n: "2025: QT ends", t: "QT stops on 1 December 2025 as money markets tighten; the Fed starts buying T-bills again to keep reserves ample (\"reserve management purchases\")." },
          { y: 2026, n: "2026: Warsh", t: "About $6.7 trillion. The new chair wants a smaller balance sheet and set up a task force in June 2026 to review it." },
        ] },
      { n: "Bank of England", unit: "£bn of gilts", fmt: (v) => "£" + v + "bn",
        data: [[2006, 0], [2007, 0], [2008, 0], [2009, 198], [2010, 198], [2011, 250], [2012, 375], [2013, 375], [2014, 375], [2015, 375], [2016, 420], [2017, 435], [2018, 435], [2019, 435], [2020, 745], [2021, 875], [2022, 840], [2023, 750], [2024, 655], [2025, 555], [2026, 488]],
        events: [
          { y: 2009, n: "2009: QE begins", t: "Bank Rate cut to 0.5%; the Bank starts buying gilts, about £200bn in the first round." },
          { y: 2012, n: "2012: £375bn", t: "More rounds during the euro crisis take the total to £375bn." },
          { y: 2016, n: "2016: Brexit vote", t: "Another £60bn of gilts (and some company bonds) after the referendum." },
          { y: 2020, n: "2020: Covid", t: "£450bn more in 2020, taking gilt holdings to £875bn by the end of 2021." },
          { y: 2022, n: "2022: QT, and LDI", t: "QT starts in February. In September, the mini-budget gilt crash forces a pause: the Bank buys about £19bn of long gilts for two weeks to stop pension funds' forced selling." },
          { y: 2026, n: "Sept 2026: new plan", t: "£488bn left. The Bank sets a path to zero for monetary policy by 2034, stops selling long-dated gilts and pauses sales until April 2027 while it looks at selling through the Debt Management Office." },
        ] },
    ];
    let si = 0, ei = -1;
    const draw = () => {
      const S = SERIES[si];
      const svg = $("chart-bs");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 250 : 280;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: 46, r: 14, t: 16, b: 34 };
      const top = Math.max(...S.data.map((d) => d[1]));
      const yMax = si === 0 ? 10 : 1000, yt = si === 0 ? [0, 2, 4, 6, 8, 10] : [0, 250, 500, 750, 1000];
      const s = frame(svg, W, HT, pad, [2006, 2026], [0, yMax], W < 480 ? [2006, 2011, 2016, 2021, 2026] : [2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026], yt, (v) => si === 0 ? "$" + v + "tn" : "£" + v + "bn");
      let d = "", area = "";
      S.data.forEach(([x, v], i) => { const p = s.sx(x).toFixed(1) + " " + s.sy(v).toFixed(1); d += (i ? "L" : "M") + p; area += (i ? "L" : "M") + p; });
      area += "L" + s.sx(2026) + " " + s.sy(0) + "L" + s.sx(2006) + " " + s.sy(0) + "Z";
      el("path", { d: area, fill: tone(), "fill-opacity": 0.14 }, svg);
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 3, "stroke-linejoin": "round" }, svg);
      S.events.forEach((e, k) => {
        const v = S.data.find((p) => p[0] === e.y)[1], on = k === ei;
        el("circle", { cx: s.sx(e.y), cy: s.sy(v), r: on ? 8 : 5, fill: on ? tone() : colour("--hub-card") || "#fff", stroke: tone(), "stroke-width": 2 }, svg);
      });
      if (ei >= 0) {
        const e = S.events[ei], v = S.data.find((p) => p[0] === e.y)[1];
        el("line", { x1: s.sx(e.y), x2: s.sx(e.y), y1: s.sy(v) + 8, y2: HT - pad.b, stroke: colour("--text-2"), "stroke-dasharray": "3 3" }, svg);
        $("bs-story").textContent = e.t;
      } else {
        $("bs-story").textContent = si === 0
          ? "The Fed's balance sheet went from under $1 trillion before 2008 to almost $9 trillion in 2022, and has only come part of the way back. Pick an event to see what happened."
          : "The Bank of England's gilt holdings went from nothing in 2008 to £875bn in 2021, about a third of all gilts, and have been shrinking since 2022. Pick an event to see what happened.";
      }
      const last = S.data[S.data.length - 1][1];
      const out = $("bs-read"); out.textContent = "";
      const a = document.createElement("span"); out.append(a);
      tex(a, "\\text{Peak: } " + S.fmt(top).replace("$", "\\$").replace("£", "\\text{£}") + " \\quad \\text{Latest: } " + S.fmt(last).replace("$", "\\$").replace("£", "\\text{£}"));
    };
    const setSeries = (k) => {
      si = k; ei = -1;
      buttons("bs-event", SERIES[si].events, (j) => { ei = j; draw(); }, -1);
      draw();
    };
    buttons("bs-series", SERIES, setSeries, 0);
    buttons("bs-event", SERIES[0].events, (j) => { ei = j; draw(); }, -1);
    onResize("chart-bs", draw);
    H.charts(draw);
  }
})();