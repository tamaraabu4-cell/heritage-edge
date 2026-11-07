// Charts for the note "Market Data and Feeds" (Markets · How Markets Work).
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
  const n0 = (v) => v.toLocaleString("en-GB");

  // ---------- Three ways to see the same order book ----------
  if (has("chart-levels")) {
    // Prices in pence. Offers (to sell) above, bids (to buy) below; best ones nearest the middle.
    const OFFERS = [[231.0, 8000], [230.9, 12500], [230.8, 6200], [230.7, 9800], [230.6, 4100]];
    const BIDS = [[230.5, 5300], [230.4, 11000], [230.3, 7400], [230.2, 15600], [230.1, 9900]];
    const LAST = 230.5;
    const MINE = { side: "bid", price: 230.4, size: 2000 };   // Level 3: your own quote inside the 11,000
    const MAXQ = 16000;
    let level = 1;

    const STORIES = {
      1: "Level 1: just the best price to sell to you (230.6p, 4,100 shares), the best price to buy from you (230.5p, 5,300 shares) and the last trade. Enough to know roughly where the price is, not how much you could trade.",
      2: "Level 2: the whole book. Now you can see that buying 20,000 shares at once would eat through 230.6p, 230.7p and part of 230.8p, pushing your average price up. That's why traders working big orders want depth.",
      3: "Level 3: the same book, but you're a member of the exchange and can put your own quotes in. Here your 2,000-share bid sits inside the 11,000 waiting at 230.4p. This is what market makers use.",
    };

    const draw = () => {
      const svg = $("chart-levels");
      svg.textContent = "";
      const t = tone(), g = grey(), c = card(), tb = toneBg();
      const rowH = 26, top = 34, priceX = 300, barX = 340, barW = 230;
      const rows = OFFERS.concat(BIDS);

      el("text", { x: priceX, y: 20, "text-anchor": "end" }, svg).textContent = "Price";
      el("text", { x: barX, y: 20 }, svg).textContent = "Shares waiting";
      el("text", { x: 40, y: top + rowH * 2.5 + 4 }, svg).textContent = "Offers (to sell)";
      el("text", { x: 40, y: top + rowH * 7.5 + 4 }, svg).textContent = "Bids (to buy)";

      rows.forEach(([p, q], i) => {
        const y = top + i * rowH + (i >= 5 ? 10 : 0);
        const isOffer = i < 5, best = i === 4 || i === 5;
        const shown = level >= 2 || best;
        if (best) el("rect", { x: 228, y: y, width: 360, height: rowH - 4, rx: 6, fill: tb }, svg);
        const pt = el("text", { x: priceX, y: y + 16, "text-anchor": "end" }, svg);
        pt.textContent = p.toFixed(1) + "p";
        if (!shown) { pt.setAttribute("style", "fill:" + g); pt.setAttribute("fill-opacity", "0.35"); }
        if (shown) {
          const w = (q / MAXQ) * barW;
          el("rect", { x: barX, y: y + 3, width: w, height: rowH - 10, rx: 3, fill: best ? t : g, "fill-opacity": best ? 1 : 0.55 }, svg);
          el("text", { x: barX + w + 8, y: y + 16 }, svg).textContent = n0(q);
          if (level === 3 && !isOffer && p === MINE.price) {
            const mw = (MINE.size / MAXQ) * barW;
            el("rect", { x: barX, y: y + 1, width: mw, height: rowH - 6, rx: 3, fill: "none", stroke: t, "stroke-width": 2.5 }, svg);
            el("text", { x: barX + w + 58, y: y + 16, style: "fill:" + t }, svg).textContent = "← yours";
          }
        } else {
          el("text", { x: barX, y: y + 16, "fill-opacity": 0.5, style: "fill:" + g }, svg).textContent = "hidden at Level 1";
        }
      });

      // Last trade marker, between the two halves
      const midY = top + 5 * rowH + 2;
      el("line", { x1: 228, x2: 588, y1: midY, y2: midY, stroke: g, "stroke-width": 1, "stroke-dasharray": "3 4" }, svg);
      el("text", { x: 40, y: midY + 4, style: "fill:" + t }, svg).textContent = "Last trade " + LAST.toFixed(1) + "p";

      $("levels-story").textContent = STORIES[level];
    };

    document.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => {
      level = parseInt(b.dataset.level, 10);
      document.querySelectorAll("[data-level]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      draw();
    }));
    H.charts(draw);
  }

  // ---------- How fast can news travel? ----------
  if (has("chart-race")) {
    const ROUTES = [
      { name: "London → Frankfurt", km: 640, note: "Europe's two biggest trading centres" },
      { name: "Chicago → New Jersey", km: 1200, note: "futures in Chicago, shares in New Jersey's data centres" },
      { name: "London → Lagos", km: 5000, note: "roughly, in a straight line" },
      { name: "London → New York", km: 5570, note: "the main FX corridor" },
    ];
    const FIBRE = 200, AIR = 300;   // km per millisecond
    let pick = 1;

    const draw = () => {
      const svg = $("chart-race");
      svg.textContent = "";
      const t = tone(), g = grey();
      const r = ROUTES[pick];
      const tf = r.km / FIBRE, ta = r.km / AIR;
      const X0 = 170, X1 = 580, maxT = 30;
      const sx = (ms) => X0 + (ms / maxT) * (X1 - X0);

      // scale
      [0, 5, 10, 15, 20, 25, 30].forEach((m) => {
        el("line", { x1: sx(m), x2: sx(m), y1: 30, y2: 150, class: "grid" }, svg);
        el("text", { x: sx(m), y: 170, "text-anchor": "middle" }, svg).textContent = m + " ms";
      });
      el("text", { x: 20, y: 22 }, svg).textContent = r.name + ", about " + n0(r.km) + " km";

      const bar = (y, ms, fill, label) => {
        el("text", { x: X0 - 12, y: y + 20, "text-anchor": "end" }, svg).textContent = label;
        el("rect", { x: X0, y, width: Math.max(2, sx(ms) - X0), height: 30, rx: 5, fill }, svg);
        el("text", { x: sx(ms) + 8, y: y + 20 }, svg).textContent = ms.toFixed(1) + " ms";
      };
      bar(42, tf, g, "Glass fibre");
      bar(96, ta, t, "Through the air");
      el("text", { x: 20, y: 194 }, svg).textContent = r.note;

      const out = $("race-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"), cc = document.createElement("span");
      out.append(a, b, cc);
      tex(a, "t_{\\text{fibre}} = \\tfrac{" + n0(r.km).replace(/,/g, "{,}") + "}{200} = " + tf.toFixed(1) + "\\text{ ms}");
      tex(b, "t_{\\text{air}} = \\tfrac{" + n0(r.km).replace(/,/g, "{,}") + "}{300} = " + ta.toFixed(1) + "\\text{ ms}");
      tex(cc, "\\text{gap} \\approx " + (tf - ta).toFixed(1) + "\\text{ ms}");
    };

    document.querySelectorAll("[data-route]").forEach((b) => b.addEventListener("click", () => {
      pick = parseInt(b.dataset.route, 10);
      document.querySelectorAll("[data-route]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      draw();
    }));
    H.charts(draw);
  }
})();