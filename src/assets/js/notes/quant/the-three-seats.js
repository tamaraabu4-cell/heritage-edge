// Interactives for the note "The Three Seats" (Quant · Quant Trading Firms).
// Both charts are drawn at their real width, so the labels stay readable on a phone.
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
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const rng = (s) => () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const usd = (v) => (v < -0.5 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-GB");
  const signedUsd = (v) => (v >= 0.5 ? "+" : "") + usd(v);

  // ---------- Find the leak ----------
  if ($("chart-lk")) {
    const TICK = 12.5;
    // fills and realised spread (ticks) per venue; widening keeps 55% of fills and adds "lift" ticks per fill
    const VENUES = [
      { n: "Venue A", fills: 1500, rs: 0.45, lift: 0.2 },
      { n: "Venue B", fills: 1100, rs: 0.5, lift: 0.2 },
      { n: "Venue C", fills: 600, rs: -0.4, lift: 0.45 },
      { n: "Venue D", fills: 1000, rs: 0.275, lift: 0.2 },
    ];
    const KEEP = 0.55, MODES = ["Normal", "Widen", "Off"];
    const mode = VENUES.map(() => 0);
    const result = (v, m) => {
      if (m === 2) return { fills: 0, rs: 0 };
      if (m === 1) return { fills: Math.round(v.fills * KEEP), rs: v.rs + v.lift };
      return { fills: v.fills, rs: v.rs };
    };
    const pnl = (r) => r.fills * r.rs * TICK;

    const box = $("lk-venues");
    VENUES.forEach((v, i) => {
      const card = document.createElement("div"); card.className = "lk-venue";
      const h = document.createElement("strong"); h.textContent = v.n;
      const st = document.createElement("div"); st.className = "lk-stats";
      st.textContent = v.fills.toLocaleString("en-GB") + " fills · " + (v.rs > 0 ? "+" : "−") + Math.abs(v.rs) + " ticks";
      const opts = document.createElement("div"); opts.className = "presets ts-pick"; opts.setAttribute("aria-label", v.n + " setting");
      MODES.forEach((label, j) => {
        const b = document.createElement("button"); b.type = "button"; b.textContent = label;
        b.setAttribute("aria-pressed", j === 0 ? "true" : "false");
        b.addEventListener("click", () => { [...opts.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); mode[i] = j; draw(); });
        opts.append(b);
      });
      card.append(h, st, opts); box.append(card);
    });

    const draw = () => {
      const now = VENUES.map((v, i) => result(v, mode[i]));
      const before = VENUES.map((v) => pnl(v));
      const after = now.map(pnl);
      const totB = before.reduce((a, b) => a + b, 0), totA = after.reduce((a, b) => a + b, 0);
      const rows = VENUES.map((v, i) => ({ label: v.n, b: before[i], a: after[i] })).concat([{ label: "Whole desk", b: totB, a: totA, total: true }]);

      const svg = $("chart-lk"), w = fit(svg, 220), h = 220;
      const pad = { l: 92, r: 70, t: 10, b: 30 };
      const lo = Math.min(0, ...rows.map((r) => Math.min(r.a, r.b))), hi = Math.max(0, ...rows.map((r) => Math.max(r.a, r.b)));
      const step = 5000, x0 = Math.floor(lo / step) * step, x1 = Math.ceil(hi / step) * step;
      const sx = (x) => pad.l + ((x - x0) / (x1 - x0)) * (w - pad.l - pad.r);
      for (let x = x0; x <= x1; x += step) {
        el("line", { x1: sx(x), x2: sx(x), y1: pad.t, y2: h - pad.b, class: x === 0 ? "axis" : "grid" }, svg);
        if (w > 420 || x % 10000 === 0) el("text", { x: sx(x), y: h - pad.b + 16, "text-anchor": "middle" }, svg).textContent = x === 0 ? "0" : (x < 0 ? "−" : "") + Math.abs(x / 1000) + "k";
      }
      el("text", { x: w - 4, y: h - 2, "text-anchor": "end" }, svg).textContent = "Daily P&L ($)";
      const rowH = (h - pad.t - pad.b) / rows.length;
      rows.forEach((r, i) => {
        const yc = pad.t + rowH * (i + 0.5);
        el("text", { x: pad.l - 8, y: yc + 4, "text-anchor": "end", style: "fill:var(--text);font-weight:" + (r.total ? 700 : 600) }, svg).textContent = r.label;
        const bar = (v, y, hh, fill, op) => el("rect", { x: Math.min(sx(0), sx(v)), y, width: Math.max(1, Math.abs(sx(v) - sx(0))), height: hh, rx: 2, fill, "fill-opacity": op }, svg);
        bar(r.b, yc - 9, 6, grey(), 0.8);
        bar(r.a, yc - 2, 11, tone(), 1);
        const tx = sx(Math.max(0, r.a, r.b)) + 6;
        el("text", { x: tx, y: yc + 7, style: "fill:var(--text);font-weight:600" }, svg).textContent = signedUsd(r.a);
      });

      const fills = now.reduce((a, r) => a + r.fills, 0);
      const out = $("lk-read"); out.textContent = "";
      span(out, "Fills: " + fills.toLocaleString("en-GB") + " (was 4,200)");
      span(out, "Average realised spread: " + (fills ? (now.reduce((a, r) => a + r.fills * r.rs, 0) / fills).toFixed(2) : "0") + " ticks");
      span(out, "Desk P&L: " + signedUsd(totA) + " a day (was " + signedUsd(totB) + ")");

      const c = mode[2], goodChanged = [0, 1, 3].filter((i) => mode[i] !== 0);
      let story;
      if (c === 0 && goodChanged.length === 0) story = "This is the report as it arrived. The desk makes " + signedUsd(totB) + " a day overall, so it would be easy to miss that Venue C is losing " + usd(-before[2]) + " a day. Its fills are being picked off. Try changing Venue C.";
      else if (goodChanged.length) story = "Changing " + goodChanged.map((i) => VENUES[i].n).join(" and ") + " cost money: that flow was fine, so widening or switching off just gave business away to competitors. " + (c === 0 ? "Venue C, the real leak, is still running as normal." : "Fix only what the breakdown says is broken.");
      else if (c === 1) story = "Widening at Venue C stops most of the leak: fewer fills, but the ones you still get no longer lose money (" + signedUsd(after[2]) + " a day). You keep a presence on the venue while research works out why: faster counterparties, a stale feed, or a change in flow. Desk P&L rises to " + signedUsd(totA) + ".";
      else story = "Switching Venue C off saves " + usd(-before[2]) + " a day at once. It's the bluntest fix: you also lose the venue's good flow and any information it gives you. Widening keeps you there at a small profit while the cause is found.";
      $("lk-story").textContent = story;
    };
    onResize("chart-lk", draw);
    H.charts(draw);
  }

  // ---------- Which signals are real? ----------
  if ($("chart-fd")) {
    let seed = 3;
    const draw = () => {
      const N = parseInt($("fd-n").value, 10);
      const R = Math.min(parseInt($("fd-r").value, 10), N);
      const pw = parseInt($("fd-p").value, 10) / 100, a = parseFloat($("fd-a").value) / 100;
      $("fd-n-out").textContent = N; $("fd-r-out").textContent = R;
      $("fd-p-out").textContent = Math.round(pw * 100) + "%"; $("fd-a-out").textContent = (a * 100).toFixed(1) + "%";

      // Expected counts, and one random draw of which ideas pass
      const eTrue = R * pw, eFalse = (N - R) * a, eFdr = eTrue + eFalse > 0 ? eFalse / (eTrue + eFalse) : 0;
      const r = rng(seed), ideas = [];
      for (let i = 0; i < N; i++) { const real = i < R; ideas.push({ real, pass: r() < (real ? pw : a), k: r() }); }
      ideas.sort((x, y) => x.k - y.k); // shuffle so real ones are scattered
      const tp = ideas.filter((d) => d.real && d.pass).length, fp = ideas.filter((d) => !d.real && d.pass).length;

      const svg = $("chart-fd"), w = fit(svg, 10), cols = w < 420 ? 15 : 25;
      const rowsN = Math.ceil(N / cols), cell = Math.min(22, (w - 8) / cols), h = Math.max(120, rowsN * cell + 12);
      svg.setAttribute("viewBox", "0 0 " + w + " " + h); svg.style.height = h + "px";
      const x0 = (w - cols * cell) / 2, rad = cell * 0.28;
      ideas.forEach((d, i) => {
        const cx = x0 + (i % cols + 0.5) * cell, cy = 6 + (Math.floor(i / cols) + 0.5) * cell;
        if (d.pass) el("circle", { cx, cy, r: rad + 3.2, fill: "none", stroke: d.real ? tone() : colour("--text"), "stroke-width": 2 }, svg);
        el("circle", { cx, cy, r: rad, fill: d.real ? tone() : grey(), "fill-opacity": d.real ? 1 : 0.55 }, svg);
      });

      const out = $("fd-read"); out.textContent = "";
      span(out, "This run: " + (tp + fp) + " passed (" + tp + " real, " + fp + " noise)");
      span(out, "Expected: " + eTrue.toFixed(1) + " real passes, " + eFalse.toFixed(1) + " false ones");
      span(out, "Share of passes that are noise: " + Math.round(eFdr * 100) + "%");

      let story;
      if (R === 0) story = "With no real ideas at all, every pass is noise: about " + eFalse.toFixed(0) + " useless signals would still sail through and look validated.";
      else if (eFdr >= 0.5) story = "More than half of what passes is noise (" + Math.round(eFdr * 100) + "%). Real ideas are rare (" + R + " in " + N + "), so even a " + (a * 100).toFixed(1) + "% false-pass rate on the " + (N - R) + " useless ones adds up to more than the real finds. Testing more ideas doesn't fix this; better ideas, or stricter tests, do.";
      else if (eFdr >= 0.2) story = "About " + Math.round(eFdr * 100) + "% of passes are noise. That's why a pass is only the start: out-of-sample checks, paper trading and small initial sizes weed out the rest. Try halving the false-pass rate, or doubling the number of ideas tested without adding real ones.";
      else story = "Only about " + Math.round(eFdr * 100) + "% of passes are noise here, because real ideas are common or the test is strict. In real research, good ideas are scarce, which is what makes the base rate bite.";
      $("fd-story").textContent = story;
    };
    ["fd-n", "fd-r", "fd-p", "fd-a"].forEach((id) => $(id).addEventListener("input", draw));
    $("fd-again").addEventListener("click", () => { seed = (seed * 48271 + 13) % 2147483647; draw(); });
    onResize("chart-fd", draw);
    H.charts(draw);
  }
})();