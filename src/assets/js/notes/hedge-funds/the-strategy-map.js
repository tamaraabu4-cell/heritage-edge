// Interactives for the note "The Strategy Map" (Hedge Funds · Strategies).
// Both are built in HTML, so they read well on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $ } = H;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  // ---------- The strategy spectrum ----------
  if ($("sm-track")) {
    const FAMS = [
      { n: "Global macro", sub: "Most directional", like: "Like a weather forecaster betting on the whole season, not one day.",
        how: "Bets on whole economies through currencies, interest rates, bonds, commodities and stock indices, based on views about growth, inflation, central banks and politics.",
        net: "Anything: big long or short bets, in any market", risk: "Policy surprises, the regime changing, being early",
        day: "Central banks, data releases, trade flows, politics, yield curves", names: "Soros (Quantum), Tudor Investment, Brevan Howard, Bridgewater (systematic)",
        link: "FX is often the biggest part of a macro book; gold and government bonds are core tools." },
      { n: "Long/short equity", sub: "Usually net long", like: "Like backing the strongest runners and betting against the weakest, in any race.",
        how: "Buys shares it thinks are too cheap and shorts ones it thinks are too expensive. The shorts both make money and cancel some of the market's direction.",
        net: "Usually 20–70% net long", risk: "Picking wrong, crowded trades, short squeezes, style rotations",
        day: "Financial models, company meetings, industry experts, investment memos", names: "Viking Global, Lone Pine, Tiger Global, Coatue",
        link: "Mostly shares; FX appears as currency risk on foreign stocks, often hedged." },
      { n: "Event-driven", sub: "Depends on the event", like: "Like betting on whether a house sale will complete, after the offer is accepted.",
        how: "Trades around company events: takeovers (merger arbitrage), spin-offs, restructurings, activist campaigns. The return comes from the event happening, or not.",
        net: "Depends on the event", risk: "The deal breaking: small gains if it completes, big losses if it fails",
        day: "Merger documents, regulators, competition rules, legal timetables, deal odds", names: "Elliott, Third Point, Pershing Square (activist side)",
        link: "Cross-border deals carry currency risk; distressed events overlap with bonds." },
      { n: "Credit and distressed", sub: "Usually long", like: "Like lending to a friend, or buying their IOUs cheap from others when they hit hard times.",
        how: "Buys corporate debt across the range, from safe bonds to the debt of companies in or near bankruptcy, aiming to earn interest or buy cheaply before a recovery.",
        net: "Usually long, with some shorts (often through credit default swaps)", risk: "Defaults, recovering less than expected, hard-to-sell bonds",
        day: "Bond documents, balance sheets, bankruptcy law, recovery analysis", names: "Oaktree, Elliott, Apollo (credit), Davidson Kempner",
        link: "All bonds: spreads over government bonds, and the effect of interest rates on what debt is worth." },
      { n: "Relative value", sub: "Near zero net", like: "Like buying a ticket from one tout and selling it to another for slightly more, again and again.",
        how: "Buys one security and sells a closely related one when their prices drift apart, profiting as the gap closes. Small gaps need borrowed money to be worth trading.",
        net: "Close to zero", risk: "The gap widening, borrowing being pulled, everyone exiting at once (LTCM)",
        day: "Pricing models, financing costs, spreads between related securities", names: "Citadel and Millennium RV pods, D.E. Shaw, Capula",
        link: "Fixed income arbitrage and the Treasury basis trade are bond RV; gold and silver can be traded against each other." },
    ];
    const QUANT = { n: "Quant", sub: "Varies", like: "Like a casino: a tiny edge on each bet, repeated thousands of times.",
      how: "Computer models find patterns in data (trends, cheapness, momentum, short-term price gaps) and trade them, often across thousands of positions at once.",
      net: "Varies: trend following is directional, statistical arbitrage is neutral", risk: "The pattern fading once others find it, overfitting the past, crowding (the 2007 quant quake)",
      day: "Writing code, testing signals, cleaning data, machine learning", names: "Renaissance, Two Sigma, D.E. Shaw, AQR, Man AHL",
      link: "Trend followers trade FX, gold and bond futures; quant FX and rates signals are a major area." };
    let pick = 0;
    const show = (f) => {
      const card = $("sm-card"); card.textContent = "";
      card.append(make("h4", "", f.n), make("p", "like", f.like));
      const dl = make("dl");
      [["How it works", f.how], ["Net exposure", f.net], ["Biggest risk", f.risk], ["Your day", f.day], ["Well-known names", f.names], ["FX, gold and bonds", f.link]]
        .forEach(([k, v]) => dl.append(make("dt", "", k), make("dd", "", v)));
      card.append(dl);
    };
    const all = [];
    const chip = (f, parent) => {
      const b = make("button", "sm-chip", f.n);
      b.type = "button";
      b.append(make("span", "", f.sub));
      b.addEventListener("click", () => { all.forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); show(f); });
      parent.append(b); all.push(b);
      return b;
    };
    FAMS.forEach((f) => chip(f, $("sm-track")));
    chip(QUANT, $("sm-side"));
    all.forEach((x, i) => x.setAttribute("aria-pressed", i === pick ? "true" : "false"));
    show(FAMS[pick]);
  }

  // ---------- Pick the weather ----------
  if ($("wx-grid")) {
    const STRATS = ["Long/short equity", "Global macro", "Trend following (CTAs)", "Event-driven", "Relative value", "Credit (long-biased)", "Distressed", "Quant / stat arb", "Multi-strategy"];
    // For each regime: best (win) and worst (lose) strategies, with a short reason for each
    const REG = [
      { n: "Calm bull market", why: "Rising prices and low volatility reward funds that are net long, while quiet markets squeeze the gaps relative value trades and give trend followers little to ride.",
        win: { "Long/short equity": "Net long in a rising market; activists' campaigns land", "Event-driven": "Deals get done; activists push changes through" },
        lose: { "Relative value": "Price gaps too tight to earn much", "Trend following (CTAs)": "Small, choppy moves; few strong trends" } },
      { n: "Crash", why: "In a crisis, persistent falls reward anyone who can bet on direction, and punish funds that are long.",
        win: { "Global macro": "Can be short anything; big dislocations", "Trend following (CTAs)": "Ride the long falls; made money as a group in 2008" },
        lose: { "Long/short equity": "Net long: falls with the market", "Credit (long-biased)": "Spreads blow out; defaults rise" } },
      { n: "High volatility", why: "Volatility creates opportunities for nimble funds but whipsaws strategies that rely on borrowing and stable relationships between prices.",
        win: { "Global macro": "Big moves to trade", "Event-driven": "Wider deal spreads to buy" },
        lose: { "Quant / stat arb": "Relationships break; crowded exits", "Relative value": "Borrowed spread trades get squeezed" } },
      { n: "Rising rates", why: "When interest rates climb, bond prices fall: long-dated bonds lose most, while short-duration and floating-rate positions benefit.",
        win: { "Global macro": "Short bonds, especially long-dated ones", "Credit (long-biased)": "Floating-rate loans pay more as rates rise; long-dated bonds still suffer" },
        lose: { "Relative value": "Fixed income arbitrage hit by moving curves" } },
      { n: "Credit stress", why: "When companies start defaulting, the debt of good companies gets sold cheaply alongside the bad, creating deep-value opportunities for specialists.",
        win: { "Distressed": "Buy debt cheaply; restructurings create value; credit long/short can short the weak names" },
        lose: { "Credit (long-biased)": "Defaults and falling bond prices" } },
      { n: "Recovery", why: "As risk appetite returns, the most beaten-down and economy-sensitive assets bounce hardest, rewarding funds that take market risk.",
        win: { "Multi-strategy": "Many books benefit from the rebound", "Credit (long-biased)": "Spreads tighten from wide levels", "Long/short equity": "Small and cyclical names lead the bounce" },
        lose: { "Quant / stat arb": "Market-neutral books miss the rally", "Relative value": "Defensive, neutral positions lag" } },
    ];
    let ri = 1;
    const box = $("wx-pick");
    REG.forEach((r, i) => {
      const b = make("button", "", r.n); b.type = "button";
      b.setAttribute("aria-pressed", i === ri ? "true" : "false");
      b.addEventListener("click", () => { [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false")); ri = i; draw(); });
      box.append(b);
    });
    const draw = () => {
      const r = REG[ri], grid = $("wx-grid");
      $("wx-why").textContent = r.why;
      grid.textContent = "";
      // Winners first, then the middle, then the losers
      const rank = (s) => (r.win[s] ? 0 : r.lose[s] ? 2 : 1);
      STRATS.slice().sort((a, b) => rank(a) - rank(b)).forEach((s) => {
        const state = r.win[s] ? "win" : r.lose[s] ? "lose" : "mid";
        const t = make("div", "wx-tile " + state);
        const head = make("b", "", s);
        head.append(make("i", "", state === "win" ? "Best" : state === "lose" ? "Worst" : ""));
        t.append(head);
        if (state !== "mid") t.append(make("small", "", r.win[s] || r.lose[s]));
        grid.append(t);
      });
    };
    draw();
  }
})();