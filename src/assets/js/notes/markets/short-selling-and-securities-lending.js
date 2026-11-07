// Charts for the note "Short Selling and Securities Lending" (Markets · How Markets Work).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, frame, tex, colour, niceMax } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const fmt = (v, dp) => (Math.abs(v - Math.round(v)) < 1e-9 && !dp ? String(Math.round(v)) : v.toFixed(dp == null ? 1 : dp));

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

  // ---------- Who holds what? (the life of a short) ----------
  if (has("chart-loop")) {
    // Parties: 0 lender, 1 you, 2 the market. Moves: [from, to, "s" shares | "c" cash]
    const STEPS = [
      {
        n: "1. Borrow", price: "60.00",
        moves: [[0, 1, "s"]],
        hold: ["Has lent out 1,000 shares", "Has 1,000 borrowed shares, and owes 1,000 back", "Buyers and sellers, price 60.00"],
        story: "The lender's 1,000 shares move to you. You don't own them: you owe 1,000 shares back, whatever they cost by then.",
      },
      {
        n: "2. Sell", price: "60.00",
        moves: [[1, 2, "s"], [2, 1, "c"], [1, 0, "c"]],
        hold: ["Holds 61,200 of your cash as collateral (102%)", "No shares. Owes 1,000. Has posted 61,200", "A buyer now owns the 1,000 shares, with the vote and dividends"],
        story: "You sell the borrowed shares for 60,000. That cash, plus 1,200 more of yours, goes to the lender as collateral. The buyer has no idea the shares were borrowed: they're normal shares to them.",
      },
      {
        n: "3. Wait", price: "51.00",
        moves: [[1, 0, "c"], [0, 1, "c"]],
        hold: ["Earns interest on the cash, plus your borrow fee", "Pays the fee every day, and any dividend", "The price drifts down to 51.00"],
        story: "Every day you pay the borrow fee (and any dividend) to the lender. Every day the position is revalued: as the price falls, the lender needs less collateral and hands some back. If the price rose instead, you'd be asked for more.",
      },
      {
        n: "4. Buy back and return", price: "51.00",
        moves: [[1, 2, "c"], [2, 1, "s"], [1, 0, "s"], [0, 1, "c"]],
        hold: ["Has its 1,000 shares back, and kept the fees", "Sold for 60,000, bought back for 51,000: 9,000 profit, minus fees", "A seller received 51,000 for 1,000 shares"],
        story: "You buy 1,000 shares in the market for 51,000 and hand them back. The lender returns your collateral. You sold high and bought low: 9,000, minus the fees you paid while you waited.",
      },
    ];
    const NAMES = [["Lender", "pension fund"], ["You", "the short seller"], ["The market", ""]];
    const BX = [20, 240, 460], BW = 160, BY = 22, BH = 96;
    let step = 0;
    const draw = () => {
      const S = STEPS[step], t = tone(), g = grey(), c = card();
      const svg = $("chart-loop");
      svg.textContent = "";
      NAMES.forEach((nm, i) => {
        const busy = S.moves.some((m) => m[0] === i || m[1] === i);
        el("rect", { x: BX[i], y: BY, width: BW, height: BH, rx: 12, fill: c, stroke: busy ? t : g, "stroke-width": busy ? 2.5 : 1 }, svg);
        el("text", { x: BX[i] + BW / 2, y: BY + 40, "text-anchor": "middle", style: "font-size:18px;font-weight:600;fill:var(--text)" }, svg).textContent = nm[0];
        el("text", { x: BX[i] + BW / 2, y: BY + 66, "text-anchor": "middle", style: "font-size:14px" }, svg).textContent = i === 2 ? "price " + S.price : nm[1];
      });
      // Arrows live in the two gaps; shares on the upper lane, cash on the lower
      S.moves.forEach(([a, b, kind]) => {
        const gap = Math.min(a, b);                     // 0: lender–you gap, 1: you–market gap
        const x0 = BX[gap] + BW + 10, x1 = BX[gap + 1] - 10;
        const right = b > a, y = kind === "s" ? BY + 34 : BY + 64;
        const col = kind === "s" ? t : g;
        const xs = right ? x0 : x1, xe = right ? x1 - 8 : x0 + 8;
        el("line", { x1: xs, y1: y, x2: xe, y2: y, stroke: col, "stroke-width": kind === "s" ? 4 : 3, "stroke-linecap": "round" }, svg);
        const tip = right ? x1 : x0, back = right ? tip - 12 : tip + 12;
        el("polygon", { points: tip + "," + y + " " + back + "," + (y - 7) + " " + back + "," + (y + 7), fill: col }, svg);
      });
      const row = $("loop-hold");
      row.textContent = "";
      S.hold.forEach((h) => { const td = document.createElement("td"); td.textContent = h; row.appendChild(td); });
      $("loop-story").textContent = S.story;
    };
    buttons("loop-step", STEPS, (i) => { step = i; draw(); }, 0);
    H.charts(draw);
  }

  // ---------- Can the short outrun its costs? ----------
  if (has("chart-carry")) {
    const FEES = [
      { n: "Easy 0.3%", f: 0.3 },
      { n: "Warm 5%", f: 5 },
      { n: "Hard to borrow 25%", f: 25 },
      { n: "Special 60%", f: 60 },
    ];
    let fi = 1;
    const draw = () => {
      const fall = parseInt($("carry-fall").value, 10);
      const div = parseFloat($("carry-div").value);
      const T = parseInt($("carry-t").value, 10);
      $("carry-fall-out").textContent = fall + "%";
      $("carry-div-out").textContent = fmt(div) + "%";
      $("carry-t-out").textContent = T === 1 ? "1 month" : T + " months";
      const yearly = FEES[fi].f + div;              // % of value per year
      const cost = (m) => (yearly * m) / 12;
      const t = tone(), g = grey(), c = card();
      const top = niceMax(Math.max(fall * 1.5, cost(T) * 1.15, 10));
      const svg = $("chart-carry"), W = 640, Ht = 290, pad = { l: 56, r: 24, t: 16, b: 38 };
      const f = frame(svg, W, Ht, pad, [0, 24], [0, top], [], [0, top / 4, top / 2, (3 * top) / 4, top], (y) => fmt(y) + "%");
      [0, 6, 12, 18, 24].forEach((x) => {
        el("text", { x: f.sx(x), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = x;
      });
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "months held";

      // Profit from the fall: one flat line
      el("line", { x1: f.sx(0), x2: f.sx(24), y1: f.sy(fall), y2: f.sy(fall), stroke: g, "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);

      // Costs so far: a straight line, clipped at the top
      const mEnd = Math.min(24, (top * 12) / yearly);
      el("line", { x1: f.sx(0), y1: f.sy(0), x2: f.sx(mEnd), y2: f.sy(cost(mEnd)), stroke: t, "stroke-width": 3, "stroke-linecap": "round" }, svg);

      // Where costs catch up with the profit
      const mBe = (12 * fall) / yearly;
      if (mBe <= 24) {
        el("line", { x1: f.sx(mBe), x2: f.sx(mBe), y1: f.sy(0), y2: f.sy(top), stroke: g, "stroke-dasharray": "2 4" }, svg);
        const right = mBe > 15;
        el("text", { x: f.sx(mBe) + (right ? -6 : 6), y: f.sy(0) - 8, "text-anchor": right ? "end" : "start", style: "fill:" + g }, svg).textContent = "costs = profit: " + fmt(mBe) + " months";
      }

      // You are here
      el("circle", { cx: f.sx(T), cy: f.sy(cost(T)), r: 7, fill: t, stroke: c, "stroke-width": 2 }, svg);

      const net = fall - cost(T);
      const out = $("carry-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Fall } " + fall + "\\% - \\text{costs } " + fmt(cost(T)) + "\\% = " + (net >= 0 ? "" : "-") + fmt(Math.abs(net)) + "\\%");
      tex(b, mBe <= 24 ? "\\text{Costs eat the whole fall after } " + fmt(mBe) + "\\text{ months}" : "\\text{Costs never catch up within two years}");

      let story;
      if (net <= 0) story = "You were right about the share and still lost money. At " + fmt(yearly) + "% a year, the costs ate the whole " + fall + "% fall after " + fmt(mBe) + " months, and you waited " + T + ". This is why hard-to-borrow shorts need the fall to happen fast.";
      else if (net < fall / 3) story = "Still a profit, but most of it went to the lender: you keep " + fmt(net) + "% of the " + fall + "% fall. Any delay from here and it's gone.";
      else if (FEES[fi].f < div) story = "The borrow fee is almost nothing here. The dividend you owe the lender is the bigger cost, so check the dividend dates before shorting.";
      else story = "Comfortable: you keep " + fmt(net) + "% of the " + fall + "% fall. Try the Hard to borrow and Special buttons with the same idea and see how fast the room for waiting shrinks.";
      $("carry-story").textContent = story;
    };
    buttons("carry-fee", FEES, (i) => { fi = i; draw(); }, 1);
    ["carry-fall", "carry-div", "carry-t"].forEach((id) => $(id).addEventListener("input", draw));
    H.charts(draw);
  }

  // ---------- Watch a squeeze ----------
  if (has("chart-squeeze")) {
    // si: short interest as % of float; dtc: days of normal volume it takes to cover
    const CROWD = [
      { n: "Lightly shorted", si: 4, dtc: 1 },
      { n: "Crowded", si: 20, dtc: 6 },
      { n: "Extreme", si: 45, dtc: 12 },
    ];
    const DAYS = 20;
    const PAIN_LO = 0.05, PAIN_W = 0.6;   // shorts' pain points spread evenly from +5% to +65%
    const KICK = 0.08;                     // a full day's volume of forced buying adds 8% to the price
    const FADE = 0.15;                     // with no forced buying, the price drifts back 15% of the way each day
    let ci = 1;
    const simulate = (crowd, news) => {
      const base = 100 * (1 + news);
      const P = [100], buys = [0];
      let covered = 0, queue = 0, p = 100;
      for (let d = 1; d <= DAYS; d++) {
        if (d === 1) p = base;
        const want = Math.min(1, Math.max(0, (p / 100 - 1 - PAIN_LO) / PAIN_W));
        if (want > covered) { queue += want - covered; covered = want; }
        const buy = Math.min(queue, 1 / crowd.dtc);  // as a share of all shorts; one day's volume = 1/dtc
        queue -= buy;
        const adv = buy * crowd.dtc;                // forced buying in days of normal volume
        if (adv > 1e-6) p *= 1 + KICK * adv;
        else p -= FADE * (p - base);
        P.push(p); buys.push(adv);
      }
      return { P, buys, base, covered };
    };
    const draw = () => {
      const newsPct = parseInt($("sq-news").value, 10);
      $("sq-news-out").textContent = "+" + newsPct + "%";
      const crowd = CROWD[ci], r = simulate(crowd, newsPct / 100);
      const peak = Math.max(...r.P), peakDay = r.P.indexOf(peak);
      const forced = r.buys.filter((b) => b > 1e-6).length;
      const t = tone(), g = grey(), c = card();
      const top = [140, 200, 300, 400].find((v) => v >= peak * 1.05) || 400;
      const step = top <= 140 ? 20 : top <= 200 ? 20 : top <= 300 ? 50 : 100;
      const yt = [];
      for (let y = 100; y <= top; y += step) yt.push(y);
      const svg = $("chart-squeeze"), W = 640, Ht = 300, pad = { l: 56, r: 16, t: 16, b: 38 };
      const f = frame(svg, W, Ht, pad, [0, DAYS], [80, top], [], yt, (y) => y);
      [0, 5, 10, 15, 20].forEach((x) => {
        el("text", { x: f.sx(x), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = x;
      });
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "days after the news (price starts at 100)";

      // Bars: shorts buying back, up to a quarter of the chart's height for a full day's volume
      const barMax = (f.sy(80) - f.sy(top)) * 0.25, bw = (f.sx(1) - f.sx(0)) * 0.6;
      r.buys.forEach((b, d) => {
        if (b < 1e-6) return;
        el("rect", { x: f.sx(d) - bw / 2, y: f.sy(80) - b * barMax, width: bw, height: b * barMax, rx: 3, fill: g, "fill-opacity": 0.35 }, svg);
      });

      // The news alone: a jump, then flat
      el("path", { d: "M" + f.sx(0) + "," + f.sy(100) + "L" + f.sx(1) + "," + f.sy(r.base) + "L" + f.sx(DAYS) + "," + f.sy(r.base), fill: "none", stroke: g, "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);

      // With the squeeze
      let d = "";
      r.P.forEach((p, i) => { d += (i ? "L" : "M") + f.sx(i).toFixed(1) + "," + f.sy(p).toFixed(1); });
      el("path", { d, fill: "none", stroke: t, "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
      if (peak > r.base + 0.5) {
        el("circle", { cx: f.sx(peakDay), cy: f.sy(peak), r: 7, fill: t, stroke: c, "stroke-width": 2 }, svg);
        const right = peakDay > 14;
        el("text", { x: f.sx(peakDay) + (right ? -12 : 12), y: f.sy(peak) + 4, "text-anchor": right ? "end" : "start", style: "fill:" + t }, svg).textContent = "peak " + Math.round(peak);
      }

      const out = $("sq-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{News alone: } +" + newsPct + "\\% \\quad \\text{Peak: } +" + Math.round(peak - 100) + "\\%");
      tex(b, "\\text{Days of forced buying: } " + forced + " \\quad \\text{SI } " + crowd.si + "\\% \\text{ of float}");

      let story;
      if (forced === 0) story = "Nothing happens beyond the news. A rise of " + newsPct + "% doesn't reach anyone's pain point, so nobody is forced to buy. A crowded short is fuel, but it still needs a spark.";
      else if (ci === 0) story = "A small extra pop. With only " + crowd.si + "% of the float short, all the shorts together are about one day's normal volume, so their buying barely moves the price. It never reaches most of their pain points, and the price settles near where the news put it.";
      else story = "The news was worth +" + newsPct + "%, but forced buying took the price to +" + Math.round(peak - 100) + "% over " + forced + " days. Each wave of covering pushed the price past the next group's pain point. Once the shorts are out, nobody is left who has to buy, and the price starts sliding back.";
      $("sq-story").textContent = story;
    };
    buttons("sq-crowd", CROWD, (i) => { ci = i; draw(); }, 1);
    $("sq-news").addEventListener("input", draw);
    H.charts(draw);
  }
})();