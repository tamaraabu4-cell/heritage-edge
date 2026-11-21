// Interactives for the note "What Speed Buys" (Quant · Microstructure).
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
  const pct = (v) => (v >= 0.995 ? "100" : v < 0.005 ? "0" : (100 * v).toFixed(0)) + "%";

  // ---------- Win the race ----------
  if ($("chart-wr")) {
    const N = 20000;
    const r = rng(42), Z = Array.from({ length: N * 3 }, () => normal(r));
    const PRESETS = [
      { name: "Snipers ahead", m: 45, a: 30, b: 38, j: 6, d: 0 },
      { name: "Fast maker", m: 25, a: 30, b: 38, j: 6, d: 0 },
      { name: "Delay on takers", m: 45, a: 30, b: 38, j: 6, d: 30 },
      { name: "Noisy race", m: 45, a: 30, b: 38, j: 20, d: 0 },
    ];
    const ins = { m: $("wr-m"), a: $("wr-a"), b: $("wr-b"), j: $("wr-j"), d: $("wr-d") };
    const setPick = buttons("wr-pick", PRESETS.map((p) => p.name), 0, (i) => {
      const p = PRESETS[i]; Object.keys(ins).forEach((k) => { ins[k].value = p[k]; }); draw();
    });

    const draw = () => {
      const m = +ins.m.value, a = +ins.a.value, b = +ins.b.value, j = +ins.j.value, d = +ins.d.value;
      $("wr-m-out").textContent = m + " μs"; $("wr-a-out").textContent = a + " μs"; $("wr-b-out").textContent = b + " μs";
      $("wr-j-out").textContent = "±" + j + " μs"; $("wr-d-out").textContent = d + " μs";
      let mk = 0, aw = 0, bw = 0;
      for (let i = 0; i < N; i++) {
        const tm = Math.max(1, m + j * Z[3 * i]), ta = Math.max(1, a + d + j * Z[3 * i + 1]), tb = Math.max(1, b + d + j * Z[3 * i + 2]);
        if (tm <= ta && tm <= tb) mk++; else if (ta <= tb) aw++; else bw++;
      }
      const pm = mk / N, pa = aw / N, pb = bw / N;

      const svg = $("chart-wr");
      const hh = 260, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: 16, r: 16, t: 26, b: 92 };
      const iw = w - pad.l - pad.r, ih = hh - pad.t - pad.b;
      const xMax = Math.max(80, Math.ceil((Math.max(m, a + d, b + d) + 3.2 * j) / 20) * 20);
      const sx = (t) => pad.l + (t / xMax) * iw;
      const pdf = (t, mu) => Math.exp(-0.5 * ((t - mu) / j) ** 2);
      const sy = (v) => pad.t + ih - v * ih;
      const step = xMax > 160 ? 40 : 20;
      for (let t = 0; t <= xMax; t += step) {
        el("line", { x1: sx(t), x2: sx(t), y1: pad.t, y2: pad.t + ih, class: "grid" }, svg);
        el("text", { x: sx(t), y: pad.t + ih + 16, "text-anchor": "middle" }, svg).textContent = t;
      }
      el("line", { x1: pad.l, x2: w - pad.r, y1: pad.t + ih, y2: pad.t + ih, class: "axis" }, svg);
      el("text", { x: pad.l + iw / 2, y: pad.t + ih + 32, "text-anchor": "middle" }, svg).textContent = "Microseconds after the news";
      const curve = (mu, attrs) => {
        let p = "";
        for (let i = 0; i <= 200; i++) { const t = (i / 200) * xMax; p += (i ? "L" : "M") + sx(t).toFixed(1) + " " + sy(pdf(t, mu)).toFixed(1); }
        el("path", Object.assign({ d: p, fill: "none" }, attrs), svg);
      };
      if (d > 0) {
        // Where the snipers would have arrived without the delay
        curve(a, { stroke: grey(), "stroke-width": 1.5, "stroke-opacity": 0.35 });
        curve(b, { stroke: grey(), "stroke-width": 1.5, "stroke-opacity": 0.35, "stroke-dasharray": "6 4" });
      }
      curve(a + d, { stroke: grey(), "stroke-width": 2.5 });
      curve(b + d, { stroke: grey(), "stroke-width": 2.5, "stroke-dasharray": "6 4" });
      curve(m, { stroke: tone(), "stroke-width": 3 });
      const labels = [[m, "Maker", "var(--tone)"], [a + d, "A", "var(--text-2)"], [b + d, "B", "var(--text-2)"]].sort((p, q) => p[0] - q[0]);
      let lastX = -99;
      labels.forEach(([mu, lab, col]) => { let x = sx(mu); if (x - lastX < 34) x = lastX + 34; lastX = x; el("text", { x, y: sy(1) - 6, "text-anchor": "middle", style: "font-weight:600;fill:" + col }, svg).textContent = lab; });
      // Outcome bar
      const by = hh - 40, bh = 22;
      let x0 = pad.l;
      [[pm, tone(), 1, "Maker escapes"], [pa, grey(), 1, "A wins"], [pb, grey(), 0.55, "B wins"]].forEach(([p, f, op, lab]) => {
        const wid = p * iw;
        if (wid > 0.5) el("rect", { x: x0, y: by, width: wid, height: bh, fill: f, "fill-opacity": op }, svg);
        if (wid > (narrow ? 52 : 90)) el("text", { x: x0 + wid / 2, y: by + 15, "text-anchor": "middle", style: "fill:" + (f === tone() ? "var(--on-tone)" : "var(--text)") }, svg).textContent = (narrow ? lab.split(" ")[0] : lab) + " " + pct(p);
        x0 += wid;
      });

      const box = $("wr-read"); box.textContent = "";
      span(box, "Maker escapes: " + pct(pm));
      span(box, "A wins: " + pct(pa));
      span(box, "B wins: " + pct(pb));
      span(box, "Maker's cost per 100 races at half a tick each: " + ((pa + pb) * 100 * 0.5).toFixed(0) + " ticks");
      let story;
      if (pm > 0.9) story = d > 0 ? "The delay on aggressive orders gives the maker's cancel a head start, so it pulls the stale quote before either sniper arrives. This is how asymmetric speed bumps like Eurex's work: real ones (1–3 milliseconds at Eurex, 350 microseconds at IEX) are far longer than these races, so the maker almost always gets out." : "The maker reacts faster than both snipers, so it cancels before they arrive almost every time. This is defensive speed: the toll it pays to fast traders shrinks, so it can quote tighter.";
      else if (pa + pb > 0.9) story = "The snipers are faster than the maker's cancel, so the stale quote is taken almost every time. Between them, A wins most races, not all: " + pct(pa) + " against " + pct(pb) + ". Winner takes all, so second place earns nothing despite paying for nearly the same speed.";
      else story = "With this much uncertainty, nobody wins reliably: small average leads are swamped by jitter. That's why firms care about consistent latency, not just a fast average, and why venues that add random delays can make tiny speed edges almost worthless.";
      $("wr-story").textContent = story;
    };

    Object.values(ins).forEach((x) => x.addEventListener("input", () => { setPick(-1); draw(); }));
    onResize("chart-wr", draw);
    H.charts(draw);
  }

  // ---------- What does a microsecond buy? ----------
  if ($("chart-ms")) {
    const STRATS = [
      { name: "Stale-quote arbitrage", h: 20e-6, hl: "20 μs" },
      { name: "Market making quotes", h: 1e-3, hl: "1 ms" },
      { name: "Execution algo", h: 30, hl: "30 s" },
      { name: "Intraday momentum", h: 1800, hl: "30 min" },
      { name: "Swing trade", h: 3 * 86400, hl: "3 days" },
    ];
    const SETUPS = [
      { name: "FPGA in colo", L: 1e-6, lab: "1 μs" },
      { name: "Colo server", L: 20e-6, lab: "20 μs" },
      { name: "Cloud near exchange", L: 2e-3, lab: "2 ms" },
      { name: "Retail platform", L: 0.1, lab: "100 ms" },
      { name: "Human click", L: 1.5, lab: "1.5 s" },
    ];
    let si = 0, ui = 4;
    buttons("ms-pick", STRATS.map((s) => s.name), 0, (i) => { si = i; draw(); });
    buttons("ms-setup", SETUPS.map((s) => s.name), 4, (i) => { ui = i; draw(); });
    const kept = (L, h) => Math.pow(2, -L / h);

    const draw = () => {
      const S = STRATS[si];
      const svg = $("chart-ms");
      const hh = 260, w = fit(svg, hh), narrow = w < 480;
      const pad = { l: 46, r: 14, t: 18, b: 44 };
      const iw = w - pad.l - pad.r, ih = hh - pad.t - pad.b;
      const x0 = -7, x1 = 6;
      const sx = (L) => pad.l + ((Math.log10(L) - x0) / (x1 - x0)) * iw, sy = (v) => pad.t + (1 - v) * ih;
      [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(v), y2: sy(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v * 100 + "%";
      });
      const ticks = narrow ? [[1e-6, "1 μs"], [1e-3, "1 ms"], [1, "1 s"], [86400, "1 day"]] : [[1e-6, "1 μs"], [1e-3, "1 ms"], [1, "1 s"], [60, "1 min"], [3600, "1 hr"], [86400, "1 day"]];
      ticks.forEach(([L, lab]) => {
        el("line", { x1: sx(L), x2: sx(L), y1: pad.t, y2: pad.t + ih, class: "grid" }, svg);
        el("text", { x: sx(L), y: pad.t + ih + 18, "text-anchor": "middle" }, svg).textContent = lab;
      });
      el("text", { x: pad.l + iw / 2, y: hh - 6, "text-anchor": "middle" }, svg).textContent = "Latency (log scale)";
      let d = "";
      for (let i = 0; i <= 300; i++) { const lg = x0 + (i / 300) * (x1 - x0); d += (i ? "L" : "M") + sx(10 ** lg).toFixed(1) + " " + sy(kept(10 ** lg, S.h)).toFixed(1); }
      el("path", { d, fill: "none", stroke: tone(), "stroke-width": 3, "stroke-linejoin": "round" }, svg);
      // Half-life marker
      el("line", { x1: sx(S.h), x2: sx(S.h), y1: sy(0.5), y2: pad.t + ih, stroke: tone(), "stroke-opacity": 0.5, "stroke-dasharray": "4 4" }, svg);
      SETUPS.forEach((u, i) => {
        const k = kept(u.L, S.h), on = i === ui;
        el("circle", { cx: sx(u.L), cy: sy(k), r: on ? 7 : 4.5, fill: on ? tone() : grey(), stroke: "var(--bg)", "stroke-width": 2 }, svg);
        if (on) {
          const right = sx(u.L) < pad.l + iw * 0.72;
          el("text", { x: sx(u.L) + (right ? 10 : -10), y: k > 0.85 ? sy(k) + 22 : Math.max(pad.t + 12, sy(k) - 10), "text-anchor": right ? "start" : "end", style: "font-weight:600;fill:var(--text)" }, svg).textContent = u.name + ": " + pct(k);
        }
      });

      const box = $("ms-read"); box.textContent = "";
      span(box, "Half-life of the edge: " + S.hl);
      SETUPS.forEach((u, i) => { const s = span(box, u.name + " (" + u.lab + "): " + pct(kept(u.L, S.h))); if (i === ui) s.style.fontWeight = "600"; });
      const k = kept(SETUPS[ui].L, S.h);
      let story;
      if (k > 0.98) story = "From this set-up you keep almost all of the edge: the signal fades far more slowly than your delay. Paying for more speed buys nothing here; money is better spent on research, data and sizing.";
      else if (k < 0.05) story = "From this set-up the edge is gone before your order arrives. This strategy belongs to firms with " + (si === 0 ? "FPGAs in the exchange's data centre" : "colocated servers") + "; trying to compete from here means paying the toll, not collecting it.";
      else story = "This set-up keeps " + pct(k) + " of the edge: speed matters here, and each faster set-up is worth paying for up to the value of the extra edge it keeps.";
      $("ms-story").textContent = story;
    };

    onResize("chart-ms", draw);
    H.charts(draw);
  }
})();