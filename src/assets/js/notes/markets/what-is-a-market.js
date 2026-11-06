// Charts for the note "What Is a Market?" (Markets · What Markets Are).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, frame, curve, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Who meets who ----------
  if (has("chart-meet")) {
    const draw = () => {
      const svg = $("chart-meet");
      svg.textContent = "";
      const t = tone(), g = grey(), c = card();

      const box = (x, y, w, h, stroke, sw, title, sub, titleFill) => {
        el("rect", { x, y, width: w, height: h, rx: 10, fill: c, stroke, "stroke-width": sw }, svg);
        const ta = { x: x + w / 2, y: y + h / 2 - 4, "text-anchor": "middle" };
        if (titleFill) ta.fill = titleFill;
        el("text", ta, svg).textContent = title;
        el("text", { x: x + w / 2, y: y + h / 2 + 14, "text-anchor": "middle" }, svg).textContent = sub;
      };

      // Money: savers -> firms (over the top)
      el("path", { d: "M105 78 C 105 20, 535 20, 535 78", fill: "none", stroke: t, "stroke-width": 2.5 }, svg);
      el("polygon", { points: "529,66 541,66 535,78", fill: t }, svg);
      el("text", { x: 320, y: 22, "text-anchor": "middle", fill: t }, svg).textContent = "money →";

      // Shares and bonds: firms -> savers (underneath)
      el("path", { d: "M535 142 C 535 200, 105 200, 105 142", fill: "none", stroke: g, "stroke-width": 2.5 }, svg);
      el("polygon", { points: "99,152 111,152 105,140", fill: g }, svg);
      el("text", { x: 320, y: 212, "text-anchor": "middle" }, svg).textContent = "← shares and bonds";

      box(20, 80, 170, 60, g, 1.5, "Savers and investors", "have spare money");
      box(245, 70, 150, 80, t, 2.5, "The market", "where they meet", t);
      box(450, 80, 170, 60, g, 1.5, "Firms and governments", "need money");
    };
    H.charts(draw);
  }

  // ---------- Supply and demand: match tickets ----------
  // Chart units: price P in £ (0–140), quantity Q in tickets (0–1000).
  // Buyers line:  P = 10d − Q/10   (d = 11 at the start → P = 110 − Q/10)
  // Sellers line: P = 10s + Q/10   (s = 1 at the start  → P = 10 + Q/10)
  if (has("chart-sd")) {
    const W = 640, Ht = 340, pad = { l: 56, r: 92, t: 14, b: 30 }, PMAX = 140;
    const START = { d: 11, s: 1 };
    let cur = { ...START }, target = { ...START }, prev = null, raf = 0;

    const clampD = (v) => Math.max(7, Math.min(15, v));
    const clampS = (v) => Math.max(-3, Math.min(5, v));
    const eq = (st) => ({ q: (st.d - st.s) * 50, p: (st.d + st.s) * 5 });
    const dP = (d) => (q) => 10 * d - q / 10;
    const sP = (s) => (q) => 10 * s + q / 10;
    const dRange = (d) => [Math.max(0, 100 * d - 1400), Math.min(1000, 100 * d)];
    const sRange = (s) => [Math.max(0, -100 * s), Math.min(1000, 1400 - 100 * s)];

    const draw = (final) => {
      const svg = $("chart-sd");
      const s = frame(svg, W, Ht, pad, [0, 1000], [0, PMAX],
        [0, 200, 400, 600, 800, 1000], [0, 20, 40, 60, 80, 100, 120, 140], (y) => "£" + y);
      const t = tone(), g = grey();

      // Where the market was before the last piece of news
      if (prev) {
        curve(svg, s, dP(prev.d), dRange(prev.d), PMAX, t, 1.5, "4 5");
        curve(svg, s, sP(prev.s), sRange(prev.s), PMAX, g, 1.5, "4 5");
      }

      // Guides from the crossing to the axes
      const e = eq(cur);
      el("line", { x1: s.sx(0), y1: s.sy(e.p), x2: s.sx(e.q), y2: s.sy(e.p), stroke: g, "stroke-width": 1, "stroke-dasharray": "3 4" }, svg);
      el("line", { x1: s.sx(e.q), y1: s.sy(e.p), x2: s.sx(e.q), y2: s.sy(0), stroke: g, "stroke-width": 1, "stroke-dasharray": "3 4" }, svg);

      // The two lines
      curve(svg, s, sP(cur.s), sRange(cur.s), PMAX, g, 3);
      curve(svg, s, dP(cur.d), dRange(cur.d), PMAX, t, 3);

      // Line labels at their right-hand ends
      const dEnd = dRange(cur.d)[1], sEnd = sRange(cur.s)[1];
      el("text", { x: s.sx(dEnd) + 8, y: Math.min(s.sy(dP(cur.d)(dEnd)) + 4, s.sy(0) - 8), fill: t }, svg).textContent = "Buyers";
      el("text", { x: s.sx(sEnd) + 8, y: Math.max(s.sy(sP(cur.s)(sEnd)) + 4, pad.t + 12) }, svg).textContent = "Sellers";

      // The crossing: the market price
      el("circle", { cx: s.sx(e.q), cy: s.sy(e.p), r: 7, fill: t, stroke: card(), "stroke-width": 2 }, svg);
      el("text", { x: s.sx(e.q) + 12, y: s.sy(e.p) - 10, fill: t }, svg).textContent = "£" + Math.round(e.p);
      el("text", { x: W - pad.r, y: Ht - 4, "text-anchor": "end" }, svg).textContent = "tickets traded";

      // Readout (skipped mid-animation so the maths isn't re-typeset every frame)
      if (final !== false) {
        const out = $("sd-read"); out.textContent = "";
        const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
        tex(a, "\\text{Market price} = \\text{£}" + Math.round(e.p));
        tex(b, "\\text{Tickets traded} = " + Math.round(e.q));
      }
    };

    const animateTo = (next) => {
      const from = { ...cur }, t0 = performance.now();
      target = { ...next };
      cancelAnimationFrame(raf);
      const step = (now) => {
        const k = reduced ? 1 : Math.min(1, (now - t0) / 450), ease = 1 - Math.pow(1 - k, 3);
        cur = { d: from.d + (target.d - from.d) * ease, s: from.s + (target.s - from.s) * ease };
        if (k < 1) { draw(false); raf = requestAnimationFrame(step); }
        else { cur = { ...target }; draw(); }
      };
      raf = requestAnimationFrame(step);
    };

    const stories = {
      match: "Good news: a big match is announced. More fans want tickets at every price, so the buyers line shifts right and the crossing moves up.",
      injury: "Bad news: the star player is injured. Fewer fans want tickets at every price, so the buyers line shifts left and the crossing moves down.",
      release: "The club releases extra tickets. More are for sale at every price, so the sellers line shifts right and the crossing moves down.",
      keep: "Season-ticket holders decide to go themselves. Fewer tickets are for sale at every price, so the sellers line shifts left and the crossing moves up."
    };

    document.querySelectorAll("[data-news]").forEach((btn) => btn.addEventListener("click", () => {
      const next = { d: clampD(target.d + parseInt(btn.dataset.d, 10)), s: clampS(target.s + parseInt(btn.dataset.s, 10)) };
      const story = $("sd-story");
      if (next.d === target.d && next.s === target.s) {
        story.textContent = "That line has moved as far as this chart allows. Try another piece of news or press Reset.";
        return;
      }
      const oldP = Math.round(eq(target).p), newP = Math.round(eq(next).p);
      prev = { ...target };
      story.textContent = stories[btn.dataset.news] + " Price: £" + oldP + " → £" + newP + ".";
      animateTo(next);
    }));

    $("sd-reset").addEventListener("click", () => {
      prev = null;
      $("sd-story").textContent = "Back to the start. Nobody sets the price: it sits wherever the two lines cross.";
      animateTo(START);
    });

    H.charts(draw);
  }
})();