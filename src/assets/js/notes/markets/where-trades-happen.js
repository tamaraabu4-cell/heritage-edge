// Charts for the note "Where Trades Happen" (Markets · How Markets Work).
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
  const f2 = (v) => v.toFixed(2);

  // ---------- Ask the dealers (RFQ) ----------
  // Dealers A to C are the lesson's example; D to F are extra dealers you can add.
  if (has("chart-rfq")) {
    const DEALERS = [
      { name: "A", bid: 99.10, offer: 99.30 },
      { name: "B", bid: 99.12, offer: 99.28 },
      { name: "C", bid: 99.05, offer: 99.32 },
      { name: "D", bid: 99.11, offer: 99.31 },
      { name: "E", bid: 99.13, offer: 99.29 },
      { name: "F", bid: 99.09, offer: 99.26 },
    ];
    const W = 640, Ht = 300, pad = { l: 64, r: 116, t: 16, b: 34 };

    const draw = () => {
      const n = parseInt($("rfq-n").value, 10);
      $("rfq-n-out").textContent = n;
      const asked = DEALERS.slice(0, n);
      const bestBid = Math.max(...asked.map((d) => d.bid));
      const bestOffer = Math.min(...asked.map((d) => d.offer));

      const svg = $("chart-rfq");
      const s = frame(svg, W, Ht, pad, [0, 7], [99.0, 99.4], [], [99.0, 99.1, 99.2, 99.3, 99.4], (y) => f2(y));
      const t = tone(), g = grey(), c = card();

      // Best bid and best offer across everyone asked
      [[bestOffer, "best offer " + f2(bestOffer)], [bestBid, "best bid " + f2(bestBid)]].forEach(([v, label]) => {
        el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(v), y2: s.sy(v), stroke: t, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
        el("text", { x: W - pad.r + 8, y: s.sy(v) + 4, style: "fill:" + t }, svg).textContent = label;
      });

      DEALERS.forEach((d, i) => {
        const x = s.sx(i + 1), on = i < n;
        const op = on ? 1 : 0.25;
        el("line", { x1: x, x2: x, y1: s.sy(d.bid), y2: s.sy(d.offer), stroke: g, "stroke-width": 4, "stroke-linecap": "round", "stroke-opacity": op }, svg);
        const bidBest = on && d.bid === bestBid, offerBest = on && d.offer === bestOffer;
        el("circle", { cx: x, cy: s.sy(d.bid), r: bidBest ? 7 : 5, fill: bidBest ? t : c, stroke: bidBest ? t : g, "stroke-width": 2, "fill-opacity": 1, "stroke-opacity": op }, svg);
        el("circle", { cx: x, cy: s.sy(d.offer), r: offerBest ? 7 : 5, fill: offerBest ? t : c, stroke: offerBest ? t : g, "stroke-width": 2, "stroke-opacity": op }, svg);
        const ta = { x, y: Ht - 10, "text-anchor": "middle" };
        if (!on) { ta.style = "fill:" + g; ta["fill-opacity"] = op; }
        el("text", ta, svg).textContent = d.name;
      });

      el("text", { x: pad.l - 8, y: Ht - 10, "text-anchor": "end" }, svg).textContent = "Dealer";

      const spread = bestOffer - bestBid, mid = (bestOffer + bestBid) / 2, bp = (spread / mid) * 10000;
      const out = $("rfq-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"), cc = document.createElement("span");
      out.append(a, b, cc);
      tex(a, "\\text{You buy at } " + f2(bestOffer));
      tex(b, "\\text{Spread} = " + f2(bestOffer) + " - " + f2(bestBid) + " = " + f2(spread));
      tex(cc, "\\approx " + bp.toFixed(1) + "\\text{ bp}");

      const story = $("rfq-story");
      if (n === 1) story.textContent = "One dealer, no competition: you get Dealer A's price, 0.20 wide. Only one dealer knows you're buying.";
      else if (n <= 4) story.textContent = n + " dealers asked. Competition has tightened the price, but " + n + " dealers now know you want to buy, and any of them could buy ahead of you.";
      else story.textContent = n + " dealers asked. Each extra dealer improves the price by less, while the number who know what you're doing keeps growing. That's the trade-off in every RFQ.";
    };
    $("rfq-n").addEventListener("input", draw);
    H.charts(draw);
  }

  // ---------- The venue spectrum ----------
  if (has("chart-venues")) {
    const V = [
      { short: "Exchange", how: "One central order book. Orders match by price, then by who was first.", who: "Anyone, anonymously, with a clearing house in the middle.", before: "Everyone sees the best prices and how much is waiting at each.", after: "Price and size published straight away.", use: "Everyday trading in shares and futures.", eg: "London Stock Exchange, NYSE, CME" },
      { short: "MTF / ECN", how: "An electronic order book run by a firm that isn't the main exchange. Works like a mini exchange, competing on fees and speed. Europe calls these multilateral trading facilities; the US calls them electronic communication networks.", who: "Anyone connected to it, anonymously.", before: "Visible, like an exchange.", after: "Published.", use: "Trading the same shares more cheaply than on the main exchange.", eg: "Turquoise, Aquis" },
      { short: "Periodic auction", how: "Orders gather for a short spell, from a fraction of a second to a few minutes, then all match at once at a single price.", who: "Whoever joined that auction.", before: "Little or nothing, sometimes a likely price.", after: "Published.", use: "Trading without having to race for speed. Opening and closing auctions are the biggest: the US closing auction alone is around 7% to 10% of a day's share trading.", eg: "Exchange closing auctions; Cboe periodic auctions" },
      { short: "Dark pool", how: "Orders are hidden and matched in private, usually at the midpoint of the public price.", who: "Other users of the pool. In some, the operator's own desk.", before: "Nothing at all.", after: "Reported after the trade.", use: "Big orders that would move the price if anyone saw them.", eg: "Liquidnet; pools run by big banks" },
      { short: "Dealer platform", how: "A bank or trading firm streams prices to its clients, who can click to trade.", who: "That one dealer.", before: "Only you see the price you're shown.", after: "Often reported to regulators, not always to the public.", use: "FX, bonds and ETFs, especially for clients of that bank.", eg: "Each big bank's own FX platform" },
      { short: "RFQ / voice", how: "You ask a few dealers for a price and deal with the best, on a screen or by phone.", who: "The dealer you choose.", before: "Only the dealers you asked.", after: "Limited reporting, depending on the market.", use: "Bonds, swaps, and big or unusual trades.", eg: "Tradeweb, Bloomberg, MarketAxess, a phone call" },
    ];
    let pick = 0;
    const X0 = 60, X1 = 580, Y = 50;
    const xAt = (i) => X0 + (i * (X1 - X0)) / (V.length - 1);

    const draw = () => {
      const svg = $("chart-venues");
      svg.textContent = "";
      const t = tone(), g = grey(), c = card();
      el("line", { x1: X0, x2: X1, y1: Y, y2: Y, stroke: g, "stroke-width": 2 }, svg);
      V.forEach((v, i) => {
        const x = xAt(i), on = i === pick;
        el("circle", { cx: x, cy: Y, r: on ? 13 : 8, fill: on ? t : c, stroke: on ? t : g, "stroke-width": 2 }, svg);
      });
      const lab = el("text", { x: Math.min(Math.max(xAt(pick), X0 + 40), X1 - 40), y: Y + 40, "text-anchor": "middle", style: "fill:" + t + ";font-size:18px" }, svg);
      lab.textContent = V[pick].short;
      el("text", { x: X0 - 12, y: 112 }, svg).textContent = "← everything on show";
      el("text", { x: X1 + 12, y: 112, "text-anchor": "end" }, svg).textContent = "private deals →";

      const v = V[pick], body = $("venue-card");
      body.textContent = "";
      [["How it works", v.how], ["Who's on the other side", v.who], ["What others see before", v.before], ["After the trade", v.after], ["Used for", v.use], ["Examples", v.eg]].forEach(([k, val]) => {
        const tr = document.createElement("tr");
        const th = document.createElement("td"), td = document.createElement("td");
        th.innerHTML = "<strong>" + k + "</strong>"; td.textContent = val;
        tr.append(th, td); body.appendChild(tr);
      });
    };

    document.querySelectorAll("[data-venue]").forEach((b) => b.addEventListener("click", () => {
      pick = parseInt(b.dataset.venue, 10);
      document.querySelectorAll("[data-venue]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      draw();
    }));
    H.charts(draw);
  }
})();