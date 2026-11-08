// Interactives for the note "How Central Banks Decide" (Macro · Central Banks and Rates).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour, frame } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");
  const fmt = (v, d = 2) => {
    const x = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    return (Object.is(x, -0) ? 0 : x).toString();
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
  const press = (boxId, i) => [...$(boxId).children].forEach((c, k) => c.setAttribute("aria-pressed", k === i ? "true" : "false"));

  // ---------- What would the Taylor Rule say? ----------
  if (has("chart-taylor")) {
    // Rounded, approximate inputs for each moment (see the note for sources)
    const PRESETS = [
      { n: "US, Sept 2026", r: 1.25, p: 3.1, g: 0, a: 3.875,
        story: "Core inflation around 3.1%, the economy roughly at full strength and a neutral real rate of about 1.25% (the Fed's own long-run estimate is 3.2% nominal, so about 1.2% real). The rule puts fed funds near 4.9%, about a point above the actual 3.75 to 4.00%. That's one way to see why the Fed hiked in September and why its dots point higher." },
      { n: "US, end of 2021", r: 0.5, p: 4.9, g: 0, a: 0.125,
        story: "Core inflation near 5%, unemployment back near normal, and rates still at zero. The rule says almost 7%. This is what 'behind the curve' looks like: the Fed was calling inflation transitory, then had to raise rates faster than at any time since the 1980s." },
      { n: "US, 2009", r: 1, p: 1.5, g: -6, a: 0.125,
        story: "Inflation below target and output about 6% below what the economy could produce. The rule wants a rate below zero, but banks can't easily push rates much under zero. That gap is why the Fed turned to QE: buying bonds to push longer-term rates down instead." },
      { n: "Deltashark example", r: 0.75, p: 3.5, g: -0.5, a: 5.25,
        story: "The Knowledge Check example: inflation 3.5%, a small output gap and a policy rate of 5.25%. The rule says 4.75%, so policy is about half a point tighter than the rule, which hints that cuts become more likely if inflation keeps easing." },
    ];
    let pi0 = 0;

    const read = () => ({
      r: parseFloat($("ty-r").value), p: parseFloat($("ty-pi").value),
      g: parseFloat($("ty-gap").value), a: parseFloat($("ty-act").value),
    });
    const setFrom = (P) => { $("ty-r").value = P.r; $("ty-pi").value = P.p; $("ty-gap").value = P.g; $("ty-act").value = P.a; };

    const draw = () => {
      const { r, p, g, a } = read();
      $("ty-r-out").textContent = fmt(r) + "%";
      $("ty-pi-out").textContent = fmt(p, 1) + "%";
      $("ty-gap-out").textContent = (g > 0 ? "+" : "") + fmt(g, 1) + "%";
      $("ty-act-out").textContent = fmt(a, 3) + "%";
      const steps = [
        { n: ["Neutral", "real rate"], m: ["r*"], v: r },
        { n: ["+ inflation"], m: ["+ π"], v: p },
        { n: ["+ ½ × inflation", "gap"], m: ["+ ½(π−2)"], v: 0.5 * (p - 2) },
        { n: ["+ ½ × output", "gap"], m: ["+ ½ gap"], v: 0.5 * g },
      ];
      const T = steps.reduce((s, x) => s + x.v, 0);

      // Running totals so the bars step up and down like a staircase
      let run = 0;
      const bars = steps.map((s) => { const from = run; run += s.v; return { ...s, from, to: run }; });
      bars.push({ n: ["Rule says"], m: ["Rule"], from: 0, to: T, total: true });
      const vals = bars.flatMap((b) => [b.from, b.to]).concat([a, 0]);
      const lo = Math.min(...vals), hi = Math.max(...vals);
      const yMin = Math.floor(Math.min(0, lo) - 0.5), yMax = Math.ceil(hi + 0.5);
      const span = yMax - yMin, st = span <= 8 ? 1 : span <= 14 ? 2 : 4;
      const yt = []; for (let v = Math.ceil(yMin / st) * st; v <= yMax; v += st) yt.push(v);

      const svg = $("chart-taylor");
      const W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640), HT = W < 480 ? 280 : 300;
      svg.setAttribute("viewBox", "0 0 " + W + " " + HT);
      const pad = { l: 40, r: 12, t: 22, b: W < 480 ? 34 : 48 };
      const s = frame(svg, W, HT, pad, [0, bars.length], [yMin, yMax], [], yt, (v) => v + "%");
      const t = tone(), gr = grey(), slot = (W - pad.l - pad.r) / bars.length, bw = Math.min(70, slot * 0.62);
      bars.forEach((b, i) => {
        const x = pad.l + slot * i + (slot - bw) / 2;
        const y1 = s.sy(Math.max(b.from, b.to)), y2 = s.sy(Math.min(b.from, b.to));
        const neg = b.to < b.from;
        if (neg) el("rect", { x, y: y1, width: bw, height: Math.max(1.5, y2 - y1), rx: 3, fill: gr, "fill-opacity": 0.3, stroke: gr, "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
        else el("rect", { x, y: y1, width: bw, height: Math.max(1.5, y2 - y1), rx: 3, fill: t, "fill-opacity": b.total ? 1 : 0.55 }, svg);
        if (i < bars.length - 1) el("line", { x1: x + bw, x2: x + slot, y1: s.sy(b.to), y2: s.sy(b.to), stroke: colour("--text-2"), "stroke-width": 1, "stroke-dasharray": "2 3" }, svg);
        const v = b.total ? b.to : b.to - b.from;
        el("text", { x: x + bw / 2, y: b.total && b.to < 0 ? y2 + 15 : y1 - 6, "text-anchor": "middle", style: "fill:var(--text);font-weight:600" }, svg).textContent = (b.total || v < 0 ? "" : "+") + fmt(v, 2).replace(/^(-?\d+)$/, "$1");
        // Labels under the bars: short symbols on a phone
        const lines = W < 480 ? b.m : b.n;
        lines.forEach((ln, k) => el("text", { x: x + bw / 2, y: HT - pad.b + 18 + k * 14, "text-anchor": "middle", style: (b.total ? "fill:var(--text);font-weight:600;" : "") + (W < 480 ? "font-size:11px" : "") }, svg).textContent = ln);
      });
      // The actual policy rate
      el("line", { x1: pad.l, x2: W - pad.r, y1: s.sy(a), y2: s.sy(a), stroke: colour("--text"), "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);

      const diff = a - T;
      const word = Math.abs(diff) < 0.25 ? "about where the rule says" : diff > 0 ? fmt(diff, 2) + " points tighter than the rule" : fmt(-diff, 2) + " points looser than the rule";
      const out = $("ty-read"); out.textContent = "";
      const x1 = document.createElement("span"), x2 = document.createElement("span"); out.append(x1, x2);
      tex(x1, "i = " + fmt(r) + " + " + fmt(p, 1) + " + 0.5(" + fmt(p, 1) + " - 2) + 0.5(" + fmt(g, 1) + ") = " + fmt(T, 2) + "\\%");
      tex(x2, "\\text{Policy is " + word + ". With } r^* \\pm 0.5\\text{: } " + fmt(T - 0.5, 2) + "\\% \\text{ to } " + fmt(T + 0.5, 2) + "\\%");

      const P = PRESETS[pi0];
      const same = P && Math.abs(P.r - r) < 1e-9 && Math.abs(P.p - p) < 1e-9 && Math.abs(P.g - g) < 1e-9 && Math.abs(P.a - a) < 1e-9;
      let story;
      if (same) story = P.story;
      else if (T < 0) story = "The rule wants a negative interest rate. In practice rates can't go far below zero, so a central bank in this spot reaches for other tools: promises to keep rates low (forward guidance) and buying bonds (QE).";
      else if (diff < -1) story = "The actual rate is well below what the rule suggests. Either the bank thinks inflation will fall by itself, or it's worried about something the rule can't see (a banking scare, a fragile jobs market). If it's wrong, it will have to catch up later.";
      else if (diff > 1) story = "The actual rate is well above the rule. The bank is squeezing harder than the formula says, perhaps to rebuild credibility after missing its target. If inflation keeps falling, markets will start to bet on cuts.";
      else story = "Policy is roughly where this simple rule would put it. Notice how much the answer moves if you change the neutral rate by half a point: nobody can measure it, which is why no central bank follows the rule mechanically.";
      $("ty-story").textContent = story;
    };

    buttons("ty-preset", PRESETS, (k) => { pi0 = k; setFrom(PRESETS[k]); draw(); }, 0);
    setFrom(PRESETS[0]);
    ["ty-r", "ty-pi", "ty-gap", "ty-act"].forEach((id) => $(id).addEventListener("input", () => { pi0 = -1; press("ty-preset", -1); draw(); }));
    let lastW = 0;
    window.addEventListener("resize", () => {
      const w = Math.round($("chart-taylor").getBoundingClientRect().width);
      if (w && w !== lastW) { lastW = w; draw(); }
    });
    H.charts(draw);
  }

  // ---------- Hawk or dove? ----------
  if (has("hd-box")) {
    // Made-up sentences in the style of a central bank statement, for practice
    const PAIRS = [
      { n: "Change 1", before: "The Committee will be patient as it determines future adjustments to the target range.",
        del: "will be patient as it determines future adjustments to", ins: "judges that some further firming of policy may be appropriate for",
        after: "The Committee judges that some further firming of policy may be appropriate for the target range.", ans: "hawk",
        why: "\"Patient\" meant no hurry to move. \"Further firming may be appropriate\" means more rate rises are on the table. Short-dated bond yields would jump and the currency would strengthen." },
      { n: "Change 2", before: "Inflation remains elevated.", del: "remains elevated", ins: "has eased somewhat but remains elevated",
        after: "Inflation has eased somewhat but remains elevated.", ans: "dove",
        why: "Three extra words admit progress on inflation. The bank is still worried, but less so: markets would read it as a small step towards stopping rate rises or cutting sooner." },
      { n: "Change 3", before: "Job gains have remained solid, and the unemployment rate has stayed low.",
        del: "have remained solid, and the unemployment rate has stayed low", ins: "have slowed, and the unemployment rate has moved up",
        after: "Job gains have slowed, and the unemployment rate has moved up.", ans: "dove",
        why: "The bank is now describing a weaker jobs market. Under a dual mandate, that's the other goal starting to matter, which makes cuts more likely." },
      { n: "Change 4", before: "The Committee judges that the risks to achieving its goals are roughly in balance.",
        del: "judges that the risks to achieving its goals are roughly in balance", ins: "is highly attentive to inflation risks",
        after: "The Committee is highly attentive to inflation risks.", ans: "hawk",
        why: "Balanced risks meant the bank could go either way. Singling out inflation risks says the next move is more likely up, or at least that cuts are off the table." },
      { n: "Change 5", before: "The Committee will continue reducing its holdings of government bonds.",
        del: "continue reducing", ins: "slow the pace of decline of",
        after: "The Committee will slow the pace of decline of its holdings of government bonds.", ans: "dove",
        why: "Shrinking the bond pile (QT) tightens conditions. Slowing it down means less tightening than before, so it's a dovish change even though rates didn't move." },
    ];
    let k = 0, picked = {};

    const show = () => {
      const P = PAIRS[k], box = $("hd-box");
      box.textContent = "";
      const pre = P.before.split(P.del);
      const p1 = document.createElement("p");
      p1.append(document.createTextNode(pre[0]));
      const d = document.createElement("del"); d.textContent = P.del; p1.append(d);
      const i = document.createElement("ins"); i.textContent = P.ins; p1.append(document.createTextNode(" "), i);
      p1.append(document.createTextNode(pre.slice(1).join(P.del)));
      box.append(p1);
      const guess = picked[k];
      [...$("hd-guess").children].forEach((b) => b.setAttribute("aria-pressed", guess && b.dataset.v === guess ? "true" : "false"));
      const ans = $("hd-ans");
      if (!guess) { ans.className = "hd-ans"; ans.textContent = "Which way does this change lean?"; }
      else {
        const right = guess === P.ans;
        ans.className = "hd-ans " + (right ? "ok" : "no");
        ans.textContent = (right ? "Right: " : "Not quite. It's ") + (P.ans === "hawk" ? "hawkish. " : "dovish. ") + P.why;
      }
      const n = Object.keys(picked).length, score = Object.keys(picked).filter((j) => picked[j] === PAIRS[j].ans).length;
      $("hd-score").textContent = n ? score + " of " + n + " right so far" : "";
    };

    buttons("hd-pick", PAIRS, (j) => { k = j; show(); }, 0);
    [{ n: "Hawkish", v: "hawk" }, { n: "Dovish", v: "dove" }].forEach((o) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = o.n; b.dataset.v = o.v; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => { picked[k] = o.v; show(); });
      $("hd-guess").append(b);
    });
    show();
  }
})();