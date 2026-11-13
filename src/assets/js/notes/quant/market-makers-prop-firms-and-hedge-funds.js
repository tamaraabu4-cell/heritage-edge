// Interactives for the note "Market Makers, Prop Firms and Hedge Funds" (Quant · Quant Trading Firms).
// "Two ways to earn" is drawn at its real width, so the labels stay readable on a phone.
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
  const usd = (v) => {
    const a = Math.abs(v), s = v < 0 ? "−$" : "$";
    if (a >= 1e6) { const mm = a / 1e6; return s + (mm >= 100 || Math.abs(mm - Math.round(mm)) < 0.05 ? Math.round(mm) : mm.toFixed(1)) + "m"; }
    if (a >= 1e3) return s + Math.round(a / 1e3).toLocaleString("en-GB") + "k";
    return s + Math.round(a);
  };

  // ---------- Two ways to earn ----------
  if ($("chart-tw")) {
    const TICK = 12.5, DAYS = 252;
    const TERMS = [{ b: "2 and 20", m: 0.02, p: 0.2 }, { b: "Today's average, 1.4 and 17", m: 0.014, p: 0.17 }];
    let terms = 0;
    const draw = () => {
      const e = parseFloat($("tw-e").value), v = parseFloat($("tw-v").value);
      const A = parseFloat($("tw-a").value) * 1e9, g = parseFloat($("tw-g").value) / 100;
      const { m, p } = TERMS[terms];
      $("tw-e-out").textContent = e.toFixed(2);
      $("tw-v-out").textContent = Math.round(v).toLocaleString("en-GB");
      $("tw-a-out").textContent = "$" + (A / 1e9).toFixed(A % 5e8 ? 2 : 1) + "bn";
      $("tw-g-out").textContent = (g > 0 ? "+" : "") + Math.round(g * 100) + "%";

      const day = e * TICK * v, desk = day * DAYS;
      const mgmt = m * A, perf = p * Math.max(0, g - m) * A, fund = mgmt + perf;

      const svg = $("chart-tw");
      const narrow = (Math.round(svg.getBoundingClientRect().width) || 640) < 460;
      const h = narrow ? 200 : 160, w = fit(svg, h);
      const pad = { l: narrow ? 12 : 150, r: 18, t: 16, b: 34 };
      const top = Math.max(desk, fund, 1);
      const raw = top / 4, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
      const xMax = Math.ceil(top / step) * step;
      const sx = (x) => pad.l + (x / xMax) * (w - pad.l - pad.r);
      for (let x = 0; x <= xMax + step / 2; x += step) {
        el("line", { x1: sx(x), x2: sx(x), y1: pad.t, y2: h - pad.b, class: "grid" }, svg);
        el("text", { x: sx(x), y: h - pad.b + 18, "text-anchor": x === 0 ? "start" : "middle" }, svg).textContent = usd(x);
      }
      el("text", { x: w - pad.r, y: h - 2, "text-anchor": "end" }, svg).textContent = "Revenue in a year";
      const rows = [
        { label: "Market making desk", parts: [{ v: desk, c: tone(), o: 1 }], total: desk },
        { label: "Fund at " + TERMS[terms].b.replace("Today's average, ", ""), parts: [{ v: mgmt, c: grey(), o: 0.85 }, { v: perf, c: tone(), o: 1 }], total: fund },
      ];
      const bh = narrow ? 26 : 34, gap = narrow ? 44 : 30;
      rows.forEach((r, i) => {
        const y = pad.t + (narrow ? 18 : 12) + i * (bh + gap);
        if (narrow) el("text", { x: pad.l, y: y - 6, style: "fill:var(--text);font-weight:600" }, svg).textContent = r.label;
        else el("text", { x: pad.l - 10, y: y + bh / 2 + 4, "text-anchor": "end", style: "fill:var(--text);font-weight:600" }, svg).textContent = r.label;
        let x0 = 0;
        r.parts.forEach((pt) => {
          if (pt.v <= 0) return;
          el("rect", { x: sx(x0), y, width: Math.max(1, sx(x0 + pt.v) - sx(x0)), height: bh, rx: 3, fill: pt.c, "fill-opacity": pt.o }, svg);
          x0 += pt.v;
        });
        const endX = sx(r.total), inside = endX > w - pad.r - 70;
        el("text", { x: inside ? endX - 6 : endX + 6, y: y + bh / 2 + 4, "text-anchor": inside ? "end" : "start", style: inside ? "fill:var(--on-tone);font-weight:600" : "fill:var(--text);font-weight:600" }, svg).textContent = usd(r.total);
      });

      const out = $("tw-read"); out.textContent = "";
      span(out, "Desk: " + usd(day) + " a day, " + usd(desk) + " a year");
      span(out, "Fund: " + usd(mgmt) + " management + " + usd(perf) + " performance = " + usd(fund));

      let story;
      if (g <= m) story = "A return of " + (g < 0 ? "−" : "") + Math.abs(Math.round(g * 100)) + "% doesn't clear the " + +(m * 100).toFixed(1) + "% management fee, so there's no performance fee: the fund still collects " + usd(mgmt) + " just for managing the money" + (g < 0 ? ", even though its investors lost money" : "") + ". (In practice a loss also pushes the fund below its high-water mark, so next year's performance fee is at risk too.) The desk's revenue doesn't depend on which way markets went, only on how much it traded.";
      else if (desk > fund) story = "The desk out-earns the fund here. To double its revenue it needs twice the flow or twice the edge per contract, and both are limited by competition. Its revenue would barely change if markets crashed or soared, as long as volume held up.";
      else story = "The fund out-earns the desk. To grow, it can raise more money or make better returns; the desk can only serve more flow or earn more per contract. Note how much of the fund's revenue is the management fee (" + Math.round((mgmt / fund) * 100) + "%), earned whether or not the year goes well.";
      $("tw-story").textContent = story;
    };
    choice("tw-fees", TERMS.map((t) => t.b), terms, (i) => { terms = i; draw(); });
    ["tw-e", "tw-v", "tw-a", "tw-g"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-tw", draw);
    H.charts(draw);
  }

  // ---------- Sort the firms ----------
  if ($("sf-list")) {
    const BOXES = ["Market maker", "Prop firm", "Hedge fund", "Something else"];
    const FIRMS = [
      { n: "Citadel Securities", ok: [0], why: "One of the largest market makers in US shares and options, trading its own capital. It's a separate company from Citadel the hedge fund, though both were founded by Ken Griffin." },
      { n: "Citadel", ok: [2], why: "A multi-strategy hedge fund running outside investors' money across many teams (Single-Manager vs Multi-Manager)." },
      { n: "Jane Street", ok: [1, 0], why: "Both boxes work: a privately owned firm trading only its own money, whose biggest business is market making, especially in ETFs and bonds." },
      { n: "Two Sigma", ok: [2], why: "A quant hedge fund managing investors' money with machine learning and systematic strategies." },
      { n: "Optiver", ok: [0, 1], why: "Both boxes work: founded in Amsterdam, it trades its own capital and is best known for market making in options." },
      { n: "Renaissance Technologies", ok: [2], why: "A quant hedge fund. Its famous Medallion fund has been closed to outsiders since 2005 and now runs mainly employees' money, but its other funds take outside investors." },
      { n: "Goldman Sachs", ok: [3], why: "A bank: sell side. It makes markets for clients too, but as part of a regulated bank with deposits, capital rules and the Volcker Rule's ban on proprietary trading." },
      { n: "FTMO", ok: [3], why: "A retail \"prop firm\": traders pay for a trading challenge. FTMO says its challenge and funded accounts are simulated, with rewards paid from simulated profits, so it isn't trading its own capital in the market." },
      { n: "XTX Markets", ok: [0, 1], why: "Both boxes work: a London firm trading only its own capital, and one of the largest liquidity providers in FX." },
      { n: "Virtu Financial", ok: [0], why: "A US market maker listed on Nasdaq, famous for reporting just one losing day in more than five years before it went public." },
    ];
    const list = $("sf-list"), state = FIRMS.map(() => null);
    const score = () => {
      const done = state.filter((s) => s !== null).length, right = state.filter((s) => s === true).length;
      $("sf-score").textContent = done ? right + " of " + done + " right first time" + (done === FIRMS.length ? ". " + (right >= 8 ? "You'd sail through this part of an interview." : "Have another read of the table in section 1.") : "") : "";
    };
    FIRMS.forEach((f, i) => {
      const li = document.createElement("li"); li.className = "sf-row";
      const top = document.createElement("div"); top.className = "sf-top";
      const name = document.createElement("span"); name.className = "sf-name"; name.textContent = f.n;
      const opts = document.createElement("div"); opts.className = "sf-opts"; opts.setAttribute("role", "group"); opts.setAttribute("aria-label", "Which kind of firm is " + f.n + "?");
      const why = document.createElement("p"); why.className = "sf-why"; why.hidden = true;
      BOXES.forEach((b, j) => {
        const btn = document.createElement("button"); btn.type = "button"; btn.textContent = b;
        btn.addEventListener("click", () => {
          const good = f.ok.includes(j);
          if (state[i] === null) state[i] = good;
          if (good) {
            [...opts.children].forEach((c, k) => { c.classList.toggle("right", f.ok.includes(k)); c.disabled = true; });
            why.textContent = "";
            const s = document.createElement("strong"); s.textContent = (state[i] ? "Right. " : "Got there. ");
            why.append(s, document.createTextNode(f.why));
            why.hidden = false;
          } else {
            btn.classList.add("wrong"); btn.disabled = true;
          }
          score();
        });
        opts.append(btn);
      });
      top.append(name, opts); li.append(top, why); list.append(li);
    });
    score();
  }
})();