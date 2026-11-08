// Interactive for the note "Raising Capital" (Hedge Funds · The Hedge Fund Business).
// "Pitch to an allocator": a first-screen checklist built in HTML, so it reads well on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $ } = H;
  if (!$("rc-checks")) return;

  // Typical rules of thumb for each kind of allocator ($ millions)
  const WHO = [
    { n: "Pension fund", key: "pension", plural: "pension funds", minA: 500, minY: 3, inst: true, s: 0.1, tMin: 50, tMax: 200, time: "6 to 18 months" },
    { n: "Endowment", key: "endowment", plural: "endowments", minA: 250, minY: 2, inst: true, s: 0.15, tMin: 20, tMax: 100, time: "3 to 12 months" },
    { n: "Sovereign wealth fund", key: "swf", plural: "sovereign wealth funds", minA: 1000, minY: 3, inst: true, s: 0.1, tMin: 100, tMax: 500, time: "6 to 24 months" },
    { n: "Family office", key: "family", plural: "family offices", minA: 25, minY: 1, inst: false, s: 0.2, tMin: 5, tMax: 50, time: "1 to 6 months" },
    { n: "Fund of funds", key: "fof", plural: "funds of funds", minA: 100, minY: 1, inst: true, s: 0.15, tMin: 10, tMax: 50, time: "1 to 3 months" },
    { n: "Insurer", key: "insurer", plural: "insurers", minA: 1000, minY: 5, inst: true, s: 0.1, tMin: 50, tMax: 200, time: "6 to 18 months" },
  ];
  const SIZES = [25, 50, 100, 250, 500, 1000, 2500, 5000];
  const OPS = [{ n: "Basic set-up", inst: false }, { n: "Institutional-grade", inst: true }];
  let wi = 0, oi = 0;

  const money = (v) => (v >= 1000 ? "$" + (v / 1000).toFixed(1).replace(/\.0$/, "") + "bn" : "$" + Math.round(v) + "m");
  const yrs = (y) => y + (y === 1 ? " year" : " years");

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

  // The four first-screen checks for one allocator
  const screen = (w, A, Y, inst) => {
    const maxCheque = (w.s * A) / (1 - w.s);
    return [
      { ok: A >= w.minA, t: "Fund size", why: "They usually want " + money(w.minA) + "+ before looking.", val: money(A) },
      { ok: Y >= w.minY, t: "Track record", why: "They usually want " + yrs(w.minY) + "+ of real results.", val: yrs(Y) },
      { ok: inst || !w.inst, t: "Operations", why: w.inst ? "Independent administrator, recognised auditor, compliance, proper controls." : "Nice to have, but they'll judge you more on the person.", val: inst ? "Institutional" : "Basic" },
      { ok: maxCheque >= w.tMin, t: "Cheque size", why: "Staying under " + Math.round(w.s * 100) + "% of your fund, they could put in " + money(maxCheque) + "; they rarely bother below " + money(w.tMin) + ".", val: money(maxCheque) },
    ];
  };

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  const draw = () => {
    const A = SIZES[parseInt($("rc-aum").value, 10)], Y = parseInt($("rc-yrs").value, 10), inst = OPS[oi].inst;
    $("rc-aum-out").textContent = money(A);
    $("rc-yrs-out").textContent = yrs(Y);
    const w = WHO[wi], checks = screen(w, A, Y, inst);

    const list = $("rc-checks");
    list.textContent = "";
    checks.forEach((c) => {
      const li = el("li", c.ok ? "pass" : "fail");
      li.append(el("span", "mark", c.ok ? "✓" : "✗"));
      const mid = el("span"); mid.append(el("b", "", c.t), el("span", "why", c.why));
      li.append(mid, el("span", "val", c.val));
      list.append(li);
    });

    const fails = checks.filter((c) => !c.ok);
    const box = $("rc-verdict");
    box.textContent = "";
    if (!fails.length) {
      const cheque = Math.min(w.tMax, (w.s * A) / (1 - w.s));
      box.className = "rc-verdict";
      box.append(el("b", "", "Through to due diligence. "), document.createTextNode("Expect " + w.time + " of investment, operational and legal checks. If it goes well, a likely first cheque is up to " + money(cheque) + "."));
      return;
    }
    // Who might say yes to this fund right now?
    const yes = WHO.filter((x) => screen(x, A, Y, inst).every((c) => c.ok)).map((x) => x.plural);
    const fix = fails.map((c) => c.t.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " and $1");
    box.className = "rc-verdict no";
    box.append(el("b", "", "Not yet. "), document.createTextNode("This " + w.n.toLowerCase() + " would stop at " + fix + ". " +
      (yes.length
        ? "Who might say yes now: " + yes.join(", ").replace(/, ([^,]*)$/, " and $1") + ". Start there, grow, and come back."
        : "Nobody on this list would invest yet. The usual routes are your own money and wealthy contacts, a seeder or an anchor investor, then a few years of record.")));
  };

  buttons("rc-who", WHO, (i) => { wi = i; draw(); }, wi);
  buttons("rc-ops", OPS, (i) => { oi = i; draw(); }, oi);
  ["rc-aum", "rc-yrs"].forEach((id) => $(id).addEventListener("input", draw));
  draw();
})();