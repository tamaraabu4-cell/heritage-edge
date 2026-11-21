// Interactives for the note "Reading the Tape" (Quant · Microstructure).
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, colour } = H;
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

  const fit = (svg, h) => {
    const w = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.textContent = "";
    return w;
  };
  const onResize = (id, draw) => {
    let last = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($(id).getBoundingClientRect().width);
      if (w && w !== last) { last = w; draw(); }
    });
  };
  const buttons = (boxId, items, start, onPick) => {
    const box = $(boxId);
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = it;
      b.setAttribute("aria-pressed", i === start ? "true" : "false");
      b.addEventListener("click", () => { [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); onPick(i); });
      box.append(b);
    });
    return (i) => [...box.children].forEach((c, j) => c.setAttribute("aria-pressed", j === i ? "true" : "false"));
  };
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const rng = (s) => () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const num = (v) => Math.round(v).toLocaleString("en-GB");
  const signedNum = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + num(Math.abs(v));

  // ---------- Sign the tape ----------
  if ($("st-list")) {
    // side: true aggressor. rule: what Lee–Ready says, and why.
    const TRADES = [
      { time: "10:00:01", bid: "50.00", ask: "50.02", px: "50.02", size: 300, side: "B", rule: "B", why: "At the ask: a buyer paid the offer. The quote rule gets this easily." },
      { time: "10:00:04", bid: "50.00", ask: "50.02", px: "50.00", size: 500, side: "S", rule: "S", why: "At the bid: a seller hit the resting bid." },
      { time: "10:00:09", bid: "50.00", ask: "50.02", px: "50.01", size: 200, side: "B", rule: "B", why: "Exactly at the midpoint, so the quote rule can't tell. The last different price was 50.00, so this is an uptick and the tick test says buy. Correct this time." },
      { time: "10:00:15", bid: "50.01", ask: "50.02", px: "50.02", size: 1000, side: "B", rule: "B", why: "The bid has moved up to 50.01 and a buyer paid 50.02 for 1,000: pressure building on the buy side." },
      { time: "10:00:18", bid: "50.01", ask: "50.02", px: "50.02", size: 400, side: "B", rule: "B", why: "Another trade at the offer: buyer-initiated." },
      { time: "10:00:26", bid: "50.01", ask: "50.03", px: "50.01", size: 600, side: "S", rule: "S", why: "At the bid: a seller hit it. The offer has moved up to 50.03 after the buying." },
      { time: "10:00:31", bid: "50.01", ask: "50.03", px: "50.02", size: 300, side: "S", rule: "B", why: "At the midpoint again. The last different price was 50.01, so the tick test calls it a buy. But this was a midpoint match in a dark pool started by a seller. The rules get it wrong: trades inside the spread are their weak spot." },
      { time: "10:00:38", bid: "50.00", ask: "50.02", px: "50.015", size: 100, side: "B", rule: "B", why: "A sub-penny price, closer to the ask: a retail buy filled by a wholesaler with a little price improvement. The quote rule signs it as a buy." },
      { time: "10:00:44", bid: "50.00", ask: "50.02", px: "50.00", size: 800, side: "S", rule: "S", why: "At the bid: seller-initiated." },
      { time: "10:00:52", bid: "50.00", ask: "50.01", px: "50.01", size: 700, side: "B", rule: "B", why: "A new seller improved the offer to 50.01 and a buyer took it straight away: buyer-initiated." },
    ];
    const answers = new Array(TRADES.length).fill(null);
    const list = $("st-list");
    const rows = TRADES.map((t, i) => {
      const row = document.createElement("div"); row.className = "tape-row";
      const left = document.createElement("div");
      const q = document.createElement("div"); q.className = "tp-q"; q.textContent = t.time + "  ·  quote " + t.bid + " / " + t.ask;
      const tr = document.createElement("div"); tr.className = "tp-t"; tr.textContent = num(t.size) + " shares at " + t.px;
      left.append(q, tr);
      const btns = document.createElement("div"); btns.className = "btns";
      ["Buy", "Sell"].forEach((lab) => {
        const b = document.createElement("button"); b.type = "button"; b.textContent = lab; b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => { answers[i] = lab[0]; paint(); });
        btns.append(b);
      });
      const why = document.createElement("p"); why.className = "why"; why.hidden = true;
      row.append(left, btns, why);
      list.append(row);
      return { row, btns, why };
    });

    const paint = () => {
      let right = 0, done = 0, mine = 0, truth = 0, rules = 0, total = 0;
      TRADES.forEach((t, i) => {
        const r = rows[i], a = answers[i];
        [...r.btns.children].forEach((b) => b.setAttribute("aria-pressed", a === b.textContent[0] ? "true" : "false"));
        r.row.classList.remove("right", "wrong");
        total += t.size;
        truth += (t.side === "B" ? 1 : -1) * t.size;
        rules += (t.rule === "B" ? 1 : -1) * t.size;
        if (a) {
          done++; mine += (a === "B" ? 1 : -1) * t.size;
          const ok = a === t.side; if (ok) right++;
          r.row.classList.add(ok ? "right" : "wrong");
          r.why.hidden = false;
          r.why.innerHTML = "<b>" + (ok ? "Right" : "Not quite") + ":</b> really " + (t.side === "B" ? "buyer" : "seller") + "-initiated. Lee–Ready says " + (t.rule === "B" ? "buy" : "sell") + ". " + t.why;
        } else r.why.hidden = true;
      });
      const box = $("st-read"); box.textContent = "";
      span(box, "Answered: " + done + " of " + TRADES.length + " · right: " + right);
      if (done === TRADES.length) {
        span(box, "Your signed volume: " + signedNum(mine) + " (OFI " + (mine / total).toFixed(2) + ")");
        span(box, "Lee–Ready: " + signedNum(rules) + " (OFI " + (rules / total).toFixed(2) + ")");
        span(box, "True: " + signedNum(truth) + " (OFI " + (truth / total).toFixed(2) + ")");
        $("st-story").textContent = "Over the minute, buyers started 2,700 shares of trades and sellers 2,200, a mild buying imbalance of +0.10. Lee–Ready got nine of ten right but signed the dark midpoint sell as a buy, which pushed its imbalance to +0.22, more than twice the true figure. A small error per trade becomes a big error in the total when inside-the-spread trades are common.";
      } else $("st-story").textContent = done ? "Keep going: the imbalance appears once every trade is signed." : "";
    };
    $("st-reset").addEventListener("click", () => { answers.fill(null); paint(); });
    paint();
  }

  // ---------- Imbalance and price ----------
  if ($("chart-ip")) {
    const N = 180, SIG_T = 600, NOISE = 0.04;
    const dIn = $("ip-d"), qIn = $("ip-q");
    let useBook = true, seed = 11;
    buttons("ip-x", ["Book imbalance", "Trades only"], 0, (i) => { useBook = i === 0; draw(); });

    const draw = () => {
      const D = +dIn.value, qa = +qIn.value;
      $("ip-d-out").textContent = num(D);
      $("ip-q-out").textContent = "×" + qa.toFixed(1);
      // Same random draws whatever the settings, so only the settings change the picture
      const r = rng(seed), pts = [];
      for (let k = 0; k < N; k++) {
        const T = SIG_T * normal(r), Qn = SIG_T * qa * normal(r), e = NOISE * normal(r);
        const book = T + Qn, dp = book / (2 * D) + e;
        pts.push({ x: useBook ? book : T, y: dp });
      }
      let sxy = 0, sxx = 0, syy = 0;
      pts.forEach((p) => { sxy += p.x * p.y; sxx += p.x * p.x; syy += p.y * p.y; });
      const beta = sxy / sxx;
      let sse = 0; pts.forEach((p) => { sse += (p.y - beta * p.x) ** 2; });
      const r2 = Math.max(0, 1 - sse / syy), theory = 1 / (2 * D);

      const svg = $("chart-ip");
      const hh = 300, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: 46, r: 14, t: 28, b: 44 };
      const iw = w - pad.l - pad.r, ih = hh - pad.t - pad.b;
      const xMax = Math.max(...pts.map((p) => Math.abs(p.x))) * 1.05;
      const rawX = xMax / (narrow ? 2 : 4), magX = 10 ** Math.floor(Math.log10(rawX));
      const xs = [1, 2, 2.5, 5, 10].map((v) => v * magX).find((v) => v >= rawX), X = xs * (narrow ? 2 : 4);
      const yAbs = Math.max(0.6, Math.max(...pts.map((p) => Math.abs(p.y))) * 1.05);
      const ys = yAbs > 2 ? 1 : yAbs > 1 ? 0.5 : 0.25, Y = Math.ceil(yAbs / ys) * ys;
      const sx = (x) => pad.l + ((x + X) / (2 * X)) * iw, sy = (y) => pad.t + ((Y - y) / (2 * Y)) * ih;
      for (let y = -Y; y <= Y + 1e-9; y += ys) {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(y), y2: sy(y), class: Math.abs(y) < 1e-9 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 8, y: sy(y) + 4, "text-anchor": "end" }, svg).textContent = (y > 0 ? "+" : y < 0 ? "−" : "") + Math.abs(y);
      }
      for (let x = -X; x <= X + 1e-9; x += xs) {
        el("line", { x1: sx(x), x2: sx(x), y1: pad.t, y2: pad.t + ih, class: Math.abs(x) < 1e-9 ? "axis" : "grid" }, svg);
        el("text", { x: sx(x), y: pad.t + ih + 18, "text-anchor": "middle" }, svg).textContent = (x > 0 ? "+" : x < 0 ? "−" : "") + num(Math.abs(x));
      }
      el("text", { x: pad.l + iw / 2, y: hh - 6, "text-anchor": "middle" }, svg).textContent = (useBook ? "Book imbalance" : "Trade imbalance") + ", shares";
      el("text", { x: 4, y: 12 }, svg).textContent = narrow ? "Mid, ticks" : "Change in mid, ticks";
      pts.forEach((p) => {
        if (Math.abs(p.x) <= X && Math.abs(p.y) <= Y) el("circle", { cx: sx(p.x), cy: sy(p.y), r: narrow ? 2.5 : 3, fill: grey(), "fill-opacity": 0.65 }, svg);
      });
      const lineAt = (b, attrs) => {
        const x0 = Math.max(-X, -Y / Math.abs(b || 1e-9)), x1 = -x0;
        el("line", Object.assign({ x1: sx(x0), y1: sy(b * x0), x2: sx(x1), y2: sy(b * x1) }, attrs), svg);
      };
      lineAt(theory, { stroke: grey(), "stroke-width": 2, "stroke-dasharray": "6 4" });
      lineAt(beta, { stroke: tone(), "stroke-width": 3, "stroke-linecap": "round" });

      const box = $("ip-read"); box.textContent = "";
      span(box, "Fitted: " + (beta * 1000).toFixed(3) + " ticks per 1,000 shares");
      span(box, "Simple model 1/2D: " + (theory * 1000).toFixed(3));
      span(box, "R²: " + Math.round(r2 * 100) + "% of moves explained");
      let story;
      if (useBook) story = "With the full book imbalance, the dots hug a straight line and the fitted slope sits on the simple model's 1/2D. That's Cont, Kukanov and Stoikov's finding: over short intervals, book imbalance explains most of the price move. Make the book deeper and the line flattens: the same imbalance moves a deep market less.";
      else if (qa < 0.15) story = "With almost no quote activity, trades are nearly all the imbalance there is, so trades alone explain the moves well. Real markets aren't like this: most book events are new orders and cancellations, not trades.";
      else story = "Using trades only, the cloud spreads out and R² falls to about " + Math.round(r2 * 100) + "%: the price is also being moved by orders joining and leaving the best prices, which a trades-only count never sees. The more active the quotes, the worse trades alone do. This is why the book version is the better signal.";
      $("ip-story").textContent = story;
    };

    [dIn, qIn].forEach((x) => x.addEventListener("input", draw));
    $("ip-again").addEventListener("click", () => { seed += 1; draw(); });
    onResize("chart-ip", draw);
    H.charts(draw);
  }
})();