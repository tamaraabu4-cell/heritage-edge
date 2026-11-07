// Charts for the note "The Order Book" (Markets · How Markets Work).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, frame, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const toneBg = () => colour("--tone-bg");
  const n0 = (v) => Math.round(v).toLocaleString("en-GB");

  // ---------- Your place in the queue ----------
  if (has("chart-queue")) {
    const MINE = 1000;
    const draw = () => {
      const ahead = parseInt($("q-ahead").value, 10), sells = parseInt($("q-sells").value, 10);
      $("q-ahead-out").textContent = n0(ahead);
      $("q-sells-out").textContent = n0(sells);
      const filled = Math.min(MINE, Math.max(0, sells - ahead));
      const beyond = Math.max(0, sells - ahead - MINE);
      const t = tone(), g = grey(), tb = toneBg();

      const svg = $("chart-queue");
      svg.textContent = "";
      const L = 40, R = 600, top = 40, h = 40;
      const total = Math.max(ahead + MINE + 1500, sells, 8000);
      const sx = (v) => L + (v / total) * (R - L);
      el("text", { x: L, y: 14 }, svg).textContent = "front of the queue";
      el("text", { x: R, y: 14, "text-anchor": "end" }, svg).textContent = "back";

      // Others ahead, you, others behind (who arrived after you)
      if (ahead) el("rect", { x: sx(0), y: top, width: sx(ahead) - sx(0), height: h, rx: 4, fill: g, "fill-opacity": 0.35 }, svg);
      el("rect", { x: sx(ahead), y: top, width: sx(ahead + MINE) - sx(ahead), height: h, rx: 4, fill: tb, stroke: t, "stroke-width": 1.5 }, svg);
      if (filled) el("rect", { x: sx(ahead), y: top, width: sx(ahead + filled) - sx(ahead), height: h, rx: 4, fill: t }, svg);
      el("rect", { x: sx(ahead + MINE), y: top, width: sx(ahead + MINE + 1500) - sx(ahead + MINE), height: h, rx: 4, fill: g, "fill-opacity": 0.18 }, svg);
      if (sx(ahead) - sx(0) > 90) el("text", { x: (sx(0) + sx(ahead)) / 2, y: top + h / 2 + 4, "text-anchor": "middle" }, svg).textContent = n0(ahead) + " ahead";
      el("text", { x: (sx(ahead) + sx(ahead + MINE)) / 2, y: top - 8, "text-anchor": "middle", style: "fill:" + t }, svg).textContent = "you";
      if (sx(ahead + MINE + 1500) - sx(ahead + MINE) > 70) el("text", { x: (sx(ahead + MINE) + sx(ahead + MINE + 1500)) / 2, y: top + h / 2 + 4, "text-anchor": "middle" }, svg).textContent = "behind you";

      // How far the selling reaches
      const reach = sx(Math.min(sells, total));
      el("line", { x1: sx(0), x2: reach, y1: top + h + 26, y2: top + h + 26, stroke: t, "stroke-width": 3, "stroke-linecap": "round" }, svg);
      el("polygon", { points: `${reach},${top + h + 20} ${reach + 9},${top + h + 26} ${reach},${top + h + 32}`, fill: t }, svg);
      el("text", { x: sx(0), y: top + h + 50, style: "fill:" + t }, svg).textContent = "selling that arrives: " + n0(sells);
      if (sells >= ahead + MINE + 1500) el("text", { x: R, y: top + h + 50, "text-anchor": "end" }, svg).textContent = "level cleared: price ticks down";

      const out = $("queue-read"); out.textContent = "";
      const a = document.createElement("span"); out.append(a);
      tex(a, "\\text{Filled} = \\min(1000,\\ \\max(0,\\ " + sells + " - " + ahead + ")) = " + filled);
      const story = $("queue-story");
      if (filled === 0) story.textContent = "The queue never reached you: the " + n0(ahead) + " shares ahead took all the selling. Your order is still waiting.";
      else if (filled < MINE) story.textContent = "Part filled: " + n0(filled) + " of your 1,000. You're now at the front for the rest.";
      else if (beyond > 1500 - 1) story.textContent = "You're fully filled, but the selling didn't stop: it cleared the whole price level and kept going. Being filled at the back of a queue often means the price is about to fall further.";
      else story.textContent = "Fully filled. Being near the front of a queue at a busy price is what market makers race for.";
    };
    $("q-ahead").addEventListener("input", draw);
    $("q-sells").addEventListener("input", draw);
    H.charts(draw);
  }

  // ---------- Find the auction price ----------
  if (has("chart-auction")) {
    const PRICES = [99.90, 99.95, 100.00, 100.05, 100.10];
    const MOC_BUY = 1000, MOC_SELL = 500;
    const BUYS = [[100.10, 1000], [100.05, 1500], [100.00, 2000], [99.95, 1500], [99.90, 2500]];
    const SELLS = [[99.90, 800], [99.95, 1200], [100.00, 2500], [100.05, 2000], [100.10, 1500]];
    const buyAt = (p) => MOC_BUY + BUYS.filter(([lim]) => lim >= p - 1e-9).reduce((a, b) => a + b[1], 0);
    const sellAt = (p) => MOC_SELL + SELLS.filter(([lim]) => lim <= p + 1e-9).reduce((a, b) => a + b[1], 0);
    const vols = PRICES.map((p) => Math.min(buyAt(p), sellAt(p)));
    const best = vols.indexOf(Math.max(...vols));

    const draw = () => {
      const i = parseInt($("auc-p").value, 10), p = PRICES[i];
      $("auc-p-out").textContent = p.toFixed(2);
      const t = tone(), g = grey(), tb = toneBg();
      const svg = $("chart-auction"), W = 640, Ht = 300, pad = { l: 56, r: 20, t: 16, b: 34 };
      const s = frame(svg, W, Ht, pad, [0, 5], [0, 10000], [], [0, 2500, 5000, 7500, 10000], (y) => n0(y));
      const bw = 26;
      PRICES.forEach((pr, k) => {
        const cx = s.sx(k + 0.5), b = buyAt(pr), sl = sellAt(pr), v = vols[k], on = k === i;
        if (on) el("rect", { x: cx - 48, y: pad.t, width: 96, height: Ht - pad.t - pad.b, rx: 6, fill: tb, "fill-opacity": 0.6 }, svg);
        el("rect", { x: cx - bw - 2, y: s.sy(b), width: bw, height: s.sy(0) - s.sy(b), rx: 3, fill: t, "fill-opacity": on ? 1 : 0.55 }, svg);
        el("rect", { x: cx + 2, y: s.sy(sl), width: bw, height: s.sy(0) - s.sy(sl), rx: 3, fill: g, "fill-opacity": on ? 0.9 : 0.45 }, svg);
        el("line", { x1: cx - bw - 8, x2: cx + bw + 8, y1: s.sy(v), y2: s.sy(v), stroke: t, "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
        el("text", { x: cx, y: Ht - pad.b + 18, "text-anchor": "middle", style: on ? "fill:" + t + ";font-weight:600" : "" }, svg).textContent = pr.toFixed(2) + (k === best ? " ★" : "");
      });
      el("text", { x: W - pad.r, y: pad.t + 12, "text-anchor": "end" }, svg).textContent = "dashed line = shares that can trade";

      const b = buyAt(p), sl = sellAt(p), v = vols[i];
      const out = $("auc-read"); out.textContent = "";
      const a = document.createElement("span"), c = document.createElement("span"); out.append(a, c);
      tex(a, "\\text{At } " + p.toFixed(2) + ": \\min(" + n0(b).replace(/,/g, "{,}") + ",\\ " + n0(sl).replace(/,/g, "{,}") + ") = " + n0(v).replace(/,/g, "{,}") + " \\text{ shares}");
      tex(c, "\\text{Unmatched: } " + n0(Math.abs(b - sl)).replace(/,/g, "{,}") + " \\text{ " + (b > sl ? "to buy" : "to sell") + "}");
      $("auc-story").textContent = i === best
        ? "This is the auction price: " + n0(v) + " shares trade, more than at any other price. Everyone who traded gets the same price. The " + n0(Math.abs(b - sl)) + " left unmatched is the imbalance. Exchanges publish it while orders are being collected, so other traders can step in and fill it."
        : (b > sl
          ? "At " + p.toFixed(2) + " there are more buyers than sellers, so only " + n0(v) + " can trade. A higher price would bring in more sellers."
          : "At " + p.toFixed(2) + " there are more sellers than buyers, so only " + n0(v) + " can trade. A lower price would bring in more buyers.");
    };
    $("auc-p").addEventListener("input", draw);
    H.charts(draw);
  }

  // ---------- Can the market maker afford to quote? ----------
  if (has("chart-mm")) {
    const LOSS = 10;
    const draw = () => {
      const h = parseFloat($("mm-h").value), q = parseInt($("mm-q").value, 10) / 100;
      $("mm-h-out").textContent = h % 1 ? h.toFixed(1) : String(h);
      $("mm-q-out").textContent = Math.round(q * 100) + "%";
      const t = tone(), g = grey(), c = card();
      const svg = $("chart-mm"), W = 640, Ht = 280, pad = { l: 56, r: 24, t: 16, b: 34 };
      const s = frame(svg, W, Ht, pad, [0, 0.5], [-5, 5], [], [-4, -2, 0, 2, 4], (y) => (y > 0 ? "+" : "") + y);
      [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach((x) => {
        el("text", { x: s.sx(x), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = Math.round(x * 100) + "%";
      });
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "share of informed traders";
      el("text", { x: pad.l + 6, y: s.sy(4.4) }, svg).textContent = "profit per trade (ticks)";

      // Profit line E = h − qL, clipped to the chart
      const qEnd = Math.min(0.5, (h + 5) / LOSS);
      el("line", { x1: s.sx(0), y1: s.sy(h), x2: s.sx(qEnd), y2: s.sy(h - qEnd * LOSS), stroke: t, "stroke-width": 3, "stroke-linecap": "round" }, svg);
      // Break-even
      const qb = h / LOSS;
      if (qb <= 0.5) {
        el("line", { x1: s.sx(qb), x2: s.sx(qb), y1: s.sy(-5), y2: s.sy(5), stroke: g, "stroke-dasharray": "4 4" }, svg);
        el("text", { x: s.sx(qb) + 6, y: s.sy(-4.2), style: "fill:" + g }, svg).textContent = "break-even " + Math.round(qb * 100) + "%";
      }
      const e = h - q * LOSS;
      el("circle", { cx: s.sx(q), cy: s.sy(Math.max(-5, Math.min(5, e))), r: 7, fill: t, stroke: c, "stroke-width": 2 }, svg);
      el("text", { x: s.sx(q) + 12, y: s.sy(Math.max(-5, Math.min(5, e))) - 10, style: "fill:" + t }, svg).textContent = (e >= 0 ? "+" : "") + e.toFixed(1) + " ticks";

      const out = $("mm-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\mathbb{E}[\\pi] = " + h + " - " + q.toFixed(2) + " \\times 10 = " + e.toFixed(1) + "\\text{ ticks}");
      tex(b, "\\text{Break-even at } q^{*} = \\frac{" + h + "}{10} = " + qb.toFixed(2));
      $("mm-story").textContent = e > 0.05
        ? "Quoting pays: the profits from ordinary traders more than cover the losses to informed ones."
        : e < -0.05
          ? "Every quote loses money. The market maker has to widen the spread (try a bigger half-spread), show less size, or stop quoting. This is what happens just before big news."
          : "Right at break-even: the spread only just covers the losses to informed traders.";
    };
    $("mm-h").addEventListener("input", draw);
    $("mm-q").addEventListener("input", draw);
    H.charts(draw);
  }
})();