// Charts for the note "Corporate Actions" (Markets · How Markets Work).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, frame, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const card = () => colour("--hub-card");
  const n0 = (v) => Math.round(v).toLocaleString("en-GB");
  const texN = (v) => n0(v).replace(/,/g, "{,}");

  // Small helper: a row of toggle buttons
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

  // ---------- Who gets the dividend? ----------
  if (has("chart-div")) {
    const COLS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Mon", "Tue"];   // business days; the weekend is skipped
    const LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "next Monday", "next Tuesday"];
    const EX = 3;                                                       // Thursday is the ex-date in both markets
    const MARKETS = [{ n: "US (T+1)", t: 1, record: 3 }, { n: "UK (T+2)", t: 2, record: 4 }];
    const BUY = [{ n: "Buy Tuesday", d: 1 }, { n: "Buy Wednesday", d: 2 }, { n: "Buy Thursday", d: 3 }, { n: "Buy Friday", d: 4 }];
    const P0 = 50, DIV = 1, Q = 1000;
    let mk = 0, bi = 1;
    const draw = () => {
      const m = MARKETS[mk], buy = BUY[bi].d, t = tone(), g = grey(), c = card();
      const price = (d) => (d < EX ? P0 : P0 - DIV);
      const settle = buy + m.t, gets = settle <= m.record;
      const svg = $("chart-div"), W = 640, Ht = 280, pad = { l: 56, r: 24, t: 40, b: 38 };
      const f = frame(svg, W, Ht, pad, [-0.5, 6.5], [48.5, 50.5], [], [49, 50], (y) => y.toFixed(2));
      COLS.forEach((d, i) => {
        el("text", { x: f.sx(i), y: Ht - pad.b + 18, "text-anchor": "middle", style: i === buy ? "fill:" + t + ";font-weight:600" : "" }, svg).textContent = d;
      });
      // weekend gap between Fri and Mon
      el("line", { x1: f.sx(4.5), x2: f.sx(4.5), y1: f.sy(48.5), y2: f.sy(50.5), stroke: g, "stroke-dasharray": "1 4" }, svg);
      el("text", { x: f.sx(4.5), y: Ht - pad.b + 18, "text-anchor": "middle" }, svg).textContent = "·";

      // Ex-date and record date
      const mark = (d, label, row) => {
        el("line", { x1: f.sx(d), x2: f.sx(d), y1: f.sy(48.5), y2: f.sy(50.5), stroke: g, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
        el("text", { x: f.sx(d), y: pad.t - 22 + row * 14, "text-anchor": "middle", style: "fill:var(--text)" }, svg).textContent = label;
      };
      if (m.record === EX) mark(EX, "ex-date = record date", 0);
      else { mark(EX, "ex-date", 0); mark(m.record, "record date", 1); }

      // Price: steps down by the dividend at the ex-date open
      let d = "";
      COLS.forEach((_, i) => {
        const y = f.sy(price(i));
        if (i === EX) d += "L" + f.sx(i - 0.5) + "," + f.sy(price(i - 1)) + "L" + f.sx(i - 0.5) + "," + y;
        d += (i ? "L" : "M") + f.sx(i) + "," + y;
      });
      el("path", { d, fill: "none", stroke: t, "stroke-width": 3, "stroke-linejoin": "round" }, svg);
      el("text", { x: f.sx(EX - 0.5) + 8, y: f.sy(49.5), style: "fill:" + t }, svg).textContent = "drops by the 1.00 dividend";

      // You buy, and when it settles
      el("circle", { cx: f.sx(buy), cy: f.sy(price(buy)), r: 8, fill: t, stroke: c, "stroke-width": 2 }, svg);
      el("text", { x: f.sx(buy), y: f.sy(price(buy)) + 26, "text-anchor": "middle", style: "fill:" + t + ";font-weight:600" }, svg).textContent = "you buy";
      if (settle <= 6) {
        el("circle", { cx: f.sx(settle), cy: f.sy(48.75), r: 7, fill: c, stroke: t, "stroke-width": 2.5 }, svg);
        el("text", { x: f.sx(settle) + (settle > 5 ? -12 : 12), y: f.sy(48.75) + 4, "text-anchor": settle > 5 ? "end" : "start", style: "fill:" + t }, svg).textContent = "settles";
      }

      const paid = Q * price(buy), divCash = gets ? Q * DIV : 0, after = Q * (P0 - DIV) + divCash;
      const out = $("div-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{You pay } " + texN(paid) + " \\quad \\text{Dividend: } " + (gets ? texN(divCash) : "0"));
      tex(b, "\\text{Afterwards: shares } " + texN(Q * (P0 - DIV)) + " + \\text{cash } " + texN(divCash) + " = " + texN(after));

      $("div-story").textContent = gets
        ? "You bought on " + LONG[buy] + ", before the ex-date. Your purchase settles on " + LONG[settle] + ", in time to be on the register on the record date, so you get the 1.00 dividend. But you paid 50.00, and the next morning the share is worth 49.00. You've swapped 1,000 of share value for 1,000 of cash: no free money, and the dividend may be taxed."
        : "You bought on " + LONG[buy] + ", on or after the ex-date, so you don't get this dividend. But you paid only " + price(buy).toFixed(2) + " instead of 50.00. Your purchase settles on " + LONG[Math.min(settle, 6)] + ", after the record date, which is exactly why the ex-date is set where it is.";
    };
    buttons("div-mkt", MARKETS, (i) => { mk = i; draw(); }, 0);
    buttons("div-day", BUY, (i) => { bi = i; draw(); }, 1);
    H.charts(draw);
  }

  // ---------- Take up, sell, or do nothing? ----------
  if (has("chart-rights")) {
    const TERMS = [{ n: "1 for 4", N: 4 }, { n: "1 for 2", N: 2 }, { n: "1 for 1", N: 1 }];
    const P = 100, Q = 1000;
    let ti = 0;
    const draw = () => {
      const disc = parseInt($("rts-disc").value, 10) / 100;
      $("rts-disc-out").textContent = Math.round(disc * 100) + "%";
      const N = TERMS[ti].N, S = P * (1 - disc);
      const terp = (N * P + S) / (N + 1), newSh = Q / N, right = terp - S;
      const opts = [
        { n: "Take up", shares: (Q + newSh) * terp, cash: -newSh * S },
        { n: "Sell the rights", shares: Q * terp, cash: newSh * right },
        { n: "Do nothing", shares: Q * terp, cash: 0 },
      ];
      const t = tone(), g = grey();
      const peak = Math.max(...opts.map((o) => o.shares + Math.max(0, o.cash))) * 1.08;
      const step = peak > 120000 ? 40000 : 20000;
      const top = Math.ceil(peak / step) * step;
      const bottom = -Math.ceil((newSh * S * 1.05) / step) * step;
      const yt = [];
      for (let y = 0; y <= top + 1; y += step) yt.push(y);
      for (let y = -step; y >= bottom - 1; y -= step) yt.push(y);
      const svg = $("chart-rights"), W = 640, Ht = 280, pad = { l: 64, r: 24, t: 20, b: 30 };
      const f = frame(svg, W, Ht, pad, [0, 3], [bottom, top], [], yt, (y) => (y === 0 ? "0" : (y / 1000).toFixed(0) + "k"));
      // where you started
      el("line", { x1: f.sx(0), x2: f.sx(3), y1: f.sy(100000), y2: f.sy(100000), stroke: g, "stroke-width": 1.5, "stroke-dasharray": "6 4" }, svg);
      const bw = (f.sx(1) - f.sx(0)) * 0.42;
      opts.forEach((o, i) => {
        const cx = f.sx(i + 0.5), x = cx - bw / 2;
        el("rect", { x, y: f.sy(o.shares), width: bw, height: f.sy(0) - f.sy(o.shares), rx: 4, fill: t }, svg);
        if (o.cash > 0) el("rect", { x, y: f.sy(o.shares + o.cash), width: bw, height: f.sy(o.shares) - f.sy(o.shares + o.cash), fill: g, "fill-opacity": 0.55 }, svg);
        if (o.cash < 0) {
          el("rect", { x, y: f.sy(0), width: bw, height: f.sy(o.cash) - f.sy(0), fill: g, "fill-opacity": 0.55 }, svg);
          el("text", { x: cx, y: (f.sy(0) + f.sy(o.cash)) / 2 + 4, "text-anchor": "middle", style: "fill:var(--text)" }, svg).textContent = "paid " + (Math.abs(o.cash) / 1000).toFixed(1) + "k";
        }
        const wealth = o.shares + o.cash;
        el("text", { x: cx, y: Ht - 8, "text-anchor": "middle", style: "font-weight:600;fill:" + (Math.abs(wealth - 100000) < 1 ? "var(--text)" : t) }, svg).textContent = o.n + " = " + (wealth / 1000).toFixed(1) + "k";
      });

      const out = $("rts-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{New shares at } " + S.toFixed(2) + " \\quad \\text{TERP} = " + terp.toFixed(2));
      tex(b, "\\text{One right is worth } " + right.toFixed(2) + " \\quad \\text{Doing nothing costs } " + texN(Q * (P - terp)));
      $("rts-story").textContent = "Taking up and selling both leave you with exactly what you started with (the take-up bar is taller only because you paid in " + n0(newSh * S) + " of new money). Doing nothing loses " + n0(Q * (P - terp)) + ", about " + ((1 - terp / P) * 100).toFixed(1) + "% of your holding. " + (disc >= 0.4 || N <= 1 ? "The bigger the discount and the more new shares, the more it costs to ignore the letter." : "Try a deeper discount or 1 for 1 and watch the cost of ignoring it grow.");
    };
    buttons("rts-terms", TERMS, (i) => { ti = i; draw(); }, 0);
    $("rts-disc").addEventListener("input", draw);
    H.charts(draw);
  }
})();