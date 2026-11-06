// Charts for the note "A Tour of the Aisles" (Markets · What Markets Are).
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

  // ---------- Flip cards ----------
  document.querySelectorAll(".flip").forEach((b) => b.addEventListener("click", () => {
    b.classList.toggle("on");
    b.setAttribute("aria-pressed", b.classList.contains("on") ? "true" : "false");
  }));

  // ---------- How big is each aisle? ----------
  // Average daily trading, trillions of US dollars (rough; see the note for sources).
  if (has("chart-size")) {
    const data = [
      { n: "FX (currencies)", v: 9.6 },
      { n: "US government bonds", v: 1.05 },
      { n: "Shares (every exchange)", v: 0.72 },
      { n: "Gold", v: 0.36 }
    ];
    const draw = () => {
      const svg = $("chart-size");
      svg.textContent = "";
      const L = 190, R = 520, top = 18, rowH = 50, barH = 26, t = tone();
      const sx = (v) => L + (v / 10) * (R - L);
      [0, 2.5, 5, 7.5, 10].forEach((v) => {
        el("line", { x1: sx(v), x2: sx(v), y1: top - 6, y2: top + rowH * data.length - 12, class: "grid" }, svg);
        el("text", { x: sx(v), y: top + rowH * data.length + 6, "text-anchor": "middle" }, svg).textContent = "$" + v + "tn";
      });
      data.forEach((d, i) => {
        const y = top + i * rowH;
        el("text", { x: L - 12, y: y + barH / 2 + 5, "text-anchor": "end" }, svg).textContent = d.n;
        el("rect", { x: L, y, width: Math.max(3, sx(d.v) - L), height: barH, rx: 4, fill: t }, svg);
        el("text", { x: sx(d.v) + 8, y: y + barH / 2 + 5, fill: t }, svg).textContent = "$" + d.v + "tn a day";
      });
    };
    H.charts(draw);
  }

  // ---------- The risk ladder ----------
  if (has("chart-ladder")) {
    const A = [
      { n: "Cash", v: 0, pay: "Pays a little interest and almost never moves. Calm, but inflation slowly eats it." },
      { n: "Government bonds", v: 6, pay: "Pays steady interest. Prices wobble when interest rates change." },
      { n: "FX (major pairs)", v: 8, pay: "Moves on interest rates and news about each country. Can pay the gap in interest rates between the two currencies." },
      { n: "Gold", v: 15, pay: "Pays nothing. People buy it to hold its value, especially when they're scared." },
      { n: "Shares (whole market)", v: 17, pay: "Over long periods has paid more than bonds or cash. That extra is the reward for the bumps." },
      { n: "Oil", v: 35, pay: "Pays nothing. Swings hard on wars, supply cuts and recessions, with no reliable extra reward." },
      { n: "Crypto (bitcoin)", v: 60, pay: "Pays nothing. Huge swings both ways. Bumpy without any promised reward." }
    ];
    let sel = 4, seed = 7;

    // Same seed for every asset, so only the size of the swings changes.
    const rng = (s) => () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const path = (vol) => {
      const r = rng(seed), N = 252, sd = vol / 100 / Math.sqrt(N), out = [100];
      let p = 100;
      for (let i = 0; i < N; i++) {
        const z = Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
        p *= Math.exp(sd * z - (sd * sd) / 2);
        out.push(p);
      }
      return out;
    };

    const ladder = $("ladder");
    A.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = a.n;
      b.addEventListener("click", () => { sel = i; draw(); });
      ladder.appendChild(b);
    });

    const draw = () => {
      [...ladder.children].forEach((b, i) => b.setAttribute("aria-pressed", i === sel ? "true" : "false"));
      const a = A[sel], svg = $("chart-ladder"), W = 640, Ht = 300, pad = { l: 56, r: 70, t: 14, b: 30 };
      const s = frame(svg, W, Ht, pad, [0, 252], [20, 220], [0, 63, 126, 189, 252], [20, 60, 100, 140, 180, 220], (y) => "£" + y);
      const t = tone(), g = grey(), clip = (p) => Math.max(20, Math.min(220, p));
      const lo = 100 * (1 - a.v / 100), hi = 100 * (1 + a.v / 100);
      if (a.v) el("rect", { x: s.sx(0), y: s.sy(hi), width: s.sx(252) - s.sx(0), height: s.sy(lo) - s.sy(hi), fill: toneBg(), opacity: 0.8 }, svg);
      el("line", { x1: s.sx(0), x2: s.sx(252), y1: s.sy(100), y2: s.sy(100), stroke: g, "stroke-width": 1.2, "stroke-dasharray": "4 5" }, svg);
      const p = path(a.v);
      let d = "";
      p.forEach((v, i) => { d += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(clip(v)).toFixed(1); });
      el("path", { d, fill: "none", stroke: t, "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
      const end = p[p.length - 1];
      el("circle", { cx: s.sx(252), cy: s.sy(clip(end)), r: 5, fill: t, stroke: card(), "stroke-width": 2 }, svg);
      el("text", { x: s.sx(252) + 8, y: s.sy(clip(end)) + 4, fill: t }, svg).textContent = "£" + Math.round(end);
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "trading days";

      const out = $("ladder-read"); out.textContent = "";
      const x = document.createElement("span"), y = document.createElement("span"); out.append(x, y);
      tex(x, a.v ? "\\text{Typical swing in a year} \\approx \\pm " + a.v + "\\%" : "\\text{Typical swing in a year} \\approx 0\\%");
      tex(y, a.v ? "\\text{Most years: } \\text{£}" + Math.round(lo) + " \\text{ to } \\text{£}" + Math.round(hi) : "\\text{Most years: about } \\text{£}100");
      $("ladder-pay").textContent = a.pay + (end > 220 || end < 20 ? " This year went off the chart: it ended at £" + Math.round(end) + "." : "");
    };

    $("ladder-new").addEventListener("click", () => { seed = Math.floor(Math.random() * 1e6); draw(); });
    H.charts(draw);
  }
})();