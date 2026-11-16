// Interactives for the note "The Firms" (Quant · Quant Trading Firms).
// Figures are as reported by November 2026; see the note's sources. The chart is drawn at its real width.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, colour } = H;
  const tone = () => colour("--tone");

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

  const FIRMS = [
    { n: "Jane Street", fam: "All-rounder · market maker and prop firm", home: ["US"], mk: ["ETFs", "Bonds", "Options", "FX", "Futures and commodities"],
      rows: [["Founded", "2000, New York"], ["People", "About 3,500"], ["2025 revenue", "About $39.6bn net trading revenue (Reuters), a record and more than JPMorgan's trading desks"],
        ["Known for", "One of the largest market makers in ETFs and bond ETFs; writes most of its systems in OCaml; puzzles and betting games are part of the culture; a fast-growing medium-frequency business"],
        ["In London", "A large office with trading, research and software internships"], ["Watch", "Its trading in Indian options is the third story in Case Studies"]] },
    { n: "XTX Markets", fam: "Machine-learning newcomer · market maker and prop firm", home: ["London", "Europe"], mk: ["FX", "Bonds", "Futures and commodities", "Crypto"],
      rows: [["Founded", "2015, London, by mathematician Alex Gerko (ex-Deutsche Bank and GSA Capital), who owns about 75%"], ["People", "About 250"],
        ["2025 revenue", "About £3.93bn (roughly $5.2bn) combined net revenue across its UK companies, with about £1.71bn profit"],
        ["Known for", "Machine-learning models across FX, shares, bonds, commodities and crypto; about $250bn traded a day; one of the largest FX liquidity providers; building data centres in Finland; a major donor to maths education"],
        ["In London", "Headquarters near King's Cross"], ["Watch", "Its rise is the first story in Case Studies"]] },
    { n: "Citadel Securities", fam: "All-rounder · market maker", home: ["US"], mk: ["Options", "Bonds", "FX", "ETFs"],
      rows: [["Founded", "2002, by Ken Griffin; based in Miami; CEO Peng Zhao"], ["People", "Not reported"],
        ["2025 revenue", "About $12.2bn trading revenue, a record, up 25% on 2024 (Bloomberg)"],
        ["Known for", "Fills about 35% of US-listed retail share volume; huge in US shares and options; market maker in Treasuries and swaps; European fixed income since 2015"],
        ["In London", "An office in London covering its European business"], ["Watch", "Not the same firm as Citadel, the hedge fund"]] },
    { n: "Optiver", fam: "Options house · market maker", home: ["Europe"], mk: ["Options", "ETFs", "Futures and commodities"],
      rows: [["Founded", "1986, Amsterdam"], ["People", "2,233 full-time employees (2025)"],
        ["2025 revenue", "€4.556bn net trading income (up 30%) and €1.769bn net profit, from its published annual report"],
        ["Known for", "Options market making across the world's exchanges; publishes its results; opened a New York office in 2025 and highlights systematic, research-led trading and AI"],
        ["In London", "An office in London; most European graduate hiring is in Amsterdam"], ["Watch", "Its 40th anniversary was 2025"]] },
    { n: "IMC", fam: "Options house · market maker and prop firm", home: ["Europe"], mk: ["Options", "ETFs", "Futures and commodities"],
      rows: [["Founded", "1989, by two traders on the floor of the Amsterdam Equity Options Exchange"], ["People", "About 1,900 (after 450+ hires in 2025)"],
        ["2025 revenue", "$3.12bn net trading revenue (up 40%) and $968m net profit"],
        ["Known for", "An early move from the trading floor to fully automated systems; options and ETF market making; an annual Trading for Charity day"],
        ["In London", "An office in London; most European hiring is in Amsterdam"], ["Watch", "Big offices in Chicago and Sydney too"]] },
    { n: "Hudson River Trading", fam: "Engineering-led speed shop · prop firm", home: ["US"], mk: ["Futures and commodities", "Bonds", "FX", "Crypto"],
      rows: [["Founded", "2002, New York, by computer science and maths graduates from Harvard and MIT"], ["People", "Not reported; 14 offices"],
        ["2025 revenue", "About $12.3bn net trading revenue (Bloomberg), then about $11.4bn in the second quarter of 2026 alone"],
        ["Known for", "An engineering-first culture: automated trading across shares, futures, Treasuries, FX and crypto"],
        ["In London", "London and Dublin offices for its UK and EU business"], ["Watch", "Overtook Citadel Securities' revenue in some recent quarters"]] },
    { n: "Jump Trading", fam: "Engineering-led speed shop · prop firm", home: ["US"], mk: ["Futures and commodities", "Crypto", "FX"],
      rows: [["Founded", "1999, Chicago, by two ex-pit traders who met in the Deutsche Mark futures pit at the CME"], ["People", "About 1,600"],
        ["2025 revenue", "Not published"],
        ["Known for", "High-speed futures trading; a large crypto arm (Jump Crypto) that builds Firedancer, a validator client for the Solana blockchain"],
        ["In London", "One of several offices; it runs its crypto trading from London"], ["Watch", "A subsidiary paid $123m to settle SEC claims over TerraUSD in 2024, and a separate lawsuit over Terra continues; Jump denies wrongdoing"]] },
    { n: "Susquehanna (SIG)", fam: "Options house · market maker and prop firm", home: ["US"], mk: ["Options", "ETFs"],
      rows: [["Founded", "1987, by six friends including Jeff Yass, who met playing cards at university; based near Philadelphia"], ["People", "More than 3,500"],
        ["2025 revenue", "Not published"],
        ["Known for", "Always among the top US options market makers; famous for teaching decision-making through poker; venture and private equity arms, including an early stake in ByteDance, TikTok's owner"],
        ["In London", "Offices in London, with its European headquarters in Dublin"], ["Watch", "Ran a public algorithmic trading competition (the Algothon) with UNSW"]] },
  ];

  // ---------- Meet the firms ----------
  if ($("tf-cards")) {
    const MKTS = ["All", "FX", "Bonds", "Options", "ETFs", "Futures and commodities", "Crypto"];
    const HOMES = ["Anywhere", "London", "Europe", "US"];
    let mk = 0, hm = 0;
    const box = $("tf-cards");
    const cards = FIRMS.map((f) => {
      const c = document.createElement("article"); c.className = "tf-card";
      const h = document.createElement("h4"); h.textContent = f.n;
      const s = document.createElement("p"); s.className = "tf-sub"; s.textContent = f.fam;
      const dl = document.createElement("dl");
      f.rows.forEach(([k, v]) => { const dt = document.createElement("dt"); dt.textContent = k; const dd = document.createElement("dd"); dd.textContent = v; dl.append(dt, dd); });
      const tags = document.createElement("div"); tags.className = "tf-tags";
      f.mk.forEach((t) => { const sp = document.createElement("span"); sp.textContent = t; tags.append(sp); });
      c.append(h, s, dl, tags); box.append(c);
      return c;
    });
    const apply = () => {
      let shown = 0;
      FIRMS.forEach((f, i) => {
        const okM = mk === 0 || f.mk.includes(MKTS[mk]);
        const okH = hm === 0 || f.home.includes(HOMES[hm]);
        const on = okM && okH; if (on) shown++;
        cards[i].classList.toggle("dim", !on);
      });
      const what = (mk ? MKTS[mk].toLowerCase() : "") + (mk && hm ? ", " : "") + (hm ? "based in " + (HOMES[hm] === "US" ? "the US" : HOMES[hm]) : "");
      $("tf-count").textContent = mk || hm ? shown + " of " + FIRMS.length + " firms match (" + what + ")" : "All " + FIRMS.length + " firms";
    };
    choice("tf-mkt", MKTS, 0, (i) => { mk = i; apply(); });
    choice("tf-home", HOMES, 0, (i) => { hm = i; apply(); });
    apply();
  }

  // ---------- Revenue and people ----------
  if ($("chart-rp")) {
    // US$ bn; XTX converted from about £3.93bn, Optiver from €4.556bn at about $1.13 per euro
    const REV = [["Jane Street", 39.6], ["Hudson River Trading", 12.3], ["Citadel Securities", 12.2], ["XTX Markets", 5.2], ["Optiver", 5.15], ["IMC", 3.12]];
    const PER = [["XTX Markets", 5.2e3 / 250], ["Jane Street", 39.6e3 / 3500], ["Optiver", 5.15e3 / 2233], ["IMC", 3.12e3 / 1900]]; // $m per person
    let view = 0;
    const draw = () => {
      const rows = view === 0 ? REV : PER;
      const svg = $("chart-rp"), narrow = (Math.round(svg.getBoundingClientRect().width) || 640) < 460;
      const rowH = narrow ? 40 : 32, h = 24 + rows.length * rowH + 26, w = fit(svg, h);
      const pad = { l: narrow ? 10 : 160, r: 70, t: 14, b: 26 };
      const max = Math.max(...rows.map((r) => r[1]));
      const step = view === 0 ? 10 : 5, xMax = Math.ceil(max / step) * step;
      const sx = (x) => pad.l + (x / xMax) * (w - pad.l - pad.r);
      for (let x = 0; x <= xMax; x += step) {
        el("line", { x1: sx(x), x2: sx(x), y1: pad.t, y2: h - pad.b, class: x === 0 ? "axis" : "grid" }, svg);
        el("text", { x: sx(x), y: h - pad.b + 16, "text-anchor": "middle" }, svg).textContent = "$" + x + (view === 0 ? "bn" : "m");
      }
      rows.forEach(([name, v], i) => {
        const y = pad.t + i * rowH + (narrow ? 16 : 6), bh = narrow ? 16 : 20;
        if (narrow) el("text", { x: pad.l, y: y - 4, style: "fill:var(--text);font-weight:600" }, svg).textContent = name;
        else el("text", { x: pad.l - 8, y: y + bh / 2 + 4, "text-anchor": "end", style: "fill:var(--text);font-weight:600" }, svg).textContent = name;
        el("rect", { x: sx(0), y, width: Math.max(2, sx(v) - sx(0)), height: bh, rx: 3, fill: tone() }, svg);
        el("text", { x: sx(v) + 6, y: y + bh / 2 + 4, style: "fill:var(--text)" }, svg).textContent = "$" + (view === 0 ? v.toFixed(1) + "bn" : v.toFixed(1) + "m");
      });
      $("rp-story").textContent = view === 0
        ? "Jane Street's reported $39.6bn is more than three times the next firms, Hudson River Trading and Citadel Securities at about $12bn each. XTX and Optiver are close to each other at about $5bn. Jump and Susquehanna are large too, but don't publish results."
        : "Per person, XTX stands out: about $21m of revenue for each of its roughly 250 employees, almost twice Jane Street's $11m. The options houses, Optiver and IMC, make around $2m per person, which is still far above a typical bank. Small teams plus huge computing power is the industry's business model.";
    };
    choice("rp-view", ["Total revenue", "Revenue per employee"], 0, (i) => { view = i; draw(); });
    onResize("chart-rp", draw);
    H.charts(draw);
  }
})();