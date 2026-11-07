// Charts for the note "Order Types" (Markets · How Markets Work).
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
  const n0 = (v) => v.toLocaleString("en-GB");
  const p2 = (v) => v.toFixed(2);

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

  // ---------- One plan, four orders (walking the book) ----------
  if (has("chart-walk")) {
    // Offers (people selling) from the best price upwards; bids (people buying) from the best price downwards.
    const ASKS = [[50.05, 600], [50.06, 800], [50.07, 500], [50.08, 1200], [50.10, 2000]];
    const BIDS = [[50.00, 900], [49.99, 700], [49.98, 1100], [49.96, 1500], [49.95, 2000]];
    const MID = 50.025, BEST_ASK = 50.05;
    const TYPES = [
      { n: "Market order", kind: "market" },
      { n: "Marketable limit at 50.06", kind: "mlimit", limit: 50.06 },
      { n: "Limit at 50.00", kind: "limit", limit: 50.00 },
      { n: "Stop at 50.20", kind: "stop", stop: 50.20 }
    ];
    let sel = 0;

    const run = (size, type) => {
      const fills = [];
      let left = size;
      if (type.kind === "market" || type.kind === "mlimit") {
        for (const [p, q] of ASKS) {
          if (left <= 0) break;
          if (type.kind === "mlimit" && p > type.limit + 1e-9) break;
          const take = Math.min(q, left);
          fills.push([p, take]);
          left -= take;
        }
      }
      const filled = fills.reduce((a, f) => a + f[1], 0);
      const avg = filled ? fills.reduce((a, f) => a + f[0] * f[1], 0) / filled : 0;
      return { fills, filled, left, avg };
    };

    const draw = () => {
      const size = parseInt($("ot-size").value, 10);
      $("ot-size-out").textContent = n0(size);
      const type = TYPES[sel], r = run(size, type);
      const t = tone(), g = grey(), c = card(), tb = toneBg();

      const svg = $("chart-walk");
      svg.textContent = "";
      const CX = 320, PW = 80, rowH = 26, top = 30, maxQ = 2000, barMax = 220;
      const qx = (q) => (q / maxQ) * barMax;
      el("text", { x: CX - PW / 2 - 10, y: 18, "text-anchor": "end" }, svg).textContent = "people buying (bids)";
      el("text", { x: CX + PW / 2 + 10, y: 18 }, svg).textContent = "people selling (offers)";

      // Offers: highest price at the top
      const asksTopDown = [...ASKS].reverse();
      asksTopDown.forEach(([p, q], i) => {
        const y = top + i * rowH;
        const taken = (r.fills.find((f) => Math.abs(f[0] - p) < 1e-9) || [0, 0])[1];
        el("rect", { x: CX - PW / 2, y: y + 2, width: PW, height: rowH - 4, rx: 4, fill: c, stroke: g, "stroke-width": 0.8 }, svg);
        el("text", { x: CX, y: y + rowH / 2 + 4, "text-anchor": "middle" }, svg).textContent = p2(p);
        const x0 = CX + PW / 2 + 10;
        el("rect", { x: x0, y: y + 4, width: qx(q), height: rowH - 8, rx: 3, fill: g, "fill-opacity": 0.35 }, svg);
        if (taken) el("rect", { x: x0, y: y + 4, width: qx(taken), height: rowH - 8, rx: 3, fill: t }, svg);
        el("text", { x: x0 + qx(q) + 6, y: y + rowH / 2 + 4 }, svg).textContent = n0(q) + (taken ? "  (you take " + n0(taken) + ")" : "");
      });

      // The spread gap
      const gapY = top + ASKS.length * rowH;
      el("line", { x1: 40, x2: 600, y1: gapY + 8, y2: gapY + 8, stroke: g, "stroke-dasharray": "3 4" }, svg);
      el("text", { x: 40, y: gapY + 4 }, svg).textContent = "spread";

      // Bids: best price at the top. A marketable limit's leftover rests as a new best bid at its limit.
      const bidRows = [...BIDS];
      const restingNew = type.kind === "mlimit" && r.left > 0;
      if (restingNew) bidRows.unshift([type.limit, 0]);
      bidRows.forEach(([p, q], i) => {
        const y = gapY + 16 + i * rowH;
        if (y > 320) return;
        el("rect", { x: CX - PW / 2, y: y + 2, width: PW, height: rowH - 4, rx: 4, fill: c, stroke: g, "stroke-width": 0.8 }, svg);
        el("text", { x: CX, y: y + rowH / 2 + 4, "text-anchor": "middle" }, svg).textContent = p2(p);
        const x1 = CX - PW / 2 - 10;
        if (q) el("rect", { x: x1 - qx(q), y: y + 4, width: qx(q), height: rowH - 8, rx: 3, fill: g, "fill-opacity": 0.35 }, svg);
        // Your resting order joins the back of the queue (further from the price column)
        let mine = 0;
        if (type.kind === "limit" && Math.abs(p - type.limit) < 1e-9) mine = size;
        if (restingNew && i === 0) mine = r.left;
        if (mine) {
          const w = Math.min(qx(mine), x1 - qx(q) - 20);
          el("rect", { x: x1 - qx(q) - w, y: y + 4, width: w, height: rowH - 8, rx: 3, fill: tb, stroke: t, "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
          const inside = w >= 80;
          el("text", { x: inside ? x1 - qx(q) - w / 2 : x1 - qx(q) - w - 6, y: y + rowH / 2 + 4, "text-anchor": inside ? "middle" : "end", style: "fill:" + t }, svg).textContent = "you " + n0(mine);
        } else if (q) {
          el("text", { x: x1 - qx(q) - 6, y: y + rowH / 2 + 4, "text-anchor": "end" }, svg).textContent = n0(q);
        }
      });

      // Readout and story
      const out = $("walk-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      const story = $("walk-story");
      if (r.filled) {
        const bp = ((r.avg - MID) / MID) * 10000;
        tex(a, "\\text{Filled } " + n0(r.filled) + " \\text{ at an average of } " + r.avg.toFixed(3));
        tex(b, "\\text{Cost against the midpoint} \\approx " + bp.toFixed(1) + "\\text{ bp}");
      } else {
        tex(a, "\\text{Filled now: } 0");
        tex(b, "\\text{Cost so far: } 0");
      }
      if (type.kind === "market") {
        story.textContent = r.left > 0
          ? "Your order took every offer in the visible book and still wants " + n0(r.left) + " more. In a thin market a big market order can keep climbing to much worse prices."
          : r.fills.length > 1
            ? "Your order took all the shares at 50.05, then walked up the book to worse prices. The bigger the order, the worse the average."
            : "Small enough to fill entirely at the best offer, 50.05. You paid the spread for getting your shares immediately.";
      } else if (type.kind === "mlimit") {
        story.textContent = r.left > 0
          ? "It bought everything up to 50.06 straight away, then stopped: it can't pay more. The other " + n0(r.left) + " now wait as a bid at 50.06, the new best bid."
          : "It filled immediately, just like a market order, without needing to go above 50.06.";
      } else if (type.kind === "limit") {
        story.textContent = "Nothing fills yet. Your " + n0(size) + " joins the back of the queue at 50.00, behind the 900 shares already waiting. You'll only trade if sellers come down and take all 900 first, and if they do, the price may be falling.";
      } else {
        story.textContent = "Nothing happens yet. The stop sleeps until something trades at 50.20 or higher, then becomes a market order and buys at whatever is offered. Traders use buy stops to get in once a price breaks higher, or to cut a losing bet that the price would fall.";
      }
    };

    buttons("ot-type", TYPES, (i) => { sel = i; draw(); }, 0);
    $("ot-size").addEventListener("input", draw);
    H.charts(draw);
  }

  // ---------- Where does your stop actually fill? ----------
  if (has("chart-stop")) {
    const PATHS = [
      { n: "Calm market", p: [50.00, 49.85, 49.70, 49.55, 49.40, 49.20, 49.00, 48.80, 48.60, 48.40, 48.20, 48.00, 47.85, 47.70, 47.55, 47.40, 47.30, 47.25, 47.20, 47.20] },
      { n: "Fast market (price gaps)", p: [50.00, 49.90, 49.80, 49.65, 49.50, 49.35, 49.20, 49.05, 48.90, 48.75, 48.60, 48.45, 47.70, 47.40, 47.10, 46.90, 46.95, 47.10, 47.20, 47.20] }
    ];
    const KINDS = [{ n: "Stop" }, { n: "Stop-limit" }];
    let kind = 0, path = 1;

    const simulate = (P, stop, isLimit) => {
      const trig = P.findIndex((v) => v <= stop + 1e-9);
      if (trig < 0) return { trig: -1 };
      if (!isLimit) return { trig, fill: trig, price: P[trig] };
      const limit = stop - 0.1;
      const f = P.findIndex((v, i) => i >= trig && v >= limit - 1e-9);
      return f < 0 ? { trig, fill: -1, limit } : { trig, fill: f, price: P[f], limit };
    };

    const draw = () => {
      const stop = parseFloat($("st-level").value);
      $("st-level-out").textContent = p2(stop);
      const P = PATHS[path].p, isLimit = kind === 1, r = simulate(P, stop, isLimit);
      const t = tone(), g = grey(), c = card();

      const svg = $("chart-stop");
      const W = 640, Ht = 300, pad = { l: 56, r: 24, t: 16, b: 30 };
      const s = frame(svg, W, Ht, pad, [0, P.length - 1], [46.5, 50.5], [], [47, 48, 49, 50], (y) => y.toFixed(2));
      el("text", { x: W - pad.r, y: Ht - 8, "text-anchor": "end" }, svg).textContent = "time →";

      // Stop line (and the stop-limit's limit line)
      el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(stop), y2: s.sy(stop), stroke: t, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      el("text", { x: pad.l + 6, y: s.sy(stop) - 6, style: "fill:" + t }, svg).textContent = "stop " + p2(stop);
      if (isLimit) {
        el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(stop - 0.1), y2: s.sy(stop - 0.1), stroke: g, "stroke-width": 1.2, "stroke-dasharray": "2 4" }, svg);
        el("text", { x: pad.l + 6, y: s.sy(stop - 0.1) + 14 }, svg).textContent = "limit " + p2(stop - 0.1);
      }

      // Price path as trades (dots joined by a line; a gap is a big jump between two trades)
      let d = "";
      P.forEach((v, i) => { d += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(v).toFixed(1); });
      el("path", { d, fill: "none", stroke: g, "stroke-width": 2 }, svg);
      P.forEach((v, i) => el("circle", { cx: s.sx(i), cy: s.sy(v), r: 2.5, fill: g }, svg));

      const out = $("stop-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      const story = $("stop-story"), end = P[P.length - 1];

      if (r.trig < 0) {
        tex(a, "\\text{Never triggered}");
        tex(b, "\\text{Still holding at } " + p2(end));
        story.textContent = "The price never reached your stop, so nothing happened. You're still holding, at " + p2(end) + ".";
        return;
      }
      el("circle", { cx: s.sx(r.trig), cy: s.sy(P[r.trig]), r: 7, fill: "none", stroke: t, "stroke-width": 2 }, svg);
      el("text", { x: s.sx(r.trig) + 10, y: s.sy(P[r.trig]) - 10, style: "fill:" + t }, svg).textContent = "triggered";

      if (r.fill >= 0) {
        el("circle", { cx: s.sx(r.fill), cy: s.sy(r.price), r: 6, fill: t, stroke: c, "stroke-width": 2 }, svg);
        el("text", { x: s.sx(r.fill) + 10, y: s.sy(r.price) + 18, style: "fill:" + t }, svg).textContent = "sold at " + p2(r.price);
        const miss = stop - r.price;
        tex(a, "\\text{Sold at } " + p2(r.price) + " \\text{, stop was } " + p2(stop));
        tex(b, "\\text{Slippage} = " + (miss > 1e-9 ? miss.toFixed(2) : "0") + " \\text{ a share}");
        if (!isLimit) {
          story.textContent = miss > 0.2
            ? "The price jumped straight past your stop. It triggered, became a market order, and sold at the next price available: " + p2(r.price) + ", " + miss.toFixed(2) + " worse than planned."
            : "In a steady market the stop triggers and sells close to the level you set. This is when stops work well.";
        } else {
          story.textContent = "The stop-limit triggered and found a buyer at or above its limit, so it sold at " + p2(r.price) + ". It protected the price this time.";
        }
      } else {
        el("text", { x: W - pad.r - 4, y: s.sy(end) - 10, "text-anchor": "end", style: "fill:" + t }, svg).textContent = "not sold, still holding at " + p2(end);
        tex(a, "\\text{Triggered, but never filled}");
        tex(b, "\\text{Still holding at } " + p2(end) + " \\text{ (bought at 50.00)}");
        story.textContent = "The price fell straight through your limit of " + p2(r.limit) + " and never came back, so the stop-limit never sold. You avoided a bad price but you're still holding, now at " + p2(end) + ", a bigger loss than the plain stop would have given.";
      }
    };

    buttons("st-kind", KINDS, (i) => { kind = i; draw(); }, 0);
    buttons("st-path", PATHS, (i) => { path = i; draw(); }, 1);
    $("st-level").addEventListener("input", draw);
    H.charts(draw);
  }
})();