// Interactive for the note "Single-Manager vs Multi-Manager" (Hedge Funds · The Hedge Fund Business).
// "Run a platform": a 36-month simulation of one single manager against a platform of pods.
// Drawn at the chart's real width, so the labels stay readable on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour, frame } = H;
  if (!$("chart-mm")) return;
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

  const fit = (svg, h) => {
    const w = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    return w;
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

  // Repeatable random numbers, so the same run redraws the same when you change the theme
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = (r) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r());

  const MONTHS = 36, MU = 0.07 / 12, SIG = 0.10 / Math.sqrt(12), PAY = 0.2, FUND = 1000; // $1bn fund
  const SKILL = 0.06 / 12; // PMs differ: each new PM's expected return is drawn around MU with this spread
  const STOPS = [{ n: "No stop-loss", L: null }, { n: "10% stop", L: 0.1 }, { n: "7.5% stop", L: 0.075 }, { n: "5% stop", L: 0.05 }];
  let si = 2, seed = 7;

  const simulate = (N, rho, L) => {
    const r = rng(seed);
    const a = Math.sqrt(rho), b = Math.sqrt(1 - rho);
    const seats = Array.from({ length: N }, () => ({ v: 1, peak: 1, path: [[0, 100]], cuts: [], stint: 1, mu: MU + SKILL * normal(r) }));
    let fund = 1, single = 1, cut = 0, payouts = 0, gross = 0;
    const fundPath = [100], singlePath = [100], fundRets = [], singleRets = [];
    let yearStartFund = 1;
    for (let m = 1; m <= MONTHS; m++) {
      const zc = normal(r);
      const rets = seats.map((s) => s.mu + SIG * (a * zc + b * normal(r)));
      const sr = MU + SIG * (a * zc + b * normal(r));
      const fr = rets.reduce((s, x) => s + x, 0) / N;
      // Each seat's PM: track this year's result for their payout, and the stop-loss
      seats.forEach((s, i) => {
        s.v *= 1 + rets[i]; s.stint *= 1 + rets[i];
        s.peak = Math.max(s.peak, s.v);
        s.path.push([m, s.v * 100]);
      });
      const capPerPod = (fund * FUND) / N;
      fund *= 1 + fr; single *= 1 + sr;
      fundRets.push(fr); singleRets.push(sr);
      fundPath.push(fund * 100); singlePath.push(single * 100);
      seats.forEach((s) => {
        if (L !== null && s.v / s.peak - 1 <= -L) {
          // Stopped out: no payout for this PM; a new PM starts fresh next month
          cut++; s.cuts.push([m, s.v * 100]);
          s.v = 1; s.peak = 1; s.stint = 1; s.mu = MU + SKILL * normal(r); s.path.push(null); s.path.push([m, 100]);
        }
      });
      if (m % 12 === 0) {
        // Year end: each PM still in their seat is paid 20% of their own profit this year
        seats.forEach((s) => { payouts += PAY * Math.max(0, s.stint - 1) * capPerPod; s.stint = 1; });
        gross += (fund - yearStartFund) * FUND; yearStartFund = fund;
      }
    }
    return { seats, fundPath, singlePath, fundRets, singleRets, cut, payouts, gross, fund, single };
  };

  const vol = (xs) => {
    const m = xs.reduce((s, x) => s + x, 0) / xs.length;
    return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)) * Math.sqrt(12);
  };
  const worstDD = (path) => {
    let peak = path[0], dd = 0;
    path.forEach((v) => { peak = Math.max(peak, v); dd = Math.min(dd, v / peak - 1); });
    return dd;
  };

  const draw = () => {
    const N = parseInt($("mm-n").value, 10), rho = parseFloat($("mm-rho").value);
    $("mm-n-out").textContent = N;
    $("mm-rho-out").textContent = rho.toFixed(2);
    const L = STOPS[si].L, res = simulate(N, rho, L);

    const svg = $("chart-mm"), h = 280, w = fit(svg, h);
    const all = [...res.fundPath, ...res.singlePath];
    res.seats.forEach((s) => s.path.forEach((p) => p && all.push(p[1])));
    const lo = Math.floor(Math.min(...all) / 10) * 10, hi = Math.ceil(Math.max(...all) / 10) * 10;
    const step = hi - lo > 80 ? 20 : 10;
    const yt = []; for (let v = lo; v <= hi; v += step) yt.push(v);
    const pad = { l: 44, r: 12, t: 12, b: 30 };
    const sc = frame(svg, w, h, pad, [0, MONTHS], [lo, hi], [0, 12, 24, 36], yt, (v) => "$" + v);
    const t = tone(), g = grey();
    const line = (pts, stroke, width, op) => {
      let d = "", pen = false;
      pts.forEach((p) => {
        if (!p) { pen = false; return; }
        d += (pen ? "L" : "M") + sc.sx(p[0]).toFixed(1) + " " + sc.sy(p[1]).toFixed(1); pen = true;
      });
      el("path", { d, fill: "none", stroke, "stroke-width": width, "stroke-opacity": op, "stroke-linejoin": "round" }, svg);
    };
    // Each pod's own path, faint; a cross where a PM was stopped out
    res.seats.forEach((s) => {
      line(s.path, t, 1, Math.max(0.12, 0.5 / Math.sqrt(N)));
      s.cuts.forEach((c) => {
        const x = sc.sx(c[0]), y = sc.sy(c[1]);
        el("path", { d: "M" + (x - 3) + " " + (y - 3) + "L" + (x + 3) + " " + (y + 3) + "M" + (x + 3) + " " + (y - 3) + "L" + (x - 3) + " " + (y + 3), stroke: t, "stroke-width": 1.5, "stroke-opacity": 0.7 }, svg);
      });
    });
    line(res.singlePath.map((v, i) => [i, v]), g, 2.5, 1);
    line(res.fundPath.map((v, i) => [i, v]), t, 3.5, 1);
    el("text", { x: sc.sx(MONTHS) - 4, y: h - pad.b - 6, "text-anchor": "end" }, svg).textContent = "Months";

    const vf = vol(res.fundRets), vs = vol(res.singleRets);
    const df = worstDD(res.fundPath), ds = worstDD(res.singlePath);
    const out = $("mm-read"); out.textContent = "";
    const a1 = document.createElement("span"), a2 = document.createElement("span"), a3 = document.createElement("span"); out.append(a1, a2, a3);
    tex(a1, "\\text{Yearly swings: platform } " + (vf * 100).toFixed(1) + "\\% \\quad \\text{single } " + (vs * 100).toFixed(1) + "\\%");
    tex(a2, "\\text{Worst fall: platform } " + (df * 100).toFixed(1) + "\\% \\quad \\text{single } " + (ds * 100).toFixed(1) + "\\%");
    const share = res.gross > 0 ? (res.payouts / res.gross) * 100 : null;
    tex(a3, "\\text{PM payouts: } \\$" + Math.round(res.payouts) + "\\text{m on fund profit of } " + (res.gross < 0 ? "-\\$" : "\\$") + Math.abs(Math.round(res.gross)) + "\\text{m}" + (L !== null ? " \\quad \\text{PMs replaced: } " + res.cut : ""));

    const theory = Math.sqrt(rho + (1 - rho) / N) * 10;
    const parts = [];
    parts.push("The platform's yearly swings come out at about " + (vf * 100).toFixed(1) + "% against " + (vs * 100).toFixed(1) + "% for the single manager (the formula predicts about " + theory.toFixed(1) + "% before stop-losses).");
    if (rho >= 0.5) parts.push("With pods this alike, they're all fishing the same spot: the faint lines move together, and diversification barely helps. That's crowding.");
    else if (N >= 10) parts.push("Look at the faint lines: individual pods wander far up and down, but because they're mostly independent, the thick line stays close to a steady climb.");
    if (L !== null && res.cut > 0) parts.push(res.cut + " PM" + (res.cut === 1 ? " was" : "s were") + " stopped out and replaced (the crosses). Weaker PMs hit their stops more often, so over time the money drifts towards the better ones.");
    if (share !== null && share > 25) parts.push("PM payouts took " + Math.round(share) + "% of the fund's gross profit, more than a single 20% fee would, because winners are paid on their own books while losers pay nothing back: netting risk.");
    else if (share === null && res.payouts > 0) parts.push("The fund lost money overall, yet winning PMs were still paid $" + Math.round(res.payouts) + "m: netting risk at its starkest.");
    parts.push("Press Run again: every run is a different three years.");
    $("mm-story").textContent = parts.join(" ");
  };

  buttons("mm-stop", STOPS, (i) => { si = i; draw(); }, si);
  $("mm-again").addEventListener("click", () => { seed = Math.floor(Math.random() * 1e9); draw(); });
  ["mm-n", "mm-rho"].forEach((id) => $(id).addEventListener("input", draw));
  let last = 0;
  window.addEventListener("resize", () => {
    const wd = Math.round($("chart-mm").getBoundingClientRect().width);
    if (wd && wd !== last) { last = wd; draw(); }
  });
  H.charts(draw);
})();