// Interactive for the note "Regulation" (Markets · How Markets Work).
// Builds a small HTML table rather than an SVG chart, so it stays readable on a phone.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $ } = H;
  if (!document.getElementById("rule-grid")) return;

  const FIRMS = [
    { n: "Mutual fund", who: "A mutual fund (in the UK and EU, a UCITS fund) takes money from ordinary savers, so the rules are strict: savers must be able to get their money back quickly, and the fund can't take big risks with it." },
    { n: "Hedge fund", who: "A hedge fund only takes money from professional and wealthy investors, who are expected to understand the risks. So it's left free to borrow, short and lock money in, but it must still register, report and obey market abuse law." },
    { n: "Bank", who: "A bank holds ordinary people's deposits, and its failure can hurt the whole economy, so it's the most tightly controlled of all: capital rules, stress tests, and limits on betting its own money." },
    { n: "Prop firm", who: "A proprietary trading firm (Jane Street, Optiver, XTX) trades only its own money, with no outside investors to protect. It's regulated mainly through the exchanges, its clearing firms and market abuse rules." },
  ];
  // [action, [mutual fund, hedge fund, bank, prop firm]], each cell: [mark, reason]
  const Y = "✓", N = "✗", L = "◐", X = "—";
  const ROWS = [
    ["Take money from the general public", [
      [Y, "That's its whole purpose: anyone can invest."],
      [N, "Only professional or wealthy investors, usually with high minimum investments."],
      [Y, "Deposits from anyone, protected by deposit insurance (£85,000 in the UK)."],
      [N, "No outside money at all: it trades its own capital."]]],
    ["Borrow to run 3× leverage or more", [
      [N, "Leverage is tightly capped."],
      [Y, "Limited by what its prime broker will lend, not by a regulator."],
      [L, "Banks are leveraged by nature, but Basel III caps it (the 3% leverage ratio)."],
      [Y, "Limited by its own risk appetite and exchange and clearing margins."]]],
    ["Sell shares short", [
      [L, "UCITS funds can't short directly; some can use derivatives to get similar exposure."],
      [Y, "A core part of most strategies."],
      [L, "For market making and hedging clients, not as a bet."],
      [Y, "Market makers short all day to stay balanced."]]],
    ["Bet its own money on where prices go", [
      [X, "It invests clients' money under a written mandate, not its own."],
      [Y, "That's the job, with clients' money, under the fund's stated strategy."],
      [N, "Banned for big US banks by the Volcker Rule; kept out of UK retail banks by ring-fencing."],
      [Y, "That's the business."]]],
    ["Lock investors' money in for a year", [
      [N, "Most must let investors take money out daily."],
      [Y, "Lock-ups, notice periods and \"gates\" that limit withdrawals are common."],
      [X, "Not relevant: depositors can withdraw, which is why banks must hold liquid assets."],
      [X, "Not relevant: no outside investors."]]],
    ["Keep its holdings private", [
      [N, "Must publish its holdings regularly."],
      [L, "Mostly private, but big US long holdings appear on 13F every quarter, and large shorts are reported."],
      [L, "Detailed reporting to regulators, plus public capital and risk disclosures."],
      [Y, "Private, apart from reports to regulators and exchanges."]]],
  ];
  let fi = 1;

  const draw = () => {
    const tbl = $("rule-grid");
    tbl.textContent = "";
    const head = tbl.createTHead().insertRow();
    ["Can it…", ...FIRMS.map((f) => f.n)].forEach((h, i) => {
      const th = document.createElement("th");
      th.textContent = h;
      if (i - 1 === fi) th.style.color = "var(--tone)";
      head.appendChild(th);
    });
    const body = tbl.createTBody();
    ROWS.forEach(([action, cells]) => {
      const tr = body.insertRow();
      tr.insertCell().textContent = action;
      cells.forEach(([mark], i) => {
        const td = tr.insertCell();
        td.textContent = mark;
        td.className = "mark" + (i === fi ? " on" : "");
        td.title = { "✓": "Yes", "✗": "No", "◐": "Limited", "—": "Doesn't apply" }[mark];
      });
    });
    const story = $("rule-story");
    story.textContent = "";
    const p = document.createElement("span");
    p.textContent = FIRMS[fi].who + " ";
    story.appendChild(p);
    const ul = document.createElement("ul");
    ROWS.forEach(([action, cells]) => {
      const li = document.createElement("li");
      li.textContent = cells[fi][0] + " " + action + ": " + cells[fi][1];
      ul.appendChild(li);
    });
    story.appendChild(ul);
  };

  const box = $("rule-firm");
  FIRMS.forEach((f, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = f.n;
    b.setAttribute("aria-pressed", i === fi ? "true" : "false");
    b.addEventListener("click", () => {
      [...box.children].forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
      fi = i;
      draw();
    });
    box.appendChild(b);
  });
  draw();
})();