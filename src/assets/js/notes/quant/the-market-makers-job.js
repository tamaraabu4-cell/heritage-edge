// Interactives for the note "The Market Maker's Job" (Quant · Market Making).
// The chart is drawn at its real width, so the labels stay readable on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, colour } = H;
  const tone = () => colour("--tone");

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
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const rng = (s) => () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const minutes = (m) => {
    m = Math.round(m);
    if (m < 60) return m + " min";
    const h = Math.floor(m / 60), r = m % 60;
    return h + " h" + (r ? " " + r + " min" : "");
  };
  const signed = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v);

  // ---------- Bridging time ----------
  if ($("chart-bt")) {
    const HOURS = 6.5;
    const nIn = $("bt-n"), pIn = $("bt-p");
    let seed = 7;
    const PRESETS = [
      { name: "Balanced day", n: 40, p: 50 },
      { name: "Quiet stock", n: 6, p: 50 },
      { name: "Sellers bunch up", n: 40, p: 36 },
    ];
    const pick = $("bt-pick");
    PRESETS.forEach((ps, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = ps.name;
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", () => {
        [...pick.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
        nIn.value = ps.n; pIn.value = ps.p; draw();
      });
      pick.append(b);
    });
    const unpick = () => [...pick.children].forEach((c) => c.setAttribute("aria-pressed", "false"));

    // One day of customers: each arrives at a random time and buys or sells one lot.
    const simulate = (perHour, pBuy, s) => {
      const r = rng(s);
      const events = [];
      let t = 0;
      for (;;) {
        t += -Math.log(1 - r()) / perHour;
        if (t >= HOURS) break;
        events.push({ t, buy: r() < pBuy });
      }
      // With a maker: inventory goes up when a customer sells to it, down when one buys.
      let inv = 0, maxAbs = 0, maxAt = 0, maxInv = 0;
      const path = events.map((e) => {
        inv += e.buy ? -1 : 1;
        if (Math.abs(inv) > maxAbs) { maxAbs = Math.abs(inv); maxAt = e.t; maxInv = inv; }
        return { t: e.t, inv };
      });
      // Without a maker: customers queue until someone on the other side arrives (first come, first served).
      const queue = [];
      let waited = 0, waitTotal = 0;
      events.forEach((e) => {
        if (queue.length && queue[0].buy !== e.buy) {
          const first = queue.shift();
          waited += 1; waitTotal += (e.t - first.t) * 60;
        } else queue.push(e);
      });
      return { events, path, inv, maxAbs, maxAt, maxInv, waited, avgWait: waited ? waitTotal / waited : 0, left: queue.length };
    };

    const draw = () => {
      const perHour = +nIn.value, pBuy = +pIn.value / 100;
      $("bt-n-out").textContent = perHour + "/hr";
      $("bt-p-out").textContent = pIn.value + "%";
      const sim = simulate(perHour, pBuy, seed * 7919 + perHour * 31 + Math.round(pBuy * 100));

      const svg = $("chart-bt");
      const h = 280, w = fit(svg, h), narrow = w < 480;
      const pad = { l: 46, r: 14, t: 26, b: 40 };
      const M = [4, 6, 10, 16, 20, 30, 40, 60, 80, 100, 160, 200].find((m) => m >= sim.maxAbs * 1.35) || 200;
      const s = H.frame(svg, w, h, pad, [0, HOURS], [-M, M], [0, 1, 2, 3, 4, 5, 6], [-M, -M / 2, 0, M / 2, M], signed);
      el("text", { x: pad.l + (w - pad.l - pad.r) / 2, y: h - 6, "text-anchor": "middle" }, svg).textContent = "Hours into the trading day";
      el("text", { x: pad.l + 6, y: pad.t - 10 }, svg).textContent = narrow ? "Long (waiting for buyers)" : "Long: bought from sellers, waiting for buyers";
      el("text", { x: pad.l + 6, y: h - pad.b - 6 }, svg).textContent = narrow ? "Short (waiting for sellers)" : "Short: sold to buyers, waiting for sellers";

      let d = "M" + s.sx(0).toFixed(1) + " " + s.sy(0).toFixed(1);
      sim.path.forEach((p) => { d += "H" + s.sx(p.t).toFixed(1) + "V" + s.sy(p.inv).toFixed(1); });
      d += "H" + s.sx(HOURS).toFixed(1);
      el("path", { d: d + "V" + s.sy(0).toFixed(1) + "Z", fill: tone(), "fill-opacity": "0.14", stroke: "none" }, svg);
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 2, "stroke-linejoin": "round" }, svg);
      if (sim.maxAbs > 0) {
        const cx = s.sx(sim.maxAt), cy = s.sy(sim.maxInv);
        el("circle", { cx, cy, r: 7, fill: tone(), "fill-opacity": "0.25" }, svg);
        el("circle", { cx, cy, r: 4, fill: tone() }, svg);
      }

      const N = sim.events.length, trips = (N - Math.abs(sim.inv)) / 2;
      const box = $("bt-read"); box.textContent = "";
      span(box, "Customers served: " + N + ", all at once");
      span(box, "Round trips: " + trips);
      span(box, "Biggest position (dot): " + sim.maxAbs + " lots");
      span(box, "Ends the day: " + (sim.inv === 0 ? "flat" : (sim.inv > 0 ? "long " : "short ") + Math.abs(sim.inv) + " lots"));
      span(box, "Without a maker: " + sim.waited + " customers wait, " + minutes(sim.avgWait) + " on average; " + sim.left + " still waiting at the close");

      let story;
      if (perHour <= 12) story = "A quiet stock. Customers arrive many minutes apart, so without a maker they'd wait a long time, and some would never be matched. The maker holds each lot for longer, carrying more risk per round trip, which is why quiet stocks have wider spreads.";
      else if (Math.abs(pBuy - 0.5) >= 0.08) story = "One-sided flow. The inventory drifts away from zero and stays there: the maker is no longer just bridging time, it's holding a position it never chose. That's the problem Inventory Risk and Quote Skewing deal with.";
      else story = "Busy and balanced: buyers and sellers are equally likely, yet the line still wanders, because luck comes in streaks. With " + N + " customers, a typical day drifts about " + Math.round(Math.sqrt(N)) + " lots from zero at some point. Press Another day a few times. Real makers don't just wait for it to come back: they lean their prices to pull it home (Quote Skewing).";
      $("bt-story").textContent = story;
    };

    nIn.addEventListener("input", () => { unpick(); draw(); });
    pIn.addEventListener("input", () => { unpick(); draw(); });
    $("bt-again").addEventListener("click", () => { seed += 1; draw(); });
    H.charts(draw);
    onResize("chart-bt", draw);
  }

  // ---------- Maker or taker? ----------
  if ($("mt-list")) {
    const BOXES = ["Mostly making", "Mostly taking", "Both"];
    const CASES = [
      { d: "Citadel Securities filling retail orders sent by US brokers, all day, in thousands of stocks.", ok: [0], why: "Mostly making: it quotes both sides to all comers, earns the spread and wants to end flat. Retail orders are its flow." },
      { d: "A bank's FX desk streaming EUR/USD prices to corporate and fund clients on its own platform.", ok: [0], why: "Mostly making: a dealer quoting two-way prices, matching clients against each other (internalising) and offloading the rest." },
      { d: "An options dealer quoting thousands of options on a share, then buying and selling the share itself to stay hedged.", ok: [2], why: "Both: making in the options market, taking in the share market to hedge. Its hedging is a large, mechanical source of share orders." },
      { d: "An ETF market maker quoting a bond ETF on the exchange and buying or selling the bonds inside it to hedge.", ok: [2], why: "Both: it makes the market in the ETF and takes liquidity in the underlying bonds (the next note covers how ETF market makers work)." },
      { d: "A statistical arbitrage fund that buys and sells hundreds of shares a day based on short-term signals.", ok: [1], why: "Mostly taking: it trades because its model has a view. It may use limit orders to save costs, but the intent is directional." },
      { d: "A long/short equity fund buying a stock it researched, using limit orders that sit on the bid all day.", ok: [1], why: "Mostly taking, even though its orders rest in the book. It wants the position, and if the orders don't fill it will cross the spread. Intent decides, not order type." },
      { d: "An index fund buying the shares that join the S&P 500 at the close on rebalance day.", ok: [1], why: "Taking: it must buy, at a known time, whatever the price. That predictability is useful to the makers on the other side." },
      { d: "Someone buying 20 shares of Tesla on a phone app.", ok: [1], why: "Taking: a market order paying the spread for immediacy. In the US the order usually goes to a wholesaler (a market maker) rather than an exchange." },
    ];
    const list = $("mt-list"), state = CASES.map(() => null);
    const score = () => {
      const done = state.filter((x) => x !== null).length, right = state.filter((x) => x === true).length;
      $("mt-score").textContent = done ? right + " of " + done + " right first time" + (done === CASES.length ? (right >= 6 ? ". You can tell intent from order type." : ". Look again at what each one is trying to do, not how it sends orders.") : "") : "";
    };
    CASES.forEach((c, i) => {
      const li = document.createElement("li"); li.className = "mt-row";
      const p = document.createElement("p"); p.className = "mt-case"; p.textContent = c.d;
      const opts = document.createElement("div"); opts.className = "mt-opts"; opts.setAttribute("role", "group"); opts.setAttribute("aria-label", "Maker or taker?");
      const why = document.createElement("p"); why.className = "mt-why"; why.hidden = true;
      BOXES.forEach((b, j) => {
        const btn = document.createElement("button"); btn.type = "button"; btn.textContent = b;
        btn.addEventListener("click", () => {
          const good = c.ok.includes(j);
          if (state[i] === null) state[i] = good;
          if (good) {
            [...opts.children].forEach((x, q) => { x.classList.toggle("right", c.ok.includes(q)); x.disabled = true; });
            why.textContent = "";
            const st = document.createElement("strong"); st.textContent = state[i] ? "Right. " : "Got there. ";
            why.append(st, document.createTextNode(c.why));
            why.hidden = false;
          } else {
            btn.classList.add("wrong"); btn.disabled = true;
          }
          score();
        });
        opts.append(btn);
      });
      li.append(p, opts, why);
      list.append(li);
    });
  }
})();