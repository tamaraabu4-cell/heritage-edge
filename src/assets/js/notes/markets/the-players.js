// Charts for the note "The Players" (Markets · What Markets Are).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const toneBg = () => colour("--tone-bg");

  // ---------- The map in four layers ----------
  if (has("chart-layers")) {
    const layers = [
      { label: "Asset owners: have the money", items: ["Pension funds", "Sovereign funds", "Endowments", "Family offices"] },
      { label: "Buy side: hired to invest it", items: ["Hedge funds", "Private equity", "Long-only funds", "Insurers"] },
      { label: "Sell side: services, paid in fees", items: ["Investment banks", "Prime brokers", "Market makers", "Research, ratings"], sell: true },
      { label: "Markets: where the money ends up", items: ["Shares", "Bonds", "FX, commodities", "Derivatives"] }
    ];
    const draw = () => {
      const svg = $("chart-layers");
      svg.textContent = "";
      const t = tone(), g = grey(), c = card(), tb = toneBg();
      // Money down (left), returns up (right)
      el("line", { x1: 22, y1: 30, x2: 22, y2: 420, stroke: t, "stroke-width": 2 }, svg);
      el("polygon", { points: "16,412 28,412 22,426", fill: t }, svg);
      el("text", { x: 22, y: 20, "text-anchor": "middle", fill: t }, svg).textContent = "money";
      el("line", { x1: 618, y1: 430, x2: 618, y2: 40, stroke: g, "stroke-width": 2 }, svg);
      el("polygon", { points: "612,44 624,44 618,30", fill: g }, svg);
      el("text", { x: 618, y: 20, "text-anchor": "middle" }, svg).textContent = "returns";

      layers.forEach((L, i) => {
        const y = 30 + i * 102;
        el("rect", { x: 44, y, width: 552, height: 92, rx: 10, fill: L.sell ? tb : "none", stroke: L.sell ? t : g, "stroke-width": 1, "stroke-dasharray": L.sell ? "none" : "4 5" }, svg);
        const la = { x: 58, y: y + 22 };
        if (L.sell) la.fill = t;
        el("text", la, svg).textContent = L.label + (L.sell ? "  ← an FX or commodities trader sits here" : "");
        L.items.forEach((name, j) => {
          const x = 58 + j * 132;
          el("rect", { x, y: y + 36, width: 120, height: 42, rx: 6, fill: c, stroke: L.sell ? t : g, "stroke-width": 1 }, svg);
          el("text", { x: x + 60, y: y + 62, "text-anchor": "middle" }, svg).textContent = name;
        });
      });
    };
    H.charts(draw);
  }

  // ---------- Who wins when the market moves? ----------
  if (has("chart-wins")) {
    // Scores from -3 (very bad year) to +3 (very good year). Rough illustrations only.
    // A [lo, hi] pair means "it depends how they're positioned".
    const players = [
      { n: "Investment bank (deals)", sell: true },
      { n: "Market maker", sell: true },
      { n: "Prime broker", sell: true },
      { n: "Long-only fund", sell: false },
      { n: "Pension fund", sell: false },
      { n: "Hedge fund", sell: false }
    ];
    const scenarios = [
      { key: "boom", n: "Boom", s: [3, 1, 2, 2, 2, [-1, 3]],
        story: "Prices rise steadily and confidence is high. Companies rush to raise money and do deals, so investment banks have a great year. Prime brokers lend more to hedge funds. Long-only and pension funds do well because they own the market. Hedge funds can do well too, unless they were betting on falls. Market makers do fine, but steady markets with tight spreads aren't their best time." },
      { key: "crash", n: "Crash", s: [-2, 2, -1, -3, -2, [-3, 3]],
        story: "Prices fall fast and people panic. New issues and deals stop, so investment banking fees dry up. Long-only and pension funds lose money because they own the market and can't bet on falls. Market makers see huge trading volumes and wider spreads, which can mean big earnings, but holding inventory in a crash is dangerous. Hedge funds have the widest range: a crash can be their best year or their worst, depending on how they were positioned." },
      { key: "volatile", n: "Wild week, flat overall", s: [-1, 3, 1, 0, 0, [-2, 2]],
        story: "Prices swing up and down but end the week roughly where they started. Lots of people trade, so market makers and trading desks have a busy, profitable week. Long-only and pension funds end up about flat. Deals get delayed, because companies don't like launching IPOs into chaos." },
      { key: "quiet", n: "Dead quiet", s: [0, -1, 0, 0, 0, [-1, 1]],
        story: "Nothing much happens. Little trading means fewer spreads to earn, so market makers and trading desks have a slow time. Nobody on the buy side gains or loses much. Quiet markets are hard for the sell side, because it gets paid for activity, not direction." }
    ];
    let sel = 0;
    const box = $("scen");
    scenarios.forEach((sc, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = sc.n;
      b.addEventListener("click", () => { sel = i; draw(); });
      box.appendChild(b);
    });

    const draw = () => {
      [...box.children].forEach((b, i) => b.setAttribute("aria-pressed", i === sel ? "true" : "false"));
      const sc = scenarios[sel], svg = $("chart-wins");
      svg.textContent = "";
      const t = tone(), g = grey(), L = 200, R = 600, mid = (L + R) / 2, unit = (R - L) / 6, top = 14, rowH = 46;
      // Axis labels and grid
      [-3, -2, -1, 0, 1, 2, 3].forEach((v) => {
        el("line", { x1: mid + v * unit, x2: mid + v * unit, y1: top, y2: top + rowH * players.length, class: v === 0 ? "axis" : "grid" }, svg);
      });
      el("text", { x: L, y: top + rowH * players.length + 20 }, svg).textContent = "bad year";
      el("text", { x: R, y: top + rowH * players.length + 20, "text-anchor": "end" }, svg).textContent = "great year";
      players.forEach((p, i) => {
        const y = top + i * rowH + 10, h = 26, v = sc.s[i], col = p.sell ? t : g;
        el("text", { x: L - 12, y: y + 18, "text-anchor": "end" }, svg).textContent = p.n;
        if (Array.isArray(v)) {
          const x1 = mid + v[0] * unit, x2 = mid + v[1] * unit;
          el("rect", { x: x1, y, width: x2 - x1, height: h, rx: 4, fill: "none", stroke: col, "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
          el("text", { x: mid, y: y + 18, "text-anchor": "middle" }, svg).textContent = "depends on positioning";
        } else if (v === 0) {
          el("rect", { x: mid - 2, y, width: 4, height: h, rx: 2, fill: col }, svg);
        } else {
          const x = v > 0 ? mid : mid + v * unit;
          el("rect", { x, y, width: Math.abs(v) * unit, height: h, rx: 4, fill: col }, svg);
        }
      });
      $("wins-story").textContent = sc.story;
    };
    H.charts(draw);
  }
})();