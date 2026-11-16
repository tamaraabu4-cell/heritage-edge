// Interactives for the note "Inside a Trading Desk" (Quant · Quant Trading Firms).
// The waterfall is drawn at its real width, so the labels stay readable on a phone.
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
  const unpress = (boxId) => [...$(boxId).children].forEach((c) => c.setAttribute("aria-pressed", "false"));
  const span = (box, text) => { const s = document.createElement("span"); s.textContent = text; box.append(s); return s; };
  const m = (v) => (v < -0.005 ? "−" : "") + Math.abs(v).toFixed(1) + "m";
  const n = (v) => Math.round(v).toLocaleString("en-GB");

  // ---------- What does the desk keep? ----------
  if ($("chart-dk")) {
    const IDS = ["dk-g", "dk-t", "dk-c", "dk-p", "dk-o"];
    const BASE = [3.0, 2.2, 4.0, 0.8]; // Deltashark's cost split, total 10
    const scaled = (g, total) => [g].concat(BASE.map((c) => Math.round((c * total) / 10 * 10) / 10));
    const PRESETS = [
      { b: "Deltashark's desk", v: [12, 3.0, 2.2, 4.0, 0.8] },
      { b: "12 against 7", v: scaled(12, 7) },
      { b: "8 against 2", v: scaled(8, 2) },
    ];
    const draw = () => {
      const [g, t, c, p, o] = IDS.map((id) => parseFloat($(id).value));
      IDS.forEach((id) => { $(id + "-out").textContent = parseFloat($(id).value).toFixed(1); });
      const costs = [["Tech, data", t], ["Clearing", c], ["Pay", p], ["Overhead", o]];
      const total = t + c + p + o, net = g - total;

      const svg = $("chart-dk"), w = fit(svg, 260), h = 260;
      const narrow = w < 460;
      const pad = { l: 40, r: 10, t: 32, b: narrow ? 46 : 36 };
      const top = Math.max(g, 1), low = Math.min(0, net);
      const step = top > 10 ? 4 : 2, y1 = Math.ceil(top / step) * step, y0 = Math.floor(low / step) * step;
      const sy = (v) => pad.t + ((y1 - v) / (y1 - y0)) * (h - pad.t - pad.b);
      for (let v = y0; v <= y1; v += step) {
        el("line", { x1: pad.l, x2: w - pad.r, y1: sy(v), y2: sy(v), class: v === 0 ? "axis" : "grid" }, svg);
        el("text", { x: pad.l - 6, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
      }
      el("text", { x: 4, y: 12 }, svg).textContent = "$ millions a year";
      const cols = [["Gross", g, 0, g, "gross"]];
      let level = g;
      costs.forEach(([lab, v]) => { cols.push([lab, -v, level - v, level, "cost"]); level -= v; });
      cols.push(["Kept", net, Math.min(0, net), Math.max(0, net), "net"]);
      const slot = (w - pad.l - pad.r) / cols.length, bw = slot * 0.62;
      cols.forEach(([lab, v, lo, hi, kind], i) => {
        const x = pad.l + slot * i + (slot - bw) / 2;
        const fill = kind === "cost" ? grey() : tone();
        el("rect", { x, y: sy(hi), width: bw, height: Math.max(1, sy(lo) - sy(hi)), rx: 3, fill, "fill-opacity": kind === "cost" ? 0.75 : 1 }, svg);
        if (i < cols.length - 1) {
          const yy = sy(kind === "gross" ? hi : lo); // joins this bar to the top of the next one
          el("line", { x1: x + bw, x2: x + slot, y1: yy, y2: yy, stroke: grey(), "stroke-dasharray": "3 3" }, svg);
        }
        const val = kind === "cost" ? "−" + Math.abs(v).toFixed(1) : (v < 0 ? "−" : "") + Math.abs(v).toFixed(1);
        el("text", { x: x + bw / 2, y: sy(hi) - 5, "text-anchor": "middle", style: "fill:var(--text);font-weight:600" }, svg).textContent = val;
        // on phones, alternate labels between two rows so neighbours don't collide
        el("text", { x: x + bw / 2, y: h - pad.b + 16 + (narrow && i % 2 ? 15 : 0), "text-anchor": "middle" }, svg).textContent = lab;
      });

      const out = $("dk-read"); out.textContent = "";
      span(out, "Costs: " + m(total) + " (" + Math.round((total / g) * 100) + "% of gross)");
      span(out, "Kept: " + m(net));
      span(out, "Kept per person: $" + n((net / 6) * 1e6));

      const biggest = costs.slice().sort((a, b) => b[1] - a[1])[0];
      const bigName = { "Tech, data": "technology and data", Clearing: "clearing and financing", Pay: "pay", Overhead: "overhead" }[biggest[0]];
      let story;
      if (net < 0) story = "The desk loses money: costs of " + m(total) + " are more than its " + m(g) + " gross. On a P&L report showing only gross, it would look like a profitable desk. This is the situation attribution exists to expose.";
      else if (total / g > 0.75) story = "The desk keeps only " + Math.round((net / g) * 100) + "% of what it grosses, about one pound in " + Math.round(g / Math.max(net, 0.01)) + ". The biggest bill is " + bigName + " (" + m(biggest[1]) + "). This is the infrastructure intensity of modern trading in one ratio: a small rise in costs, or a small fall in gross, could wipe the profit out.";
      else if (total / g < 0.35) story = "A lean desk: costs are only " + Math.round((total / g) * 100) + "% of gross, so it keeps " + m(net) + ". Compare it with Deltashark's 12-against-7 desk: a smaller gross can be the better business.";
      else story = "The desk keeps " + m(net) + " of its " + m(g) + " gross. Every new venue connection, data feed or hire has to earn more than it adds to the " + m(total) + " cost line.";
      $("dk-story").textContent = story;
    };
    choice("dk-pick", PRESETS.map((x) => x.b), 0, (i) => { IDS.forEach((id, k) => { $(id).value = PRESETS[i].v[k]; }); draw(); });
    IDS.forEach((id) => $(id).addEventListener("input", () => { unpress("dk-pick"); draw(); }));
    onResize("chart-dk", draw);
    H.charts(draw);
  }

  // ---------- Which control failed? ----------
  if ($("cf-list")) {
    const BOXES = ["Risk", "Operations", "Technology", "Compliance"];
    const CASES = [
      { n: "Barings Bank, 1995", d: "A trader in Singapore hid losing futures and options bets in a secret error account until losses of about £827 million broke Britain's oldest merchant bank.", ok: [1, 0], why: "Operations first: Nick Leeson ran both the trading and the back office that recorded and settled it, so nobody independent reconciled his books. Risk also failed to question how a supposedly low-risk arbitrage desk could make such large profits." },
      { n: "Société Générale, 2008", d: "A junior trader built up roughly €50 billion of unauthorised positions, hidden with fake offsetting trades. Unwinding them cost about €4.9 billion.", ok: [0, 1], why: "Risk and operations together: Jérôme Kerviel knew the back office's checks from his earlier job and timed fake trades to slip past them, while risk monitoring looked at his net position (which the fake trades made look small) rather than the real gross positions behind it." },
      { n: "Knight Capital, 2012", d: "A new software release went to seven of eight servers. Old code on the eighth started trading wildly at the open, losing about $440 million in 45 minutes.", ok: [2], why: "Technology: a manual deployment missed one server, and there was no automated check or quick kill switch to stop the runaway system. Knight needed a rescue within days. (More in Case Studies.)" },
      { n: "JPMorgan's \"London Whale\", 2012", d: "A huge credit derivatives position in the bank's investment office lost about $6.2 billion.", ok: [0], why: "Risk: a change to the VaR model roughly halved the measured risk of the position, limit breaches were waved through, and warnings didn't reach people independent enough to force the position down." },
      { n: "Precious metals spoofing, settled 2020", d: "Traders placed and cancelled large fake orders in gold, silver and Treasury futures over several years to move prices. The bank paid about $920 million.", ok: [3], why: "Compliance: surveillance of the bank's own order flow is meant to catch exactly this pattern of large orders cancelled before they trade, and for years it didn't." },
    ];
    const list = $("cf-list"), state = CASES.map(() => null);
    const score = () => {
      const done = state.filter((s) => s !== null).length, right = state.filter((s) => s === true).length;
      $("cf-score").textContent = done ? right + " of " + done + " right first time" + (done === CASES.length ? ". Not one of these started as a bad trading idea." : "") : "";
    };
    CASES.forEach((c, i) => {
      const li = document.createElement("li"); li.className = "cf-row";
      const p = document.createElement("p"); p.className = "cf-case";
      const s = document.createElement("strong"); s.textContent = c.n + ". ";
      p.append(s, document.createTextNode(c.d));
      const opts = document.createElement("div"); opts.className = "cf-opts"; opts.setAttribute("role", "group"); opts.setAttribute("aria-label", "Which control failed at " + c.n + "?");
      const why = document.createElement("p"); why.className = "cf-why"; why.hidden = true;
      BOXES.forEach((b, j) => {
        const btn = document.createElement("button"); btn.type = "button"; btn.textContent = b;
        btn.addEventListener("click", () => {
          const good = c.ok.includes(j);
          if (state[i] === null) state[i] = good;
          if (good) {
            [...opts.children].forEach((x, k) => { x.classList.toggle("right", c.ok.includes(k)); x.disabled = true; });
            why.textContent = "";
            const st = document.createElement("strong"); st.textContent = state[i] ? "Right. " : "Got there. ";
            why.append(st, document.createTextNode(c.why));
            why.hidden = false;
          } else { btn.classList.add("wrong"); btn.disabled = true; }
          score();
        });
        opts.append(btn);
      });
      li.append(p, opts, why); list.append(li);
    });
    score();
  }

  // ---------- Will this order get through? ----------
  if ($("ot-gates")) {
    const POS = 4700, LIMIT = 5000, LAST = 50, COLLAR = 0.02, MAXQ = 1000;
    let side = 0, kill = 0;
    const lo = LAST * (1 - COLLAR), hi = LAST * (1 + COLLAR);
    const draw = () => {
      const q = parseInt($("ot-q").value, 10), px = Math.round(parseFloat($("ot-p").value) * 100) / 100;
      $("ot-q-out").textContent = n(q); $("ot-p-out").textContent = px.toFixed(2);
      const buy = side === 0;
      const gates = [];
      let ok = true, sendQ = q;
      // 1 kill switch
      if (kill) { gates.push(["Kill switch", "fail", "On", "All trading is halted. Nothing leaves the building."]); ok = false; }
      else gates.push(["Kill switch", "pass", "Off", "Trading is allowed."]);
      // 2 size
      if (!ok) gates.push(["Order size", "skip", "Not checked", "Max " + n(MAXQ) + " contracts per order."]);
      else if (q > MAXQ) { gates.push(["Order size", "fail", "Too big", n(q) + " is over the " + n(MAXQ) + "-contract maximum. Likely a typo or a bug."]); ok = false; }
      else gates.push(["Order size", "pass", "OK", n(q) + " is within the " + n(MAXQ) + " maximum."]);
      // 3 price collar
      if (!ok) gates.push(["Price collar", "skip", "Not checked", "Allowed band " + lo.toFixed(2) + " to " + hi.toFixed(2) + "."]);
      else if (px < lo - 1e-9 || px > hi + 1e-9) { gates.push(["Price collar", "fail", "Outside band", px.toFixed(2) + " is more than 2% from the last trade at 50.00 (band " + lo.toFixed(2) + " to " + hi.toFixed(2) + ")."]); ok = false; }
      else gates.push(["Price collar", "pass", "OK", px.toFixed(2) + " is inside " + lo.toFixed(2) + " to " + hi.toFixed(2) + "."]);
      // 4 position limit
      const room = buy ? LIMIT - POS : LIMIT + POS;
      if (!ok) gates.push(["Position limit", "skip", "Not checked", "Limit ±" + n(LIMIT) + "; holding " + n(POS) + "."]);
      else if (q > room) { sendQ = room; gates.push(["Position limit", "cap", "Capped to " + n(room), n(POS) + (buy ? " + " : " − ") + n(q) + " would breach ±" + n(LIMIT) + ". Only " + n(room) + " fit."]); }
      else gates.push(["Position limit", "pass", "OK", "New position " + n(buy ? POS + q : POS - q) + ", inside ±" + n(LIMIT) + "."]);

      const box = $("ot-gates"); box.textContent = "";
      gates.forEach(([title, cls, st, why]) => {
        const d = document.createElement("div"); d.className = "ot-gate " + cls;
        const t = document.createElement("strong"); t.textContent = title;
        const s = document.createElement("span"); s.className = "st"; s.textContent = (cls === "pass" ? "✓ " : cls === "fail" ? "✗ " : cls === "cap" ? "↓ " : "") + st;
        const p = document.createElement("div"); p.textContent = why;
        d.append(t, s, p); box.append(d);
      });

      const after = ok ? (buy ? POS + sendQ : POS - sendQ) : POS;
      const pct = (v) => Math.max(0, Math.min(100, (v / LIMIT) * 100 * 0.9));
      $("ot-now").style.width = pct(Math.min(POS, after)) + "%";
      $("ot-add").style.left = pct(Math.min(POS, after)) + "%";
      $("ot-add").style.width = Math.abs(pct(after) - pct(POS)) + "%";
      $("ot-add").style.opacity = after > POS ? 1 : 0.25;
      $("ot-lim").style.left = pct(LIMIT) + "%";
      $("ot-pos-label").textContent = "Position: " + n(POS) + " now → " + n(after) + " after this order (limit " + n(LIMIT) + ", the black line)";

      $("ot-result").textContent = ok ? "Sent: " + (buy ? "buy " : "sell ") + n(sendQ) + " at " + px.toFixed(2) + (sendQ < q ? " (cut from " + n(q) + ")" : "") : "Rejected before reaching the exchange";
      let story;
      if (kill) story = "The kill switch overrides everything. Desks use it when an algorithm misbehaves, a feed breaks or a limit is badly breached: stop first, investigate after.";
      else if (q > MAXQ) story = "A maximum order size catches fat fingers and bugs: a strategy that suddenly wants " + n(q) + " contracts is more likely broken than brilliant.";
      else if (!ok) story = "The price collar stops orders far from the market, such as a sell typed as 45.00 instead of 49.50, or a strategy reading a stale price. Deltashark's quick check: the highest permissible buy is 50.00 × 1.02 = 51.00.";
      else if (sendQ < q) story = "This is Deltashark's example: 4,700 + " + n(q) + " would break the 5,000 limit, so the code cuts the order to " + n(sendQ) + " before any exchange sees it. At machine speeds, a rule enforced after the fact is a rule broken first.";
      else if (!buy) story = "Selling moves the position away from the long limit, so the position check passes easily. (A desk also has a short limit: it could sell up to " + n(LIMIT + POS) + " before reaching −5,000, though the size check stops any single order above 1,000.)";
      else story = "Everything passes and the order goes to the exchange. Every one of these checks ran in microseconds, in code, before the order left the firm.";
      $("ot-story").textContent = story;
    };
    choice("ot-side", ["Buy", "Sell"], 0, (i) => { side = i; draw(); });
    choice("ot-kill", ["Kill switch off", "Kill switch on"], 0, (i) => { kill = i; draw(); });
    ["ot-q", "ot-p"].forEach((id) => $(id).addEventListener("input", draw));
    draw();
  }
})();