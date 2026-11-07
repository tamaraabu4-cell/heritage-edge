// Interactives for the note "From Jones to $4.5 Trillion" (Hedge Funds · The Hedge Fund Business).
// Uses the helpers note.js puts on window.HubNote. Both charts are drawn at their real
// width, so the labels stay readable on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour, frame } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

  // Size an svg to its real width and return that width
  const fit = (svg, h) => {
    const w = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    return w;
  };
  // Redraw when the chart's width changes (phone rotated, window resized)
  const onResize = (id, draw) => {
    let last = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($(id).getBoundingClientRect().width);
      if (w && w !== last) { last = w; draw(); }
    });
  };
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
  const path = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");

  // ---------- Jones vs the copycats, 1960–1975 ----------
  if (has("chart-jones")) {
    // S&P 500 yearly price change, %, rounded
    const YEARS = [1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975];
    const MKT = [-3.0, 23.1, -11.8, 18.9, 13.0, 9.1, -13.1, 20.1, 7.7, -11.4, 0.1, 10.8, 15.6, -17.4, -29.7, 31.5];
    const GROSS = 1.6, RATE = 0.06; // borrowing costs 6% a year
    const grow = (f) => {
      const v = [100];
      MKT.forEach((m) => v.push(Math.max(0, v[v.length - 1] * (1 + Math.max(-1, f(m / 100))))));
      return v;
    };
    const draw = () => {
      const net = parseInt($("hj-net").value, 10) / 100, s = parseFloat($("hj-skill").value) / 100;
      $("hj-net-out").textContent = Math.round(net * 100) + "%";
      $("hj-skill-out").textContent = (s * 100).toFixed(1).replace(/\.0$/, "") + "%";
      const G = Math.max(GROSS, net);
      const longs = (G + net) / 2; // longs above 100% of the fund are paid for with borrowed money
      const mkt = grow((m) => m), fund = grow((m) => net * m + G * s - Math.max(0, longs - 1) * RATE), copy = grow((m) => 1.5 * m + 1.5 * s - 0.5 * RATE);
      const svg = $("chart-jones"), h = 280, w = fit(svg, h);
      const top = Math.max(...mkt, ...fund, ...copy);
      const yMax = top <= 400 ? 400 : top <= 600 ? 600 : top <= 800 ? 800 : Math.ceil(top / 400) * 400;
      const yt = []; for (let y = 0; y <= yMax; y += yMax / 4) yt.push(y);
      const pad = { l: 48, r: 14, t: 14, b: 30 };
      const xs = YEARS.concat([1976]);
      const sc = frame(svg, w, h, pad, [1960, 1976], [0, yMax], w < 480 ? [1960, 1968, 1976] : [1960, 1964, 1968, 1972, 1976], yt, (y) => "$" + Math.round(y));
      // Shade the two bear markets
      [[1969, 1971], [1973, 1975]].forEach(([a, b]) => el("rect", { x: sc.sx(a), y: pad.t, width: sc.sx(b) - sc.sx(a), height: h - pad.t - pad.b, fill: grey(), "fill-opacity": 0.12 }, svg));
      const line = (v, stroke, width, dash) => el("path", { d: path(v.map((y, i) => [sc.sx(xs[i]), sc.sy(y)])), fill: "none", stroke, "stroke-width": width, "stroke-linejoin": "round", "stroke-dasharray": dash || "none" }, svg);
      line(mkt, grey(), 2);
      line(copy, grey(), 2, "6 4");
      line(fund, tone(), 3);

      const end = (v) => Math.round(v[v.length - 1]);
      // The copycat's lowest point after 1968, and its peak before that low
      const lowAt = copy.indexOf(Math.min(...copy.slice(10))), lowCopy = copy[lowAt], peakCopy = Math.max(...copy.slice(0, lowAt + 1));
      const out = $("hj-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{1975: your fund } \\$" + end(fund) + " \\quad \\text{S\\&P } \\$" + end(mkt) + " \\quad \\text{copycat } \\$" + end(copy));
      const worst = (v) => Math.round(Math.min(...v.slice(1).map((x, i) => (x / v[i] - 1) * 100)));
      tex(b, "\\text{Worst year: fund } " + worst(fund) + "\\% \\quad \\text{copycat } " + worst(copy) + "\\%");

      const ahead1968 = copy[9] > fund[9];
      let story;
      if (net >= 1.5) story = "At this net exposure your fund is a copycat with a few shorts. It rides the 1960s rally, then the shaded bear markets do the damage: the borrowing that boosted the gains magnifies the falls.";
      else if (ahead1968 && end(fund) > end(copy)) story = "By 1968 the copycat is well ahead: $" + Math.round(copy[9]) + " against your $" + Math.round(fund[9]) + ". That's why everyone dropped the hedge. Then 1969–70 and 1973–74 hit: the copycat falls from $" + Math.round(peakCopy) + " at its peak to $" + Math.round(lowCopy) + " (" + Math.round((lowCopy / peakCopy - 1) * 100) + "%), and finishes behind you. Same skill; the difference is how much market risk each one carried.";
      else if (end(fund) > end(copy)) story = "Your fund finishes ahead of the copycat with the same picking skill, mainly because it lost far less in the shaded bear markets. Losses compound against you: a 40% fall needs a 67% gain to recover.";
      else story = "Here the copycat finishes ahead: at this setting the hedge costs more in the good years than it saves in the bad ones. Try more skill or lower net exposure, and watch what happens in the shaded years.";
      if (s === 0) story = "With no picking skill, the shorts just cancel out part of the longs, so your fund is only a smaller bet on the market (at 0% net, no bet at all), and both funds trail the S&P 500. A hedge fund without an edge is a mutual fund with higher fees.";
      $("hj-story").textContent = story;
    };
    ["hj-net", "hj-skill"].forEach((id) => $(id).addEventListener("input", draw));
    onResize("chart-jones", draw);
    H.charts(draw);
  }

  // ---------- The industry, year by year ----------
  if (has("chart-growth")) {
    // Industry assets ($ billions) and number of funds
    const DATA = [[1990, 40, 600], [2000, 500, 4000], [2007, 1900, 10000], [2009, 1400, 8000], [2015, 2900, 10000], [2020, 3600, 9000], [2024, 4500, 9500]];
    const at = (y) => {
      for (let i = 1; i < DATA.length; i++) if (y <= DATA[i][0]) {
        const [x0, v0] = DATA[i - 1], [x1, v1] = DATA[i];
        return v0 + ((y - x0) / (x1 - x0)) * (v1 - v0);
      }
      return DATA[DATA.length - 1][1];
    };
    const EVENTS = [
      { n: "1990", y: 1990, t: "The start of the institutional era. Hedge funds are still mostly money from wealthy individuals, run by a few hundred managers." },
      { n: "1992", y: 1992, t: "Black Wednesday: Soros bets about $10 billion against the pound and makes a reported $1 billion when Britain leaves Europe's exchange rate system. Global macro becomes famous." },
      { n: "1998", y: 1998, t: "LTCM loses $4.6 billion in weeks on about 25-to-1 leverage; the New York Fed organises a $3.6 billion rescue by 14 banks. The industry keeps growing anyway." },
      { n: "2000", y: 2000, t: "The dot-com bubble bursts. Tiger Management closes after refusing to buy tech, but many macro and long/short funds do well in the fall. Institutions start arriving." },
      { n: "2007", y: 2007, t: "The pre-crisis peak, driven by pensions and endowments copying the Yale Model. Paulson makes about 590% betting against subprime mortgages." },
      { n: "2009", y: 2009, t: "After 2008: the average fund lost about 19% (the S&P 500 fell 38.5%), investors were gated, Madoff was exposed, and about 2,000 funds closed." },
      { n: "2015", y: 2015, t: "Recovery, with institutions back in charge. Fees are falling and the multi-strategy platforms are pulling in most of the new money." },
      { n: "2020", y: 2020, t: "COVID volatility. Quant funds and platforms keep expanding; the gap between the biggest firms and everyone else widens." },
      { n: "2024", y: 2024, t: "About $4.5 trillion across roughly 9,500 funds. Multi-strategy platforms dominate, average fees are about 1.4% and 17%, and AI and alternative data are standard tools." },
    ];
    let ei = EVENTS.length - 1;
    const draw = () => {
      const svg = $("chart-growth"), h = 260, w = fit(svg, h);
      const pad = { l: 52, r: 16, t: 16, b: 30 };
      const sc = frame(svg, w, h, pad, [1988, 2026], [0, 5000], w < 480 ? [1990, 2005, 2020] : [1990, 2000, 2010, 2020], [0, 1000, 2000, 3000, 4000, 5000], (v) => (v === 0 ? "0" : "$" + v / 1000 + "tn"));
      const t = tone(), g = grey();
      // Area and line through the data points
      const pts = DATA.map((d) => [sc.sx(d[0]), sc.sy(d[1])]);
      el("path", { d: path(pts) + "L" + pts[pts.length - 1][0].toFixed(1) + " " + sc.sy(0) + "L" + pts[0][0].toFixed(1) + " " + sc.sy(0) + "Z", fill: t, "fill-opacity": 0.12 }, svg);
      el("path", { d: path(pts), fill: "none", stroke: t, "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
      DATA.forEach((d) => el("circle", { cx: sc.sx(d[0]), cy: sc.sy(d[1]), r: 3.5, fill: t }, svg));
      // Small ticks for every event, a big marker for the chosen one
      EVENTS.forEach((e, i) => {
        if (i === ei) return;
        el("circle", { cx: sc.sx(e.y), cy: sc.sy(at(e.y)), r: 5, fill: "none", stroke: g, "stroke-width": 1.5 }, svg);
      });
      const e = EVENTS[ei], ex = sc.sx(e.y), ey = sc.sy(at(e.y));
      el("line", { x1: ex, x2: ex, y1: pad.t, y2: h - pad.b, stroke: t, "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
      el("circle", { cx: ex, cy: ey, r: 7, fill: t, stroke: colour("--hub-card") || "#fff", "stroke-width": 2 }, svg);
      el("text", { x: Math.min(ex + 8, w - pad.r - 4), y: pad.t + 12, "text-anchor": ex > w - 70 ? "end" : "start", style: "fill:" + t + ";font-weight:600" }, svg).textContent = e.y;

      const out = $("hj-g-read"); out.textContent = "";
      const d = DATA.find((x) => x[0] === e.y);
      const a = document.createElement("span"); out.append(a);
      if (d) tex(a, "\\text{Assets: } " + (d[1] >= 1000 ? "\\$" + (d[1] / 1000).toFixed(1).replace(/\.0$/, "") + "\\text{ trillion}" : "\\$" + d[1] + "\\text{ billion}") + " \\quad \\text{Funds: about } " + d[2].toLocaleString("en-GB").replace(/,/g, "{,}"));
      else tex(a, "\\text{Between data points: the line is joined straight}");
      $("hj-g-story").textContent = e.t;
    };
    buttons("hj-event", EVENTS, (i) => { ei = i; draw(); }, ei);
    onResize("chart-growth", draw);
    H.charts(draw);
  }
})();