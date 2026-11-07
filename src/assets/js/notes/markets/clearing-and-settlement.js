// Charts for the note "Clearing and Settlement" (Markets · How Markets Work).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const n0 = (v) => Math.round(v).toLocaleString("en-GB");

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

  // ---------- Netting through the clearing house ----------
  if (has("chart-net")) {
    // Each trade: [seller, buyer, shares]
    const DAYS = [
      { n: "Quiet day", trades: [["A", "B", 10000], ["B", "C", 8000], ["C", "A", 6000], ["D", "A", 4000], ["B", "D", 5000], ["C", "D", 3000]] },
      { n: "Busy day", trades: [["A", "B", 7000], ["B", "A", 4000], ["A", "C", 5000], ["C", "B", 6000], ["B", "D", 9000], ["D", "C", 3000], ["C", "A", 8000], ["D", "A", 2000], ["A", "D", 6000], ["B", "C", 2000], ["C", "D", 4000], ["D", "B", 5000]] },
    ];
    const MODES = [{ n: "Trade by trade" }, { n: "Through the clearing house" }];
    const POS = { A: [95, 62], B: [545, 62], C: [545, 318], D: [95, 318], CCP: [320, 190] };
    const HW = 55, HH = 24, CW = 80, CH = 30;
    let di = 0, mi = 0;

    // Point where the line from a box's centre towards (tx, ty) leaves the box
    const edge = (cx, cy, tx, ty, hw, hh) => {
      const dx = tx - cx, dy = ty - cy;
      const t = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9));
      return [cx + dx * t, cy + dy * t];
    };
    const arrow = (svg, from, to, fromHalf, toHalf, offset, col, label, labelAt) => {
      const [fx, fy] = POS[from], [tx, ty] = POS[to];
      const len = Math.hypot(tx - fx, ty - fy), nx = -(ty - fy) / len, ny = (tx - fx) / len;
      const ox = nx * offset, oy = ny * offset;
      const [x1, y1] = edge(fx + ox, fy + oy, tx + ox, ty + oy, fromHalf[0], fromHalf[1]);
      const [x2, y2] = edge(tx + ox, ty + oy, fx + ox, fy + oy, toHalf[0], toHalf[1]);
      const ux = (x2 - x1) / Math.hypot(x2 - x1, y2 - y1), uy = (y2 - y1) / Math.hypot(x2 - x1, y2 - y1);
      const gap = 6, hx = x2 - ux * gap, hy = y2 - uy * gap;
      el("line", { x1, y1, x2: hx - ux * 8, y2: hy - uy * 8, stroke: col, "stroke-width": 2.5, "stroke-linecap": "round" }, svg);
      el("polygon", { points: hx + "," + hy + " " + (hx - ux * 12 + uy * 6) + "," + (hy - uy * 12 - ux * 6) + " " + (hx - ux * 12 - uy * 6) + "," + (hy - uy * 12 + ux * 6), fill: col }, svg);
      const lx = x1 + (x2 - x1) * labelAt + nx * 12 * Math.sign(offset || 1), ly = y1 + (y2 - y1) * labelAt + ny * 12 * Math.sign(offset || 1);
      el("text", { x: lx, y: ly + 4, "text-anchor": "middle", style: "fill:" + col + ";font-weight:600" }, svg).textContent = label;
    };

    const draw = () => {
      const trades = DAYS[di].trades, ccp = mi === 1;
      const t = tone(), g = grey(), c = card();
      const svg = $("chart-net");
      svg.textContent = "";
      const net = { A: 0, B: 0, C: 0, D: 0 };
      trades.forEach(([s, b, q]) => { net[s] -= q; net[b] += q; });
      const gross = trades.reduce((sum, tr) => sum + tr[2], 0);
      const netMoved = Object.values(net).reduce((sum, v) => sum + Math.abs(v), 0);
      const netDeliveries = Object.values(net).filter((v) => v !== 0).length;

      if (!ccp) {
        // Several trades between the same two firms sit side by side
        const seen = {};
        trades.forEach(([s, b, q]) => {
          const key = [s, b].sort().join("");
          const k = (seen[key] = (seen[key] || 0) + 1) - 1;
          const dir = s < b ? 1 : -1;
          const offset = (k % 2 === 0 ? 1 : -1) * (8 + 12 * Math.floor(k / 2)) * dir;
          arrow(svg, s, b, [HW, HH], [HW, HH], offset, t, (q / 1000) + "k", 0.3);
        });
      } else {
        el("rect", { x: POS.CCP[0] - CW, y: POS.CCP[1] - CH, width: CW * 2, height: CH * 2, rx: 12, fill: card(), stroke: t, "stroke-width": 2.5 }, svg);
        el("text", { x: POS.CCP[0], y: POS.CCP[1] - 4, "text-anchor": "middle", style: "font-size:15px;font-weight:600;fill:var(--text)" }, svg).textContent = "Clearing house";
        el("text", { x: POS.CCP[0], y: POS.CCP[1] + 16, "text-anchor": "middle" }, svg).textContent = "buyer to every seller";
        Object.keys(net).forEach((f) => {
          const v = net[f];
          if (v < 0) arrow(svg, f, "CCP", [HW, HH], [CW, CH], 0, t, n0(-v), 0.5);
          if (v > 0) arrow(svg, "CCP", f, [CW, CH], [HW, HH], 0, t, n0(v), 0.5);
        });
      }
      // Firms
      Object.keys(net).forEach((f) => {
        const [x, y] = POS[f];
        el("rect", { x: x - HW, y: y - HH, width: HW * 2, height: HH * 2, rx: 10, fill: c, stroke: g, "stroke-width": 1.5 }, svg);
        el("text", { x, y: y + (ccp ? -3 : 5), "text-anchor": "middle", style: "font-size:15px;font-weight:600;fill:var(--text)" }, svg).textContent = "Firm " + f;
        if (ccp) el("text", { x, y: y + 15, "text-anchor": "middle" }, svg).textContent = net[f] === 0 ? "nothing to settle" : "net " + (net[f] > 0 ? "+" : "−") + n0(Math.abs(net[f]));
      });

      const out = $("net-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      a.textContent = "Trade by trade: " + trades.length + " deliveries, " + n0(gross) + " shares moving";
      b.textContent = "Through the clearing house: " + netDeliveries + " deliveries, " + n0(netMoved) + " shares moving (" + Math.round((1 - netMoved / gross) * 100) + "% less)";

      const zero = Object.keys(net).filter((f) => net[f] === 0);
      $("net-story").textContent = ccp
        ? "Each firm adds up everything it bought and sold, and settles only the difference with the clearing house. " + (zero.length ? "Firm " + zero.join(" and ") + " bought exactly as much as it sold, so it has nothing to deliver at all. " : "") + "And each firm now only has to trust one counterparty: the clearing house."
        : "Every trade settles on its own, so shares go back and forth between the same firms, and each firm is exposed to every one of the others. If one firm fails, every trade it owes is at risk.";
    };
    buttons("net-day", DAYS, (i) => { di = i; draw(); }, 0);
    buttons("net-mode", MODES, (i) => { mi = i; draw(); }, 0);
    H.charts(draw);
  }

  // ---------- When do you actually own it? ----------
  if (has("chart-cal")) {
    const MARKETS = [
      { n: "US shares", t: 1 },
      { n: "UK shares", t: 2 },
      { n: "Nigerian shares", t: 2 },
      { n: "US shares, paid in pounds", t: 1, fx: 2 },
    ];
    const DAYS = [{ n: "Mon" }, { n: "Tue" }, { n: "Wed" }, { n: "Thu" }, { n: "Fri" }];
    const COLS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
    const LONG = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };
    let mk = 0, dy = 3;
    // Column index n business days after column `from`
    const addBiz = (from, n) => {
      let i = from;
      while (n > 0) { i++; if (COLS[i] !== "Sat" && COLS[i] !== "Sun") n--; }
      return i;
    };
    const draw = () => {
      const m = MARKETS[mk], t = tone(), g = grey(), c = card();
      const svg = $("chart-cal");
      svg.textContent = "";
      const x0 = 118, w = (630 - x0) / COLS.length, rows = m.fx ? [["Shares", m.t], ["Dollars (FX)", m.fx]] : [["Shares", m.t]];
      COLS.forEach((d, i) => {
        const wk = d === "Sat" || d === "Sun";
        if (wk) el("rect", { x: x0 + i * w, y: 12, width: w, height: 176, fill: g, "fill-opacity": 0.12 }, svg);
        el("text", { x: x0 + i * w + w / 2, y: 30, "text-anchor": "middle", style: wk ? "" : "fill:var(--text)" }, svg).textContent = d;
      });
      el("text", { x: x0 + 2.5 * w, y: 184, "text-anchor": "middle" }, svg).textContent = "this week";
      el("text", { x: x0 + 9.5 * w, y: 184, "text-anchor": "middle" }, svg).textContent = "next week";
      const settleAt = [];
      rows.forEach(([label, n], r) => {
        const y = 50 + r * 62, s = addBiz(dy, n);
        settleAt.push(s);
        el("text", { x: 10, y: y + 26, style: "fill:var(--text);font-weight:600" }, svg).textContent = label;
        // the waiting days in between
        el("line", { x1: x0 + dy * w + w / 2, x2: x0 + s * w + w / 2, y1: y + 22, y2: y + 22, stroke: t, "stroke-width": 3, "stroke-opacity": 0.4 }, svg);
        el("rect", { x: x0 + dy * w + 3, y: y + 4, width: w - 6, height: 36, rx: 8, fill: c, stroke: t, "stroke-width": 2.5 }, svg);
        el("text", { x: x0 + dy * w + w / 2, y: y + 27, "text-anchor": "middle", style: "fill:" + t + ";font-weight:600" }, svg).textContent = "T";
        el("rect", { x: x0 + s * w + 3, y: y + 4, width: w - 6, height: 36, rx: 8, fill: t }, svg);
        el("text", { x: x0 + s * w + w / 2, y: y + 27, "text-anchor": "middle", style: "fill:var(--on-tone);font-weight:600" }, svg).textContent = "T+" + n;
      });
      const name = (i) => LONG[COLS[i]] + (i > 6 ? " next week" : "");
      let story = "Trade on " + LONG[COLS[dy]] + ", and the " + (mk === 2 ? "Nigerian " : mk === 1 ? "UK " : "US ") + "shares are yours on " + name(settleAt[0]) + ".";
      if (settleAt[0] > 6 && dy < 5) story += " The weekend doesn't count, so the wait is longer than it looks.";
      if (m.fx) story = "Your US shares settle on " + name(settleAt[0]) + ", but the pounds-to-dollars trade that pays for them only settles on " + name(settleAt[1]) + ". You need the dollars a day before your FX trade delivers them, so you have to pay in early or borrow for a day. This is the funding gap the US move to T+1 created for foreign investors.";
      else if (mk === 2) story += " Before 28 November 2025 it was T+3, one business day later.";
      else if (mk === 1) story += " From 11 October 2027 the UK moves to T+1.";
      $("cal-story").textContent = story;
    };
    buttons("cal-mkt", MARKETS, (i) => { mk = i; draw(); }, 0);
    buttons("cal-day", DAYS, (i) => { dy = i; draw(); }, 3);
    H.charts(draw);
  }
})();