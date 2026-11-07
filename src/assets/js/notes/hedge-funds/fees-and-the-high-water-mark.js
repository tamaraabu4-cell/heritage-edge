// Interactives for the note "Fees and the High-Water Mark" (Hedge Funds · The Hedge Fund Business).
// Uses the helpers note.js puts on window.HubNote. Charts are drawn at their real width,
// so the labels stay readable on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour, frame } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

  const fit = (svg, h) => {
    const w = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    return w;
  };
  const onResize = (id, draw) => {
    let last = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($(id).getBoundingClientRect().width);
      if (w && w !== last) { last = w; draw(); }
    });
  };
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
  const m1 = (v) => (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(1).replace(/\.0$/, "") + "m";
  const mTex = (v) => (v < 0 ? "-\\$" : "\\$") + Math.abs(v).toFixed(1).replace(/\.0$/, "") + "\\text{m}";

  // ---------- Who gets paid? ----------
  if (has("chart-fees")) {
    const PATHS = [
      { n: "Steady 10%", r: [10, 10, 10, 10, 10] },
      { n: "Rollercoaster", r: [25, -20, 25, -20, 25] },
      { n: "Crash and recover", r: [15, -30, 20, 20, 15] },
    ];
    const TERMS = [{ n: "2 and 20", m: 2, p: 20 }, { n: "Today's average", m: 1.4, p: 17 }, { n: "Jones: 0 and 20", m: 0, p: 20 }];
    const HWMS = [{ n: "With", on: true }, { n: "Without", on: false }];
    const HTYPES = [{ n: "Hard", hard: true }, { n: "Soft", hard: false }];
    let pi = 1, ti = 0, wi = 0, yi = 0;

    // Run the fund for five years; returns each year's numbers and totals ($ millions)
    const run = (path, terms, hwmOn, hurdle, hard) => {
      let V = 100, mark = 100;
      const years = path.map((g) => {
        const V0 = V, gross = V0 * (g / 100);
        const mFee = V0 * (terms.m / 100);
        const Vpre = V0 + gross - mFee;
        const base = hwmOn ? mark : V0, gate = Math.max(base, V0 * (1 + hurdle / 100));
        let pFee = 0;
        if (hard) pFee = (terms.p / 100) * Math.max(0, Vpre - gate);
        else if (Vpre > gate) pFee = (terms.p / 100) * (Vpre - base);
        V = Vpre - pFee;
        if (hwmOn) mark = Math.max(mark, V);
        return { gross, fees: mFee + pFee, net: V - V0 };
      });
      const sum = (k) => years.reduce((t, y) => t + y[k], 0);
      return { years, gross: sum("gross"), fees: sum("fees"), end: V };
    };

    const draw = () => {
      const h = parseInt($("fee-h").value, 10);
      $("fee-h-out").textContent = h + "%";
      const P = PATHS[pi].r, T = TERMS[ti], on = HWMS[wi].on, hard = HTYPES[yi].hard;
      const res = run(P, T, on, h, hard);
      const vals = res.years.flatMap((y) => [y.net, y.fees]);
      const top = Math.max(5, ...vals), bot = Math.min(0, ...vals);
      const step = top - bot > 40 ? 10 : 5;
      const yMax = Math.ceil(top / step) * step, yMin = Math.floor(bot / step) * step;
      const yt = []; for (let v = yMin; v <= yMax; v += step) yt.push(v);

      const svg = $("chart-fees"), H2 = 280, w = fit(svg, H2);
      const pad = { l: 46, r: 12, t: 14, b: 34 };
      const sc = frame(svg, w, H2, pad, [0.5, 5.5], [yMin, yMax], [], yt, (v) => (v < 0 ? "−$" + -v : v === 0 ? "0" : "$" + v) + (v === 0 ? "" : "m"));
      const t = tone(), g = grey();
      const slot = sc.sx(1.5) - sc.sx(0.5), bw = Math.min(34, slot * 0.3);
      res.years.forEach((y, i) => {
        const cx = sc.sx(i + 1);
        const bar = (x, v, fill, op) => {
          const y0 = sc.sy(0), y1 = sc.sy(v);
          el("rect", { x, y: Math.min(y0, y1), width: bw, height: Math.max(1, Math.abs(y1 - y0)), rx: 3, fill, "fill-opacity": op }, svg);
        };
        bar(cx - bw - 2, y.net, t, 1);
        bar(cx + 2, y.fees, g, 0.85);
        el("text", { x: cx, y: H2 - pad.b + 18, "text-anchor": "middle" }, svg).textContent = (w < 480 ? "Y" : "Year ") + (i + 1);
        el("text", { x: cx, y: H2 - pad.b + 30, "text-anchor": "middle", style: "font-size:11px" }, svg).textContent = (P[i] > 0 ? "+" : "") + P[i] + "%";
      });

      const share = res.gross > 0 ? (res.fees / res.gross) * 100 : null;
      const out = $("fee-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Profit before fees: } " + mTex(res.gross) + " \\quad \\text{Fees: } " + mTex(res.fees) + (share !== null ? "\\ (" + Math.round(share) + "\\%\\text{ of it})" : ""));
      tex(b, "\\text{Investor's } \\$100\\text{m is now } " + mTex(res.end));

      // Compare with the other choices, to say what each rule is worth
      const flip = run(P, T, !on, h, hard);
      const noHurdle = run(P, T, on, 0, hard);
      const parts = [];
      if (share !== null) parts.push("Over five years the manager takes " + Math.round(share) + "% of the profit the fund made before fees.");
      else parts.push("The fund lost money over the five years, but the investor still paid " + m1(res.fees) + " in fees" + (T.m > 0 ? ": the management fee is charged whatever happens." : ", from performance fees in the good years."));
      const d = Math.abs(flip.fees - res.fees);
      if (on && d > 0.05) parts.push("The high-water mark saved the investor " + m1(d) + ": without it, the manager would be paid again for winning back the losses.");
      else if (!on && d > 0.05) parts.push("Without a high-water mark the investor pays " + m1(d) + " more, because the manager is paid again every time the fund climbs back to where it was.");
      else if (on) parts.push("The fund never fell, so the high-water mark never mattered here. Try the rollercoaster.");
      if (h > 0) {
        const saved = noHurdle.fees - res.fees;
        parts.push(hard
          ? "The " + h + "% hard hurdle saved " + m1(saved) + ": no fee on the first " + h + "% each year."
          : saved < 0.05
            ? "The " + h + "% soft hurdle saved nothing: every year the fund cleared it, the fee was charged on the whole gain anyway."
            : "The " + h + "% soft hurdle saved " + m1(saved) + ", only in the years the fund made something but fell short of it.");
      }
      $("fee-story").textContent = parts.join(" ");
    };
    buttons("fee-path", PATHS, (i) => { pi = i; draw(); }, pi);
    buttons("fee-terms", TERMS, (i) => { ti = i; draw(); }, ti);
    buttons("fee-hwm", HWMS, (i) => { wi = i; draw(); }, wi);
    buttons("fee-htype", HTYPES, (i) => { yi = i; draw(); }, yi);
    $("fee-h").addEventListener("input", draw);
    onResize("chart-fees", draw);
    H.charts(draw);
  }

  // ---------- When does a fund start making money? ----------
  if (has("chart-be")) {
    const VAR = 0.002; // extra costs: $2m a year per $1bn managed
    const draw = () => {
      const F = parseFloat($("be-c").value), f = parseFloat($("be-f").value) / 100;
      $("be-c-out").textContent = "$" + F + "m";
      $("be-f-out").textContent = (f * 100).toFixed(2).replace(/0$/, "").replace(/\.0$/, "") + "%";
      const A = 2000; // chart runs to $2bn ($ millions)
      const rev = (a) => f * a, cost = (a) => F + VAR * a;
      const be = f > VAR ? F / (f - VAR) : Infinity;
      const yMax = H.niceMax(Math.max(rev(A), cost(A)) * 1.05);
      const yt = []; for (let v = 0; v <= yMax; v += yMax / 4) yt.push(v);
      const svg = $("chart-be"), H2 = 260, w = fit(svg, H2);
      const pad = { l: 46, r: 14, t: 14, b: 30 };
      const sc = frame(svg, w, H2, pad, [0, A], [0, yMax], [], yt, (v) => "$" + Math.round(v) + "m");
      [0, 500, 1000, 1500, 2000].forEach((x) => {
        if (w < 480 && (x === 500 || x === 1500)) return;
        el("text", { x: sc.sx(x), y: H2 - pad.b + 18, "text-anchor": "middle" }, svg).textContent = x === 0 ? "0" : x >= 1000 ? "$" + x / 1000 + "bn" : "$" + x + "m";
      });
      const t = tone(), g = grey();
      // Profit area between the lines, past breakeven
      if (be < A) {
        el("path", { d: "M" + sc.sx(be) + " " + sc.sy(rev(be)) + "L" + sc.sx(A) + " " + sc.sy(rev(A)) + "L" + sc.sx(A) + " " + sc.sy(cost(A)) + "Z", fill: t, "fill-opacity": 0.14 }, svg);
      }
      el("line", { x1: sc.sx(0), y1: sc.sy(cost(0)), x2: sc.sx(A), y2: sc.sy(cost(A)), stroke: g, "stroke-width": 2.5 }, svg);
      el("line", { x1: sc.sx(0), y1: sc.sy(0), x2: sc.sx(A), y2: sc.sy(rev(A)), stroke: t, "stroke-width": 3 }, svg);
      if (be < A) {
        const bx = sc.sx(be);
        el("line", { x1: bx, x2: bx, y1: pad.t, y2: H2 - pad.b, stroke: t, "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
        el("circle", { cx: bx, cy: sc.sy(rev(be)), r: 5, fill: t }, svg);
        el("text", { x: bx + (bx > w - 120 ? -8 : 8), y: pad.t + 12, "text-anchor": bx > w - 120 ? "end" : "start", style: "fill:" + t + ";font-weight:600" }, svg).textContent = "Breakeven " + (be >= 1000 ? "$" + (be / 1000).toFixed(2).replace(/0$/, "") + "bn" : "$" + Math.round(be) + "m");
      }
      const p1 = rev(1000) - cost(1000), p2 = rev(200) - cost(200);
      const out = $("be-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Breakeven: } " + (be < 1e9 ? (be >= 1000 ? "\\$" + (be / 1000).toFixed(2) + "\\text{bn}" : "\\$" + Math.round(be) + "\\text{m}") : "\\text{never}"));
      tex(b, "\\text{Profit at } \\$200\\text{m: } " + mTex(p2) + " \\quad \\text{at } \\$1\\text{bn: } " + mTex(p1));
      let story;
      if (be >= A) story = "At this fee and cost level the fund needs more than $2 billion before the management fee covers its costs. Until then the founders are paying to run it, and living on hope of performance fees. That's why low-fee launches need a big anchor investor.";
      else story = "Below " + (be >= 1000 ? "$" + (be / 1000).toFixed(1) + "bn" : "$" + Math.round(be) + "m") + " the founders are paying to run the fund. Past it, almost every extra dollar of fee is profit: growing from $200m to $1bn multiplies the fee by five, but the costs barely move. That's operating leverage, and it's why investors worry that big funds care more about size than returns.";
      $("be-story").textContent = story;
    };
    ["be-c", "be-f"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-be", draw);
    H.charts(draw);
  }
})();