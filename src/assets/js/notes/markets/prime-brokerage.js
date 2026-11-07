// Charts for the note "Prime Brokerage" (Markets · How Markets Work).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  // $ amounts: "$240k", "$1.2m"
  const usd = (v) => (v >= 1e6 ? "$" + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "m" : "$" + Math.round(v / 1000) + "k");
  const usdTex = (v) => usd(v).replace("$", "\\$");

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

  // ---------- What does a prime broker earn from a fund? ----------
  if (has("chart-rev")) {
    const AUMS = [50, 100, 200, 500, 1000, 2000, 5000];     // $ millions
    const MARKUP = 0.003, COMM = 0.0002, TURNS = 4, MINIMUM = 300000;
    const spreadBp = (a) => (a <= 100 ? 75 : a >= 2000 ? 35 : 75 - (40 * Math.log(a / 100)) / Math.log(20));
    const draw = () => {
      const a = AUMS[parseInt($("rev-aum").value, 10)];
      const G = parseInt($("rev-g").value, 10), N = Math.min(parseInt($("rev-n").value, 10), G);
      $("rev-aum-out").textContent = a >= 1000 ? "$" + a / 1000 + "bn" : "$" + a + "m";
      $("rev-g-out").textContent = G + "%";
      $("rev-n-out").textContent = N + "%";
      const A = a * 1e6;
      const longs = ((G + N) / 200) * A, shorts = ((G - N) / 200) * A;
      const loan = Math.max(0, longs - A), s = spreadBp(a);
      const rows = [
        { n: "Financing spread", v: (loan * s) / 10000, solid: true },
        { n: "Borrow markup", v: shorts * MARKUP, solid: true },
        { n: "Commissions", v: (G / 100) * A * TURNS * COMM, solid: false },
      ];
      const base = rows.reduce((t, r) => t + r.v, 0);
      rows.push({ n: "Minimum top-up", v: Math.max(0, MINIMUM - base), solid: false, dark: true });
      const total = base + rows[3].v;

      const t = tone(), g = grey();
      const svg = $("chart-rev"), W = 640;
      svg.textContent = "";
      const x0 = 150, x1 = 560, rowH = 44, top = 18;
      const sx = (v) => x0 + (v / total) * (x1 - x0);
      rows.concat([{ n: "Total", v: total, total: true }]).forEach((r, i) => {
        const y = top + i * rowH;
        el("text", { x: 16, y: y + 19, style: r.total ? "font-weight:600;fill:var(--text)" : "" }, svg).textContent = r.n;
        if (r.total) {
          // Total bar is made of the four parts, side by side
          let at = x0;
          rows.forEach((p) => {
            const w = sx(p.v) - x0;
            if (w > 0.5) el("rect", { x: at, y: y + 4, width: w, height: 22, fill: p.solid ? t : g, "fill-opacity": p.solid ? (p.n === "Financing spread" ? 1 : 0.55) : p.dark ? 0.9 : 0.4 }, svg);
            at += w;
          });
        } else if (r.v > 0) {
          el("rect", { x: x0, y: y + 4, width: Math.max(2, sx(r.v) - x0), height: 22, rx: 4, fill: r.solid ? t : g, "fill-opacity": r.solid ? (i === 0 ? 1 : 0.55) : r.dark ? 0.9 : 0.4 }, svg);
        }
        el("text", { x: (r.v > 0 ? sx(r.v) : x0) + 8, y: y + 19, style: r.total ? "font-weight:600;fill:var(--text)" : "" }, svg).textContent = r.v > 0 ? usd(r.v) : "none";
      });

      const bp = (total / A) * 10000;
      const out = $("rev-read"); out.textContent = "";
      const ra = document.createElement("span"), rb = document.createElement("span"); out.append(ra, rb);
      tex(ra, "\\text{Total: } " + usdTex(total) + "\\text{ a year} = " + bp.toFixed(0) + "\\text{ bp of the fund}");
      tex(rb, "\\text{Borrowing } " + usdTex(loan) + "\\text{ at SOFR} + " + s.toFixed(0) + "\\text{ bp}");

      const biggest = rows.slice(0, 3).reduce((m, r) => (r.v > m.v ? r : m));
      let story;
      if (rows[3].v > 0) story = "This fund is too small to generate the minimum on its own, so it pays a " + usd(rows[3].v) + " top-up for nothing extra. That's one reason launching a small fund is expensive: the prime broker still needs it to be worth its while.";
      else if (loan === 0) story = "With net exposure this low, the short sales roughly pay for the longs, so the fund barely borrows any money. The prime broker earns from lending shares and from trading instead.";
      else story = "The biggest line here is " + biggest.n.toLowerCase() + ". " + (biggest.n === "Borrow markup" ? "For a long/short fund, lending shares is often worth more to the PB than lending money." : biggest.n === "Commissions" ? "A fund that trades a lot is valuable to its PB even without much borrowing." : "Funds that borrow a lot to run net long are the classic financing clients.") + " Bigger funds pay a smaller spread: try moving the size.";
      $("rev-story").textContent = story;
    };
    ["rev-aum", "rev-g", "rev-n"].forEach((id) => $(id).addEventListener("input", draw));
    H.charts(draw);
  }

  // ---------- Your prime broker goes bust ----------
  if (has("chart-fail")) {
    const COUNTS = [{ n: "One PB", k: 1 }, { n: "Two PBs", k: 2 }, { n: "Three PBs", k: 3 }];
    const TOTAL = 1000; // $ millions
    let ci = 0;
    const money = (m) => (m >= 999.5 ? "$1bn" : "$" + Math.round(m) + "m");
    const draw = () => {
      const k = COUNTS[ci].k, r = parseInt($("fail-r").value, 10) / 100;
      $("fail-r-out").textContent = Math.round(r * 100) + "%";
      const per = TOTAL / k, claim = per * r, frozen = per - claim, usable = TOTAL - per;
      const t = tone(), g = grey();
      const svg = $("chart-fail"), W = 640;
      svg.textContent = "";
      const base = 190, maxH = 150, gap = 24, left = 40, right = 600;
      const colW = (right - left - gap * (k - 1)) / k;
      const hOf = (v) => (v / TOTAL) * maxH;
      for (let i = 0; i < k; i++) {
        const x = left + i * (colW + gap), cx = x + colW / 2;
        if (i === 0) {
          // The failed PB: frozen on top, reused (now a claim) underneath
          const hc = hOf(claim), hf = hOf(frozen);
          if (hc > 0) el("rect", { x, y: base - hc, width: colW, height: hc, fill: g, "fill-opacity": 0.75 }, svg);
          if (hf > 0) el("rect", { x, y: base - hc - hf, width: colW, height: hf, fill: g, "fill-opacity": 0.25 }, svg);
          // Name each part, where there's room
          if (hc >= 18) el("text", { x: cx, y: base - hc / 2 + 4, "text-anchor": "middle", style: "fill:var(--text)" }, svg).textContent = "claim " + money(claim);
          if (hf >= 18) el("text", { x: cx, y: base - hc - hf / 2 + 4, "text-anchor": "middle", style: "fill:var(--text)" }, svg).textContent = "frozen " + money(frozen);
          el("rect", { x, y: base - hOf(per), width: colW, height: hOf(per), fill: "none", stroke: g, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
          el("text", { x: cx, y: base - hOf(per) - 10, "text-anchor": "middle", style: "font-weight:600;fill:var(--text)" }, svg).textContent = "Fails: " + money(per);
        } else {
          el("rect", { x, y: base - hOf(per), width: colW, height: hOf(per), rx: 4, fill: t }, svg);
          el("text", { x: cx, y: base - hOf(per) - 10, "text-anchor": "middle", style: "fill:" + t }, svg).textContent = "Fine: " + money(per);
        }
        el("text", { x: cx, y: base + 20, "text-anchor": "middle" }, svg).textContent = "Prime broker " + (i + 1);
      }

      const out = $("fail-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Usable today: } \\$" + Math.round(usable) + "\\text{m } (" + Math.round((usable / TOTAL) * 100) + "\\%)");
      tex(b, "\\text{Frozen: } \\$" + Math.round(frozen) + "\\text{m} \\quad \\text{Claim: } \\$" + Math.round(claim) + "\\text{m}");

      let story;
      if (k === 1) story = "Everything was at one prime broker, so the whole fund stops. It can't trade, can't meet its own investors' withdrawals, and has to wait for administrators to sort out what's whose. " + (r > 0 ? "The " + Math.round(r * 100) + "% the PB had reused isn't in the account at all: the fund is just another creditor for that part. This is what happened to some Lehman clients in 2008." : "Even with nothing reused, getting assets back out of a bankruptcy can take months.");
      else story = "With " + k + " prime brokers, " + Math.round((usable / TOTAL) * 100) + "% of the fund keeps working while the failed broker's part is sorted out. That's the case for multi-prime: it costs more to run, but no single bank can freeze the whole fund." + (r >= 0.5 ? " Limiting how much each PB can reuse shrinks the dark part too." : "");
      $("fail-story").textContent = story;
    };
    buttons("fail-n", COUNTS, (i) => { ci = i; draw(); }, 0);
    $("fail-r").addEventListener("input", draw);
    H.charts(draw);
  }
})();