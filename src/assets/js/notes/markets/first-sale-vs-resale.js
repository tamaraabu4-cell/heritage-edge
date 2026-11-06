// Charts for the note "First Sale vs Resale" (Markets · What Markets Are).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");

  // ---------- Where the money goes ----------
  if (has("chart-flow")) {
    const draw = () => {
      const svg = $("chart-flow");
      svg.textContent = "";
      const t = tone(), g = grey(), c = card();

      const panel = (y, h, label) => {
        el("rect", { x: 10, y, width: 620, height: h, rx: 12, fill: "none", stroke: g, "stroke-width": 1, "stroke-dasharray": "4 5" }, svg);
        el("text", { x: 28, y: y + 24 }, svg).textContent = label;
      };
      const box = (x, y, title, sub, opts = {}) => {
        el("rect", { x, y, width: 160, height: 56, rx: 10, fill: opts.dashed ? "none" : c, stroke: opts.stroke || g, "stroke-width": opts.sw || 1.5, "stroke-dasharray": opts.dashed ? "4 4" : "none" }, svg);
        const ta = { x: x + 80, y: y + 24, "text-anchor": "middle" };
        if (opts.titleFill) ta.fill = opts.titleFill;
        el("text", ta, svg).textContent = title;
        el("text", { x: x + 80, y: y + 42, "text-anchor": "middle" }, svg).textContent = sub;
      };
      // Arrow from x1 to x2 at height y (head at x2)
      const arrow = (x1, x2, y, col) => {
        el("line", { x1, y1: y, x2: x2 + (x2 > x1 ? -7 : 7), y2: y, stroke: col, "stroke-width": 2 }, svg);
        const d = x2 > x1 ? -1 : 1;
        el("polygon", { points: `${x2},${y} ${x2 + 8 * d},${y - 5} ${x2 + 8 * d},${y + 5}`, fill: col }, svg);
      };

      // Primary market
      panel(10, 140, "First sale: the primary market");
      box(40, 56, "The company", "gets the money", { stroke: t, sw: 2.5, titleFill: t });
      box(240, 56, "Investment bank", "runs the sale");
      box(440, 56, "New investors", "get new shares");
      arrow(202, 238, 76, g); arrow(402, 438, 76, g);   // shares →
      arrow(438, 402, 96, t); arrow(238, 202, 96, t);   // money ←

      // Secondary market
      panel(170, 190, "Resale: the secondary market");
      box(40, 216, "Investor A", "sells shares");
      box(240, 216, "The exchange", "matches them up");
      box(440, 216, "Investor B", "buys shares");
      arrow(202, 238, 236, g); arrow(402, 438, 236, g);
      arrow(438, 402, 256, t); arrow(238, 202, 256, t);
      box(240, 290, "The company", "gets nothing", { dashed: true });

      // Legend
      el("line", { x1: 200, x2: 232, y1: 388, y2: 388, stroke: g, "stroke-width": 2 }, svg);
      el("text", { x: 240, y: 392 }, svg).textContent = "shares";
      el("line", { x1: 340, x2: 372, y1: 388, y2: 388, stroke: t, "stroke-width": 2 }, svg);
      el("text", { x: 380, y: 392, fill: t }, svg).textContent = "money";
    };
    H.charts(draw);
  }

  // ---------- Follow the money ----------
  if (has("chart-ipo")) {
    const N = 1e6, ALL = 5e6;
    const m = (v) => (v < 0 ? "−" : "") + "£" + (Math.abs(v) / 1e6).toFixed(Math.abs(v) % 1e6 ? 1 : 0) + "m";
    const texM = (v) => (v < 0 ? "-" : "") + "\\text{£}" + (Math.abs(v) / 1e6).toFixed(Math.abs(v) % 1e6 ? 1 : 0) + "\\text{m}";

    const draw = () => {
      const p0 = parseInt($("ipo").value, 10), p1 = parseInt($("later").value, 10);
      $("ipo-out").textContent = "£" + p0;
      $("later-out").textContent = "£" + p1;

      const svg = $("chart-ipo");
      svg.textContent = "";
      const t = tone(), g = grey(), L = 40, R = 560, max = 25e6, sx = (v) => L + ((R - L) * v) / max;
      [0, 5e6, 10e6, 15e6, 20e6, 25e6].forEach((v) => {
        el("line", { x1: sx(v), x2: sx(v), y1: 10, y2: 186, class: "grid" }, svg);
        el("text", { x: sx(v), y: 208, "text-anchor": "middle" }, svg).textContent = "£" + v / 1e6 + "m";
      });
      const rows = [{ v: p0 * N, c: t, y: 30 }, { v: p1 * N, c: g, y: 110 }];
      rows.forEach((r) => {
        el("rect", { x: L, y: r.y, width: Math.max(3, sx(r.v) - L), height: 46, rx: 4, fill: r.c }, svg);
        el("text", { x: sx(r.v) + 8, y: r.y + 28, fill: r.c }, svg).textContent = m(r.v);
      });
      if (p1 !== p0) el("line", { x1: sx(p0 * N), x2: sx(p0 * N), y1: 80, y2: 160, stroke: t, "stroke-width": 1.2, "stroke-dasharray": "3 4" }, svg);

      const gain = (p1 - p0) * N;
      const out = $("ipo-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"), c = document.createElement("span");
      out.append(a, b, c);
      tex(a, "\\text{Company's cash} = " + p0 + " \\times 1\\text{m} = " + texM(p0 * N));
      tex(b, "\\text{New investors' gain} = (" + p1 + " - " + p0 + ") \\times 1\\text{m} = " + texM(gain));
      tex(c, "\\text{Market cap} = " + p1 + " \\times 5\\text{m} = " + texM(p1 * ALL));

      const story = $("ipo-story");
      if (p1 > p0) story.textContent = "The price rose, but the company still has exactly " + m(p0 * N) + ". The extra " + m(gain) + " went to the new investors. If this jump happened on day one, it's money the company could have raised by pricing higher: money left on the table.";
      else if (p1 < p0) story.textContent = "The price fell, but the company keeps its " + m(p0 * N) + ". The new investors took the " + m(-gain) + " loss. It still hurts the company later: raising more money now means giving away more shares.";
      else story.textContent = "The price hasn't moved since the IPO. Nobody has gained or lost yet.";
    };
    $("ipo").addEventListener("input", draw);
    $("later").addEventListener("input", draw);
    H.charts(draw);
  }
})();