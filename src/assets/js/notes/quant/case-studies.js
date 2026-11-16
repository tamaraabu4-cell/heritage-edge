// Interactives for the note "Case Studies" (Quant · Quant Trading Firms).
// "45 minutes" is an illustration with steady build-up; drawn at its real width so labels stay readable on a phone.
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
  };
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };

  // ---------- Ten years of XTX ----------
  if ($("xt-card")) {
    const STEPS = [
      { b: "2009–15", h: "Building the desk inside GSA Capital", p: "Alex Gerko heads FX trading at GSA Capital, a London quant hedge fund, and spends five years building its currency market making business on models and code.", share: null },
      { b: "2015", h: "The spin-out", p: "In mid-2015 the business leaves GSA as XTX Markets, with Gerko and Zar Amrolia, formerly of Deutsche Bank's fixed income and currencies business, as co-chief executives. It makes markets in shares, futures, commodities and, fastest-growing, spot FX.", share: null },
      { b: "2016", h: "First non-bank in the FX top ten", p: "In Euromoney's 2016 FX survey, XTX ranks ninth with about 3.9% of volume: the first firm that isn't a bank to make the top ten, overtaking Deutsche Bank in spot trading.", share: 3.87 },
      { b: "2018", h: "Third in the world", p: "XTX is third in global FX with about 7.4% of volume, and a major liquidity provider in European shares, with about 11.5% of that market.", share: 7.36 },
      { b: "2019", h: "Number one in spot FX", p: "Surveys by Euromoney and Rosenblatt put XTX as the largest spot FX liquidity provider in the world, and the largest liquidity provider in European shares.", share: null },
      { b: "2025", h: "A record year at scale", p: "XTX's UK companies report about £3.93bn of combined net revenue and £1.71bn of profit for 2025, with only a few hundred employees trading around $250bn a day. It is building data centres in Finland for its research.", share: null },
    ];
    const show = (i) => {
      const s = STEPS[i], card = $("xt-card"); card.textContent = "";
      const h = document.createElement("h4"); h.textContent = s.h;
      const p = document.createElement("p"); p.textContent = s.p;
      card.append(h, p);
      if (s.share !== null) {
        const m = document.createElement("div"); m.className = "xt-meter";
        const lab = document.createElement("span"); lab.textContent = "Share of FX volume";
        const bar = document.createElement("div"); bar.className = "bar";
        const fill = document.createElement("i"); fill.style.width = (s.share / 10) * 100 + "%"; bar.append(fill);
        const val = document.createElement("strong"); val.textContent = s.share.toFixed(1) + "%";
        m.append(lab, bar, val); card.append(m);
      }
    };
    choice("xt-pick", STEPS.map((s) => s.b), 0, show);
    show(0);
  }

  // ---------- 45 minutes ----------
  if ($("chart-kn")) {
    const T = 45, GROSS = 6.65, LOSS = 460, SHARES = 397;
    const CTL = [
      { b: "What happened", stop: T, cap: Infinity },
      { b: "Act on the 97 warnings", stop: 0, cap: Infinity },
      { b: "Kill switch at 5 minutes", stop: 5, cap: Infinity },
      { b: "Gross limit of $1bn", stop: T, cap: 1 },
    ];
    let ctl = 0;
    const draw = () => {
      const t = parseInt($("kn-t").value, 10);
      $("kn-t-out").textContent = t;
      const c = CTL[ctl];
      const grossAt = (m) => Math.min(c.cap, GROSS * (Math.min(m, c.stop) / T));
      const lossAt = (m) => LOSS * (grossAt(m) / GROSS); // loss assumed proportional to the position built
      const sharesAt = (m) => SHARES * (grossAt(m) / GROSS);

      const svg = $("chart-kn"), w = fit(svg, 280), h = 280;
      const pad = { l: 50, r: 50, t: 20, b: 36 };
      const sx = (m) => pad.l + (m / T) * (w - pad.l - pad.r);
      const syG = (g) => pad.t + (1 - g / 7) * (h - pad.t - pad.b);
      const syL = (l) => pad.t + (1 - l / 500) * (h - pad.t - pad.b);
      [0, 100, 200, 300, 400, 500].forEach((v) => {
        el("line", { x1: pad.l, x2: w - pad.r, y1: syL(v), y2: syL(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 6, y: syL(v) + 4, "text-anchor": "end", style: "fill:" + tone() }, svg).textContent = "$" + v + "m";
      });
      [0, 1, 2, 3, 4, 5, 6, 7].forEach((g) => { el("text", { x: w - pad.r + 6, y: syG(g) + 4 }, svg).textContent = "$" + g + "bn"; });
      (w < 420 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45]).forEach((m) => {
        el("text", { x: sx(m), y: h - pad.b + 16, "text-anchor": "middle" }, svg).textContent = m;
      });
      el("text", { x: (w) / 2, y: h - 4, "text-anchor": "middle" }, svg).textContent = "Minutes after the open";
      el("text", { x: 4, y: 12, style: "fill:" + tone() }, svg).textContent = "Loss";
      el("text", { x: w - 4, y: 12, "text-anchor": "end" }, svg).textContent = "Position";
      // full "what happened" lines, faint, for comparison
      if (ctl !== 0) {
        el("line", { x1: sx(0), y1: syL(0), x2: sx(T), y2: syL(LOSS), stroke: tone(), "stroke-opacity": 0.25, "stroke-dasharray": "4 4", "stroke-width": 2 }, svg);
      }
      let dG = "", dL = "";
      for (let m = 0; m <= t; m += 0.5) {
        dG += (m ? "L" : "M") + sx(m).toFixed(1) + " " + syG(grossAt(m)).toFixed(1);
        dL += (m ? "L" : "M") + sx(m).toFixed(1) + " " + syL(lossAt(m)).toFixed(1);
      }
      el("path", { d: dG + "L" + sx(t).toFixed(1) + " " + syG(0).toFixed(1) + "L" + sx(0).toFixed(1) + " " + syG(0).toFixed(1) + "Z", fill: grey(), "fill-opacity": 0.28, stroke: "none" }, svg);
      el("path", { d: dG, fill: "none", stroke: grey(), "stroke-width": 1.4, "stroke-dasharray": "3 3" }, svg);
      el("path", { d: dL, fill: "none", stroke: tone(), "stroke-width": 2.8 }, svg);
      el("circle", { cx: sx(t), cy: syL(lossAt(t)), r: 5, fill: tone() }, svg);
      if (c.stop < T && c.stop <= t) el("line", { x1: sx(c.stop), x2: sx(c.stop), y1: pad.t, y2: h - pad.b, stroke: colour("--text"), "stroke-dasharray": "2 3" }, svg);

      const out = $("kn-read"); out.textContent = "";
      span(out, "Shares traded: about " + Math.round(sharesAt(t)) + "m");
      span(out, "Gross position: $" + grossAt(t).toFixed(2) + "bn");
      span(out, "Estimated loss: $" + Math.round(lossAt(t)) + "m");

      let story;
      if (ctl === 0) story = t < T ? "At " + t + " minutes, Knight's system has already built a $" + grossAt(t).toFixed(1) + "bn position, losing roughly $10m a minute. Nobody has stopped it yet." : "45 minutes in, the system is finally stopped: over 4 million executions, more than 397 million shares, about $6.65bn of positions and a loss of more than $460m. Now try the controls.";
      else if (ctl === 1) story = "The 97 automated emails before the open flagged the problem. If someone had acted on them and held the release, no bad orders would have gone out at all. Alerts only help if they force a decision.";
      else if (ctl === 2) story = "A kill switch pulled after five minutes stops the build-up at about $" + grossAt(T).toFixed(2) + "bn, with an estimated loss of about $" + Math.round(lossAt(T)) + "m instead of $460m. Still painful, but survivable.";
      else story = "A pre-trade limit on gross position (Inside a Trading Desk) caps the damage automatically: orders stop once positions reach $1bn, about seven minutes in, for an estimated loss of about $" + Math.round(lossAt(T)) + "m. No human has to notice anything.";
      $("kn-story").textContent = story;
    };
    choice("kn-ctl", CTL.map((c) => c.b), 0, (i) => { ctl = i; draw(); });
    $("kn-t").addEventListener("input", draw);
    onResize("chart-kn", draw);
    H.charts(draw);
  }
})();