// Interactives for the note "How a Rate Change Travels" (Macro · Central Banks and Rates).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour, frame } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const fmt = (v, d = 1) => {
    const x = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    return (Object.is(x, -0) ? 0 : x).toString();
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
  const press = (boxId, i) => [...$(boxId).children].forEach((c, k) => c.setAttribute("aria-pressed", k === i ? "true" : "false"));
  const onResize = (id, draw) => {
    let lastW = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($(id).getBoundingClientRect().width);
      if (w && w !== lastW) { lastW = w; draw(); }
    });
  };

  // ---------- Follow a rate rise ----------
  if (has("chart-ripple")) {
    const LANES = ["Markets", "Banks", "Homes and firms", "Jobs and prices"];
    // x positions on a stretched time line: 0 = decision day, 6 = two years
    const TICKS = ["Day 1", "Weeks", "Months", "6 months", "1 year", "1½ yrs", "2 yrs"];
    const STAGES = [
      { n: "Same day", at: 0, lane: 0,
        title: "Decision day: markets move in minutes",
        uk: "The Bank of England raises Bank Rate from 4% to 4.25%. Within seconds SONIA futures, two-year gilt yields and the pound adjust. If the rise was fully expected, they barely move, because it was already priced in (How Central Banks Decide).",
        ng: "In Nigeria the money market moves first: treasury bill and OMO rates, and the overnight rate within the corridor. The naira can move too, as investors compare naira yields with dollar ones." },
      { n: "Weeks", at: 1, lane: 1,
        title: "Banks reprice their products",
        uk: "Tracker mortgages and standard variable rates go up from the next month. New fixed-rate deals were priced off swap rates, so they often moved before the decision. Savings rates rise too, usually more slowly and by less.",
        ng: "Banks reprice loans to companies and their deposit rates. With the cash reserve requirement at about 45%, banks have less to lend and pass rate changes on quickly to the firms they do lend to." },
      { n: "Months", at: 2, lane: 2,
        title: "Asset prices and credit adjust",
        uk: "House buyers can borrow less for the same monthly payment, so offers and mortgage approvals fall. Share prices of rate-sensitive companies drop. Banks tighten who they'll lend to. A stronger pound makes imports cheaper.",
        ng: "Higher yields on government bills pull money out of shares on the NGX and into fixed income. Firms that rely on bank credit cut back first. A firmer naira is the fastest route to lower prices, because so much is imported." },
      { n: "6–12 months", at: 4, lane: 2,
        title: "Households and firms change what they do",
        uk: "Each month, people coming off cheap fixed deals refix at higher rates and cut other spending. Companies delay hiring and investment because borrowing costs more and demand looks weaker.",
        ng: "Because so few households have mortgages, the main effect runs through firms (loans, working capital) and through the exchange rate, not through home loans." },
      { n: "12–18 months", at: 5, lane: 3,
        title: "The jobs market cools",
        uk: "Fewer vacancies, slower hiring, unemployment edging up. With less competition for workers, pay rises slow, and that's what finally cools inflation in services.",
        ng: "Official unemployment data are infrequent, so analysts watch PMIs, bank lending and company results instead." },
      { n: "18–24 months", at: 6, lane: 3,
        title: "Inflation falls, maybe too far",
        uk: "Inflation comes down towards 2%. But the decision that caused it was taken two years earlier, and the bank has kept making decisions since. If it kept raising while it waited, it may have done too much, and the economy slows more than it needed to.",
        ng: "The same lag applies, but a sudden fall in the naira can undo months of tightening in weeks, so the CBN watches the currency as closely as inflation." },
    ];
    let si = 0;
    const draw = () => {
      const svg = $("chart-ripple");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), narrow = W < 480;
      const laneH = narrow ? 34 : 40, top = 22, left = narrow ? 70 : 128, right = 14;
      const HT = top + laneH * LANES.length + 34;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      svg.textContent = "";
      const x = (i) => left + (i / 6) * (W - left - right);
      const t = tone(), g = grey();
      // Lanes
      LANES.forEach((ln, k) => {
        const y = top + k * laneH;
        el("rect", { x: left, y: y + 3, width: W - left - right, height: laneH - 6, rx: 8, fill: k % 2 ? "transparent" : t, "fill-opacity": 0.06 }, svg);
        const words = narrow ? ln.split(" and ") : [ln];
        words.forEach((wd, j) => el("text", { x: 4, y: y + laneH / 2 + 4 + (j - (words.length - 1) / 2) * 13, style: "fill:var(--text);" + (narrow ? "font-size:11px" : "") }, svg).textContent = (narrow && j > 0 ? "& " : "") + wd);
      });
      // Time ticks
      TICKS.forEach((tk, i) => {
        el("line", { x1: x(i), x2: x(i), y1: top, y2: top + laneH * LANES.length, stroke: colour("--border") || g, "stroke-width": 1 }, svg);
        if (!narrow || i % 2 === 0) el("text", { x: x(i), y: HT - 14, "text-anchor": i === 0 ? "start" : i === 6 ? "end" : "middle", style: narrow ? "font-size:11px" : "" }, svg).textContent = tk;
      });
      // The wave: everything up to the chosen stage is lit
      const reach = STAGES[si].at;
      el("rect", { x: left, y: top, width: Math.max(4, x(reach) - left), height: laneH * LANES.length, fill: t, "fill-opacity": 0.08 }, svg);
      STAGES.forEach((st, k) => {
        const cx = x(st.at), cy = top + st.lane * laneH + laneH / 2;
        const on = k <= si;
        if (k > 0) {
          const p = STAGES[k - 1];
          el("line", { x1: x(p.at), y1: top + p.lane * laneH + laneH / 2, x2: cx, y2: cy, stroke: on ? t : g, "stroke-width": 2, "stroke-dasharray": on ? "none" : "4 4", "stroke-opacity": on ? 0.9 : 0.6 }, svg);
        }
        el("circle", { cx, cy, r: k === si ? 10 : 7, fill: on ? t : colour("--hub-card") || "#fff", stroke: on ? t : g, "stroke-width": 2 }, svg);
        el("text", { x: cx, y: cy + 4, "text-anchor": "middle", style: "font-size:11px;font-weight:700;fill:" + (on ? "var(--on-tone)" : "var(--text-2)") }, svg).textContent = String(k + 1);
      });
      const S = STAGES[si];
      $("rp-title").textContent = (si + 1) + ". " + S.title;
      $("rp-uk").textContent = S.uk;
      $("rp-ng").textContent = S.ng;
      $("rp-prev").disabled = si === 0;
      $("rp-next").disabled = si === STAGES.length - 1;
    };
    buttons("rp-stage", STAGES, (k) => { si = k; draw(); }, 0);
    $("rp-prev").addEventListener("click", () => { si = Math.max(0, si - 1); press("rp-stage", si); draw(); });
    $("rp-next").addEventListener("click", () => { si = Math.min(STAGES.length - 1, si + 1); press("rp-stage", si); draw(); });
    onResize("chart-ripple", draw);
    H.charts(draw);
  }

  // ---------- The fool in the shower ----------
  if (has("chart-shower")) {
    const Q = 32, A = 0.92, B = 0.15, NEUTRAL = 3;
    let ahead = false;
    // Inflation gap x: fades by itself a little (A) and is pushed down by policy set L quarters earlier (B).
    // The bank sets how far its rate sits above neutral (u) from today's gap, or from a forecast of the gap L quarters ahead.
    const sim = (L, phi, look) => {
      const x = [4], u = [];
      for (let t = 0; t < Q; t++) {
        let base = x[t];
        if (look) {
          let f = x[t];
          for (let k = 0; k < L; k++) { const i = t - L + k; f = A * f - B * (i >= 0 ? u[i] : 0); }
          base = f;
        }
        u.push(Math.max(-NEUTRAL, phi * base));
        const i = t - L;
        x.push(A * x[t] - B * (i >= 0 ? u[i] : 0));
      }
      return { pi: x.map((v) => 2 + v), r: u.map((v) => NEUTRAL + v) };
    };

    const draw = () => {
      const L = parseInt($("sh-lag").value, 10), phi = parseFloat($("sh-phi").value);
      $("sh-lag-out").textContent = L === 0 ? "none" : L + (L === 1 ? " quarter" : " quarters");
      $("sh-phi-out").textContent = phi < 1 ? "Gentle" : phi < 1.75 ? "Firm" : "Aggressive";
      const { pi, r } = sim(L, phi, ahead);
      const lo = Math.min(0, Math.floor(Math.min(...pi) - 0.5)), hi = Math.max(8, Math.ceil(Math.max(...pi, ...r) + 0.5));
      const svg = $("chart-shower");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 260 : 290;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: 40, r: 14, t: 16, b: 36 };
      const st = hi - lo > 10 ? 4 : 2, yt = [];
      for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) yt.push(v);
      const xt = W < 480 ? [0, 8, 16, 24, 32] : [0, 4, 8, 12, 16, 20, 24, 28, 32];
      const s = frame(svg, W, HT, pad, [0, Q], [lo, hi], xt, yt, (v) => v + "%");
      // Shade time spent below target (overshooting)
      for (let t = 0; t < Q; t++) {
        if (pi[t] < 1.5 || pi[t + 1] < 1.5) el("rect", { x: s.sx(t), y: pad.t, width: s.sx(t + 1) - s.sx(t), height: HT - pad.t - pad.b, fill: grey(), "fill-opacity": 0.12 }, svg);
      }
      el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(2), y2: s.sy(2), stroke: colour("--text-2"), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      el("text", { x: W - pad.r - 4, y: s.sy(2) - 6, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = "2% target";
      const line = (arr, stroke, w, dash) => {
        let d = "";
        arr.forEach((v, i) => { d += (i ? "L" : "M") + s.sx(i).toFixed(1) + " " + s.sy(v).toFixed(1); });
        el("path", { d, fill: "none", stroke, "stroke-width": w, "stroke-dasharray": dash || "none", "stroke-linejoin": "round" }, svg);
      };
      line(r, grey(), 2.5, "7 5");
      line(pi, tone(), 3);
      el("text", { x: W - pad.r, y: HT - 6, "text-anchor": "end", style: "fill:var(--text)" }, svg).textContent = "Quarters after the shock →";

      const low = Math.min(...pi), peakR = Math.max(...r);
      let settle = Q;
      for (let t = Q; t >= 0; t--) { if (Math.abs(pi[t] - 2) > 0.5) { settle = t + 1; break; } if (t === 0) settle = 0; }
      const out = $("sh-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Lowest inflation: } " + fmt(low) + "\\% \\quad \\text{Highest policy rate: } " + fmt(peakR) + "\\%");
      tex(b, "\\text{Settled within } \\pm 0.5 \\text{ of target after: } " + (settle >= Q ? "\\text{not within 8 years}" : settle + "\\text{ quarters}"));

      let story;
      if (low < 1.5 && !ahead) story = "The bank keeps raising because inflation still looks high today, but today's inflation reflects decisions from " + L + " quarters ago. By the time the earlier rises bite, rates are far too high: inflation crashes below target (shaded), the bank slashes rates, and the cycle repeats. That's Friedman's fool in the shower, scalding then freezing. Switch to \"Look ahead\" to see the fix.";
      else if (ahead && L > 0) story = "Looking ahead, the bank counts the rises already in the pipeline and stops before inflation has fully come down. It raises rates less (peak " + fmt(peakR) + "%) and lands close to target without the overshoot. Real central banks try to do this with forecasts, but forecasts can be wrong, which is why lags are \"variable\" as well as long.";
      else if (L === 0) story = "With no lag, reacting to today's inflation works fine: each rate change takes effect straight away, so the bank never overdoes it. The trouble only starts when there's a delay. Drag the lag up to 5 or 6 quarters.";
      else story = "With a short lag or a gentle response, reacting to today's numbers gets there without much overshooting. Make the lag longer or the response more aggressive and watch inflation start to swing.";
      $("sh-story").textContent = story;
    };

    buttons("sh-mode", [{ n: "React to today" }, { n: "Look ahead" }], (k) => { ahead = k === 1; draw(); }, 0);
    ["sh-lag", "sh-phi"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-shower", draw);
    H.charts(draw);
  }
})();