// Interactives for the note "What a Hedge Fund Is" (Hedge Funds · The Hedge Fund Business).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

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

  // ---------- Which door does your money come in by? ----------
  if (has("hf-map")) {
    const DOORS = [
      { n: "US family", box: "us", feeder: "on",
        story: "A wealthy US family pays US tax anyway, so it comes in through the onshore Delaware partnership. Gains and losses pass straight through to the family's own tax return, so long-term gains keep their lower tax rate." },
      { n: "US endowment", box: "exempt", feeder: "off",
        story: "A university endowment doesn't pay tax, but income from a partnership that borrows money could count as UBTI and be taxed. So it comes in through the offshore Cayman company, which blocks UBTI. Its money still ends up in the same master fund as the US family's." },
      { n: "UK pension fund", box: "nonus", feeder: "off",
        story: "A UK pension fund doesn't want to file US tax returns, so it uses the offshore feeder. Cayman doesn't tax the fund, so the pension is only taxed under UK rules. It might also choose a pound share class, so a falling dollar doesn't eat its returns." },
      { n: "Nigerian family office", box: "nonus", feeder: "off",
        story: "Like any investor outside the US, it comes in through the offshore Cayman feeder, and gets exactly the same portfolio and return before fees as the US family. The fund deals in dollars, so it needs dollars held outside Nigeria to invest." },
    ];
    const boxes = [...$("hf-map").querySelectorAll(".hf-box")];
    const show = (i) => {
      const d = DOORS[i];
      const on = new Set([d.box, d.feeder, "master", "mgr"]);
      boxes.forEach((b) => {
        const k = b.dataset.k;
        b.classList.toggle("on", on.has(k));
        b.classList.toggle("dim", !on.has(k) && k !== "svc");
      });
      $("door-story").textContent = d.story;
    };
    buttons("door-pick", DOORS, show, 0);
    show(0);
  }

  // ---------- Gated! ----------
  if (has("chart-gate")) {
    const NAV = 1000, D = 0.25; // $ millions; fire-sale discount on hard-to-sell assets
    const GATES = [{ n: "No gate", g: null }, { n: "25% gate", g: 0.25 }, { n: "10% gate", g: 0.1 }];
    let gi = 0;
    const m = (v) => "$" + Math.round(v) + "m";
    const mTex = (v) => "\\$" + Math.round(v) + "\\text{m}";

    const draw = () => {
      const i = parseInt($("gate-i").value, 10) / 100, r = parseInt($("gate-r").value, 10) / 100;
      $("gate-i-out").textContent = Math.round(i * 100) + "%";
      $("gate-r-out").textContent = Math.round(r * 100) + "%";
      const g = GATES[gi].g;
      const L0 = (1 - i) * NAV, I0 = i * NAV, R = r * NAV;
      const P = g === null ? R : Math.min(R, g * NAV);          // paid this quarter
      const Wt = R - P;                                          // waiting for later quarters
      const fromL = Math.min(P, L0), short = P - fromL;          // cash still needed after easy assets
      const X = short > 0 ? Math.min(I0, short / (1 - D)) : 0;   // hard-to-sell assets sold
      const loss = X * D, cantPay = short > I0 * (1 - D) + 0.001;
      const L1 = L0 - fromL, I1 = I0 - X, left = L1 + I1;

      const t = tone(), gr = grey(), line = colour("--text-2");
      // Drawn at the chart's real width, so the labels stay readable on a phone
      const svg = $("chart-gate");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = 232;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      svg.textContent = "";
      const x0 = 16, x1 = W - 16, sx = (v) => x0 + (v / NAV) * (x1 - x0);
      const rows = [{ y: 0, n: "Before" }, { y: 76, n: "Paid out now" }, { y: 152, n: "Left in the fund" }];
      rows.forEach((row) => el("text", { x: x0, y: row.y + 16, style: "fill:var(--text);font-weight:600" }, svg).textContent = row.n);
      const bar = (y, a, b, fill, op) => { if (b - a > 0.5) el("rect", { x: sx(a), y: y + 24, width: sx(b) - sx(a), height: 24, fill, "fill-opacity": op }, svg); };
      const dash = (y, a, b) => { if (b - a > 0.5) el("rect", { x: sx(a), y: y + 24, width: sx(b) - sx(a), height: 24, fill: "none", stroke: line, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg); };
      const note = (y, x, s) => el("text", { x, y: y + 66 }, svg).textContent = s;

      // Before
      bar(rows[0].y, 0, L0, t, 1);
      bar(rows[0].y, L0, NAV, gr, 0.75);
      note(rows[0].y, x0, m(L0) + " easy · " + m(I0) + " hard");

      // Paid out now, then what's still waiting
      bar(rows[1].y, 0, fromL, t, 1);
      bar(rows[1].y, fromL, P, gr, 0.75);
      dash(rows[1].y, P, R);
      note(rows[1].y, x0, P > 0 ? m(P) + " paid" + (Wt > 0.5 ? " · " + m(Wt) + " waiting" : "") : "Nobody leaving");

      // Left in the fund, then what the fire sale lost
      bar(rows[2].y, 0, L1, t, 1);
      bar(rows[2].y, L1, left, gr, 0.75);
      dash(rows[2].y, left, left + loss);
      note(rows[2].y, x0, m(left) + (loss > 0.5 ? " · " + m(loss) + " lost in the fire sale" : ""));

      const before = Math.round(i * 100), after = left > 0 ? Math.round((I1 / left) * 100) : 0;
      const hit = NAV - P > 0 ? (loss / (NAV - P)) * 100 : 0;
      const out = $("gate-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Paid now: } " + mTex(P) + (R > 0 ? "\\ (" + Math.round((P / R) * 100) + "\\%\\text{ of requests)}" : ""));
      tex(b, "\\text{Stayers lose: } " + hit.toFixed(1) + "\\% \\quad \\text{Hard to sell: } " + before + "\\% \\to " + after + "\\%");

      let story;
      if (cantPay) story = "Even selling everything it owns at fire-sale prices, the fund can't raise the cash. It would have to suspend withdrawals.";
      else if (R === 0) story = "Nobody's leaving this quarter, so nothing has to be sold. Try asking more investors to leave.";
      else if (loss > 0.5) story = (Wt > 0.5 ? "Even with the gate, the fund" : "The fund") + " ran out of easy-to-sell assets and had to dump " + m(X) + " of hard-to-sell ones for " + m(X - loss) + ". Leavers were paid at the old value; the " + m(loss) + " lost in the fire sale comes out of the investors who stay, a " + hit.toFixed(1) + "% hit they did nothing to deserve. Once investors see this coming, everyone wants to be first out. That's a run, and it's what a gate is for.";
      else if (Wt > 0.5) story = "The gate caps payouts at " + Math.round(g * 100) + "% of the fund, so each leaver gets " + Math.round((P / R) * 100) + "% of what they asked for now and the rest waits for later quarters. The stayers are protected: no fire sale. The leavers are stuck in a fund they wanted to leave, which is exactly what happened to many investors in 2008.";
      else if (after - before >= 10) story = "No fire sale: the fund paid everyone from its easy-to-sell assets. But look at what's left. Hard-to-sell assets were " + before + "% of the fund and are now " + after + "%. The fund sold its easiest assets first, so whoever asks to leave next quarter may find nothing easy left to sell.";
      else story = "A calm quarter: the fund paid everyone from its easy-to-sell assets and barely changed shape.";
      $("gate-story").textContent = story;
    };
    buttons("gate-pick", GATES, (k) => { gi = k; draw(); }, 0);
    ["gate-i", "gate-r"].forEach((id) => $(id).addEventListener("input", draw));
    let lastW = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($("chart-gate").getBoundingClientRect().width);
      if (w && w !== lastW) { lastW = w; draw(); }
    });
    H.charts(draw);
  }
})();