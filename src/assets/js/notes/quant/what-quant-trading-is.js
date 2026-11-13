// Interactives for the note "What Quant Trading Is" (Quant · Quant Trading Firms).
// "A hundred small bets" is drawn at its real width, so the labels stay readable on a phone.
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
  const choice = (boxId, items, start, onPick) => {
    const box = $(boxId);
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = it;
      b.setAttribute("aria-pressed", i === start ? "true" : "false");
      b.addEventListener("click", () => { [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); onPick(i); });
      box.append(b);
    });
    return box;
  };
  const unpress = (boxId) => [...$(boxId).children].forEach((c) => c.setAttribute("aria-pressed", "false"));
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const rng = (s) => () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  // Standard normal cumulative probability (Abramowitz and Stegun 7.1.26)
  const Phi = (x) => {
    const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
    return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  };
  const num = (v) => Math.round(v).toLocaleString("en-GB");
  const signed = (v) => (v <= -0.5 ? "−" : v >= 0.5 ? "+" : "") + num(Math.abs(v));
  const short = (v) => {
    const a = Math.abs(v), s = v < 0 ? "−" : "";
    if (a >= 1e6) return s + +(a / 1e6).toFixed(1) + "m";
    if (a >= 1e4) return s + +(a / 1e3).toFixed(0) + "k";
    if (a >= 1e3) return s + +(a / 1e3).toFixed(1) + "k";
    return s + Math.round(a);
  };
  const pct = (x) => (x < 0.001 ? "under 0.1%" : x > 0.999 ? "over 99.9%" : (x * 100).toFixed(x < 0.1 ? 1 : 0) + "%");

  // ---------- From the pit to the server ----------
  if ($("qt-era-card")) {
    const ERAS = [
      { b: "The pit", h: "The pit (until the 1990s)",
        rows: [["How a trade happened", "Traders in coloured jackets stood in a ring, shouting and using hand signals. A deal was agreed face to face and written on a card."],
          ["Smallest price step", "US shares were priced in eighths of a dollar: 12.5 cents."],
          ["Speed", "Seconds to minutes per trade."],
          ["Who had the edge", "People physically on the floor, who saw the orders arriving before anyone else."]] },
      { b: "Screens", h: "Screens arrive (1970s to 1990s)",
        rows: [["How a trade happened", "Prices moved onto screens. NASDAQ started as an electronic quote system in 1971; London's Big Bang in October 1986 moved share dealing from the floor to screens and phones; in FX, Reuters and EBS matching systems arrived in the early 1990s."],
          ["Smallest price step", "Still fractions. The New York Stock Exchange moved from eighths to sixteenths (6.25 cents) in 1997."],
          ["Speed", "Seconds. A person still clicked or phoned to trade."],
          ["Who had the edge", "Banks' dealing rooms with the best screens, clients and information."]] },
      { b: "Pennies", h: "Pennies (2001)",
        rows: [["How a trade happened", "Electronic order books, with computers starting to place and cancel orders by themselves."],
          ["Smallest price step", "US shares switched to decimals in 2001: from 6.25 cents to 1 cent."],
          ["Speed", "Under a second for the fastest firms."],
          ["Who had the edge", "Firms that could live on tiny spreads. A cent a share only adds up if you trade millions of times, cheaply: a job for software."]] },
      { b: "The speed race", h: "The speed race (2005 to 2010)",
        rows: [["How a trade happened", "New rules (Reg NMS in the US, in force from 2007, and MiFID in Europe from November 2007) let new electronic venues compete with the old exchanges. Firms put their servers inside exchange data centres (colocation) to be closer to the matching engine."],
          ["Smallest price step", "1 cent, but now spread across many competing venues."],
          ["Speed", "Milliseconds, then microseconds."],
          ["Who had the edge", "The fastest firms. By 2009, one industry estimate put high-frequency trading at around 60% of US share volume. The May 2010 Flash Crash (Crashes That Changed the Rules) showed the risks."]] },
      { b: "Today", h: "Today",
        rows: [["How a trade happened", "Almost entirely on screens. CME Group closed most of its futures pits in July 2015, when shouting in the pit was about 1% of futures volume; the London gold price became an electronic auction the same year."],
          ["Smallest price step", "1 cent for most US shares; tick sizes are set by each market and are a design choice in their own right (the Microstructure chapter)."],
          ["Speed", "Tens of microseconds from seeing a price to sending an order, for the fastest firms."],
          ["Who had the edge", "Firms combining research, technology and risk control at scale. People design, watch and improve the machines rather than placing each trade."]] },
    ];
    const show = (i) => {
      const e = ERAS[i], card = $("qt-era-card");
      card.textContent = "";
      const h = document.createElement("h4"); h.textContent = e.h; card.append(h);
      const dl = document.createElement("dl");
      e.rows.forEach(([k, v]) => {
        const dt = document.createElement("dt"); dt.textContent = k;
        const dd = document.createElement("dd"); dd.textContent = v;
        dl.append(dt, dd);
      });
      card.append(dl);
    };
    choice("qt-era-pick", ERAS.map((e) => e.b), 0, show);
    show(0);
  }

  // ---------- A hundred small bets ----------
  if ($("chart-sb")) {
    const PATHS = 40, STEPS = 300;
    const PRESETS = [{ b: "Fair coin", p: 50 }, { b: "Deltashark's coin", p: 51 }, { b: "Casino on red", p: 51.35 }];
    let seed = 7;
    const draw = () => {
      const p = parseFloat($("sb-p").value) / 100;
      const n = Math.max(10, Math.round(10 ** parseFloat($("sb-n").value)));
      const c = parseFloat($("sb-c").value);
      $("sb-p-out").textContent = (p * 100).toFixed(2) + "%";
      $("sb-n-out").textContent = num(n);
      $("sb-c-out").textContent = c.toFixed(3) + " units";

      const mu = 2 * p - 1 - c, sd1 = 2 * Math.sqrt(p * (1 - p));
      const E = n * mu, SD = sd1 * Math.sqrt(n);

      // Simulate each trader's running total in up to STEPS chunks of bets
      const K = Math.min(n, STEPS), r = rng(seed), paths = [];
      let ended = 0;
      for (let j = 0; j < PATHS; j++) {
        const pts = [[0, 0]];
        let done = 0, tot = 0;
        for (let k = 1; k <= K; k++) {
          const upto = Math.round((k * n) / K), m = upto - done;
          let wins;
          if (m <= 40) { wins = 0; for (let i = 0; i < m; i++) if (r() < p) wins++; }
          else wins = Math.min(m, Math.max(0, Math.round(m * p + Math.sqrt(m * p * (1 - p)) * normal(r))));
          tot += 2 * wins - m - c * m;
          done = upto;
          pts.push([done, tot]);
        }
        if (tot < 0) ended++;
        paths.push(pts);
      }

      const svg = $("chart-sb"), w = fit(svg, 300), h = 300;
      let lo = Math.min(E - 2.4 * SD, 0), hi = Math.max(E + 2.4 * SD, 0);
      paths.forEach((pts) => pts.forEach(([, v]) => { if (v < lo) lo = v; if (v > hi) hi = v; }));
      const span0 = hi - lo, raw = span0 / 5, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
      const y0 = Math.floor(lo / step) * step, y1 = Math.ceil(hi / step) * step;
      const yt = []; for (let v = y0; v <= y1 + step / 2; v += step) yt.push(Math.round(v * 1e6) / 1e6);
      const pad = { l: 46, r: 14, t: 24, b: 40 };
      const sc = H.frame(svg, w, h, pad, [0, n], [y0, y1], [], yt, short);
      // x labels drawn by hand so big numbers read as 10k, 100k
      const xt = w < 420 ? [0, n / 2, n] : [0, n / 4, n / 2, (3 * n) / 4, n];
      xt.forEach((x) => {
        el("line", { x1: sc.sx(x), x2: sc.sx(x), y1: pad.t, y2: h - pad.b, class: "grid" }, svg);
        el("text", { x: sc.sx(x), y: h - pad.b + 18, "text-anchor": x === n ? "end" : x === 0 ? "start" : "middle" }, svg).textContent = short(x);
      });
      el("text", { x: w - pad.r, y: h - 4, "text-anchor": "end" }, svg).textContent = "Bets made";
      el("text", { x: 4, y: 13 }, svg).textContent = "Running profit (units)";

      // 95% band: E ± 2 SD, growing with the square root of bets made
      const G = 60;
      let up = "", dn = "";
      for (let i = 0; i <= G; i++) {
        const x = (i / G) * n, e = x * mu, s = 2 * sd1 * Math.sqrt(x);
        up += (i ? "L" : "M") + sc.sx(x).toFixed(1) + " " + sc.sy(e + s).toFixed(1);
        dn = "L" + sc.sx(x).toFixed(1) + " " + sc.sy(e - s).toFixed(1) + dn;
      }
      el("path", { d: up + dn + "Z", fill: tone(), "fill-opacity": 0.13, stroke: "none" }, svg);
      paths.forEach((pts) => {
        const d = pts.map(([x, v], i) => (i ? "L" : "M") + sc.sx(x).toFixed(1) + " " + sc.sy(v).toFixed(1)).join("");
        el("path", { d, fill: "none", stroke: grey(), "stroke-width": 1, "stroke-opacity": 0.55 }, svg);
      });
      el("line", { x1: sc.sx(0), x2: sc.sx(n), y1: sc.sy(0), y2: sc.sy(E), stroke: tone(), "stroke-width": 2.6 }, svg);
      [1, -1].forEach((sgn) => {
        let d = "";
        for (let i = 0; i <= G; i++) { const x = (i / G) * n; d += (i ? "L" : "M") + sc.sx(x).toFixed(1) + " " + sc.sy(x * mu + sgn * 2 * sd1 * Math.sqrt(x)).toFixed(1); }
        el("path", { d, fill: "none", stroke: tone(), "stroke-width": 1.2, "stroke-dasharray": "5 4" }, svg);
      });
      const ey = sc.sy(E), lab = el("text", { x: sc.sx(n) - 6, y: E >= 0 ? ey - 8 : ey + 16, "text-anchor": "end", style: "fill:var(--text);font-weight:600" }, svg);
      lab.textContent = "expected " + signed(E);

      const z = SD > 0 ? E / SD : 0, pLoss = Phi(-z);
      const out = $("sb-read"); out.textContent = "";
      span(out, "Edge per bet: " + (Math.abs(mu) < 1e-9 ? "" : mu > 0 ? "+" : "−") + Math.abs(mu).toFixed(3) + " units");
      span(out, "Expected profit: " + signed(E));
      span(out, "Typical swing (1σ): ±" + num(SD));
      span(out, "Chance of ending down: " + pct(pLoss));
      span(out, "Traders who ended down: " + ended + " of " + PATHS);

      const pS = (p * 100).toFixed(2) + "%";
      let story;
      if (Math.abs(mu) < 1e-9) story = c > 0
        ? "A cost of " + c.toFixed(3) + " a bet exactly cancels the edge of a " + pS + " win rate. The expected line is flat, and all that trading more does is make the swings bigger."
        : "No edge: the expected line is flat at zero and the traders simply spread out wider and wider. About half end up and half down. Trading more doesn't make money, it just makes bigger swings.";
      else if (mu < 0) story = c > 0 && 2 * p - 1 > 0
        ? "The win rate gives an edge of " + (2 * p - 1).toFixed(3) + " a bet, but costs of " + c.toFixed(3) + " are bigger, so the expected line slopes down. Now repetition works against you: the more you trade, the surer the loss. This is the casino's arithmetic, from the gambler's side."
        : "With a negative edge, repetition works against you: the more you trade, the surer the loss.";
      else if (z < 1) story = "The edge is real but buried in luck. After " + num(n) + " bets the typical swing (±" + num(SD) + ") is bigger than the expected profit (" + signed(E) + "), so you'd end down " + pct(pLoss) + " of the time, and might give up on a good strategy. Add more bets, or find a bigger edge.";
      else if (z < 3) story = "The band has lifted clear of zero for most traders: expected profit " + signed(E) + " against swings of ±" + num(SD) + ", so " + ended + " of 40 ended down. This is Deltashark's example: a coin barely better than fair, made reliable by repetition. Try ten times the bets and the band leaves zero behind.";
      else story = "With " + num(n) + " bets the expected profit is " + z.toFixed(1) + " standard deviations above zero: losing is now very unlikely (" + pct(pLoss) + "). This is how a casino, or a busy market maker, works. Now raise the cost per bet and watch how little it takes to wipe the edge out.";
      $("sb-story").textContent = story;
    };
    choice("sb-pick", PRESETS.map((x) => x.b), 1, (i) => { $("sb-p").value = PRESETS[i].p; draw(); });
    $("sb-p").addEventListener("input", () => { unpress("sb-pick"); draw(); });
    ["sb-n", "sb-c"].forEach((id) => $(id).addEventListener("input", draw));
    $("sb-again").addEventListener("click", () => { seed = (seed * 48271 + 11) % 2147483647; draw(); });
    onResize("chart-sb", draw);
    H.charts(draw);
  }
})();