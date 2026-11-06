// Charts for the note "Life on a Desk" (Markets · What Markets Are).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const toneBg = () => colour("--tone-bg");

  // ---------- The two shapes ----------
  if (has("chart-orgs")) {
    const draw = () => {
      const svg = $("chart-orgs");
      svg.textContent = "";
      const t = tone(), g = grey(), c = card(), tb = toneBg();
      const box = (x, y, w, h, title, sub, hot) => {
        el("rect", { x, y, width: w, height: h, rx: 8, fill: hot ? tb : c, stroke: hot ? t : g, "stroke-width": hot ? 2 : 1 }, svg);
        const ta = { x: x + w / 2, y: sub ? y + h / 2 - 3 : y + h / 2 + 5, "text-anchor": "middle" };
        if (hot) ta.fill = t;
        el("text", ta, svg).textContent = title;
        if (sub) el("text", { x: x + w / 2, y: y + h / 2 + 14, "text-anchor": "middle" }, svg).textContent = sub;
      };
      const down = (x, y1, y2) => {
        el("line", { x1: x, x2: x, y1, y2: y2 - 6, stroke: g, "stroke-width": 1.5 }, svg);
        el("polygon", { points: `${x - 4},${y2 - 7} ${x + 4},${y2 - 7} ${x},${y2}`, fill: g }, svg);
      };

      // Left: single-manager
      el("text", { x: 150, y: 18, "text-anchor": "middle" }, svg).textContent = "Single-manager fund";
      box(70, 30, 160, 48, "Founder / CIO", "decides everything", true);
      down(150, 78, 104);
      box(20, 104, 125, 44, "Analysts", "find ideas");
      box(155, 104, 125, 44, "Traders", "execute");
      down(150, 148, 184);
      box(20, 184, 260, 44, "Risk · Ops · Compliance · IR", "");

      // Right: platform
      el("text", { x: 480, y: 18, "text-anchor": "middle" }, svg).textContent = "Multi-strategy platform";
      box(380, 30, 200, 48, "Central risk + capital", "sets each pod's limits", true);
      down(480, 78, 104);
      box(340, 104, 280, 44, "Shared tech · data · ops", "");
      down(480, 148, 184);
      [0, 1, 2, 3].forEach((i) => box(340 + i * 72, 184, 64, 44, i < 3 ? "PM pod" : "…", i < 3 ? "own P&L" : ""));
      el("text", { x: 480, y: 252, "text-anchor": "middle" }, svg).textContent = "10 to 300+ pods, each with its own stop-loss";
      el("text", { x: 150, y: 252, "text-anchor": "middle" }, svg).textContent = "10 to 30 people";
    };
    H.charts(draw);
  }

  // ---------- PM payout with a high-water mark ----------
  if (has("chart-hwm")) {
    const RATE = 0.2;
    const fmt = (v) => (v < 0 ? "−$" : "$") + Math.abs(v) + "m";
    const draw = () => {
      const P = [1, 2, 3].map((i) => parseInt($("y" + i).value, 10));
      P.forEach((v, i) => { $("y" + (i + 1) + "-out").textContent = fmt(v); });

      // Work through the years
      let D = 0;
      const rows = P.map((p) => {
        const pay = RATE * Math.max(0, p - D);
        const before = D;
        D = Math.max(0, D - p);
        return { p, pay, before, after: D };
      });
      const total = rows.reduce((a, r) => a + r.pay, 0);
      const naive = P.reduce((a, p) => a + RATE * Math.max(0, p), 0);

      const svg = $("chart-hwm");
      svg.textContent = "";
      const t = tone(), g = grey(), L = 60, R = 620, top = 20, bot = 250, lo = -100, hi = 130;
      const sy = (v) => bot - ((v - lo) / (hi - lo)) * (bot - top);
      [-100, -50, 0, 50, 100].forEach((v) => {
        el("line", { x1: L, x2: R, y1: sy(v), y2: sy(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: L - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = (v < 0 ? "−$" : "$") + Math.abs(v) + "m";
      });
      const cw = (R - L) / 3;
      rows.forEach((r, i) => {
        const cx = L + cw * i + cw / 2, bw = 46;
        // P&L bar
        const y1 = sy(Math.max(0, r.p)), y2 = sy(Math.min(0, r.p));
        el("rect", { x: cx - bw - 4, y: y1, width: bw, height: Math.max(1.5, y2 - y1), rx: 3, fill: g }, svg);
        el("text", { x: cx - bw / 2 - 4, y: r.p >= 0 ? y1 - 6 : y2 + 14, "text-anchor": "middle" }, svg).textContent = fmt(r.p);
        // Payout bar
        const py = sy(r.pay);
        el("rect", { x: cx + 4, y: py, width: bw, height: Math.max(1.5, sy(0) - py), rx: 3, fill: t }, svg);
        el("text", { x: cx + bw / 2 + 4, y: py - 6, "text-anchor": "middle", fill: t }, svg).textContent = "$" + (Math.round(r.pay * 10) / 10) + "m";
        // Losses still to win back at the start of the year
        if (r.before > 0) el("text", { x: cx, y: bot + 34, "text-anchor": "middle", fill: t }, svg).textContent = "owes $" + r.before + "m first";
        el("text", { x: cx, y: bot + 18, "text-anchor": "middle" }, svg).textContent = "Year " + (i + 1);
      });

      const out = $("hwm-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Total payout} = \\$" + (Math.round(total * 10) / 10) + "\\text{m}");
      tex(b, "\\text{Without the high-water mark} = \\$" + (Math.round(naive * 10) / 10) + "\\text{m}");
      const owed = rows[2].after;
      $("hwm-story").textContent = total < naive
        ? "The high-water mark cost the PM $" + (Math.round((naive - total) * 10) / 10) + "m: profits that only won back earlier losses weren't paid on." + (owed > 0 ? " They still owe $" + owed + "m before their next payout." : "")
        : (owed > 0 ? "No profits have been earned back yet. The PM owes $" + owed + "m before their next payout." : "No losses to win back, so the high-water mark made no difference this time.");
    };
    ["y1", "y2", "y3"].forEach((id) => $(id).addEventListener("input", draw));
    H.charts(draw);
  }
})();