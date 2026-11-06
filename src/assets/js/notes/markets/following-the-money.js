// Charts for the note "Following the Money" (Markets · What Markets Are).
// Uses the helpers note.js puts on window.HubNote.
(function () {
  const H = window.HubNote;
  if (!H) return;
  const { $, el, tex, colour } = H;
  const has = (id) => !!document.getElementById(id);
  const tone = () => colour("--tone");
  const grey = () => colour("--note-grey");

  // ---------- Follow a pound: fee-layering waterfall ----------
  if (has("chart-pound")) {
    const START = 1000, PENSION = 0.003;
    const routes = [
      { n: "Through a hedge fund (2 and 20)", hf: true },
      { n: "Through an index fund (0.1%)", hf: false }
    ];
    let sel = 0;
    const box = $("route");
    routes.forEach((r, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = r.n;
      b.addEventListener("click", () => { sel = i; draw(); });
      box.appendChild(b);
    });

    // Each step: name and the change in pounds (negative = taken out).
    const steps = (r, hf) => {
      const gain = START * r;
      const out = [{ n: "Market gain", v: gain, kind: "gain" }];
      if (hf) {
        const cost = START * 0.005, mgmt = START * 0.02;
        const perf = Math.max(0, 0.2 * (gain - cost - mgmt));
        out.push({ n: "Trading and borrowing", v: -cost }, { n: "Management fee", v: -mgmt }, { n: "Performance fee", v: -perf });
      } else {
        out.push({ n: "Index fund fee", v: -START * 0.001 });
      }
      out.push({ n: "Pension running costs", v: -START * PENSION });
      return out;
    };

    const draw = () => {
      [...box.children].forEach((b, i) => b.setAttribute("aria-pressed", i === sel ? "true" : "false"));
      const r = parseInt($("mret").value, 10) / 100;
      $("mret-out").textContent = Math.round(r * 100) + "%";
      const hf = routes[sel].hf, st = steps(r, hf);
      const end = START + st.reduce((a, s) => a + s.v, 0);

      // Waterfall from the £1,000 start
      const svg = $("chart-pound");
      svg.textContent = "";
      const t = tone(), g = grey(), W = 640, top = 16, bottom = 250, pad = 50;
      let lo = START, hi = START, run = START;
      st.forEach((s) => { run += s.v; lo = Math.min(lo, run); hi = Math.max(hi, run); });
      lo = Math.min(lo, START) - 20; hi = Math.max(hi, START) + 20;
      const sy = (v) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
      const cols = st.length + 2, cw = (W - pad - 10) / cols, bw = Math.min(56, cw * 0.62);
      const cx = (i) => pad + cw * i + cw / 2;

      // Grid lines at round numbers
      const stepV = (hi - lo) > 300 ? 100 : (hi - lo) > 120 ? 50 : 20;
      for (let v = Math.ceil(lo / stepV) * stepV; v <= hi; v += stepV) {
        el("line", { x1: pad, x2: W - 10, y1: sy(v), y2: sy(v), class: "grid" }, svg);
        el("text", { x: pad - 6, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = "£" + v;
      }
      const label = (i, txt) => {
        const words = txt.split(" "), mid = Math.ceil(words.length / 2);
        el("text", { x: cx(i), y: bottom + 18, "text-anchor": "middle" }, svg).textContent = words.slice(0, mid).join(" ");
        if (words.length > 1) el("text", { x: cx(i), y: bottom + 32, "text-anchor": "middle" }, svg).textContent = words.slice(mid).join(" ");
      };

      // Start bar
      el("rect", { x: cx(0) - bw / 2, y: sy(START), width: bw, height: bottom - sy(START), rx: 3, fill: g, opacity: 0.5 }, svg);
      el("text", { x: cx(0), y: sy(START) - 6, "text-anchor": "middle" }, svg).textContent = "£1,000";
      label(0, "Paid in");

      run = START;
      st.forEach((s, i) => {
        const from = run, to = run + s.v, y1 = sy(Math.max(from, to)), y2 = sy(Math.min(from, to));
        const isGain = s.kind === "gain";
        el("rect", { x: cx(i + 1) - bw / 2, y: y1, width: bw, height: Math.max(1.5, y2 - y1), rx: 3, fill: isGain ? (s.v >= 0 ? t : g) : g, opacity: isGain ? 1 : 0.85 }, svg);
        el("line", { x1: cx(i) + bw / 2, x2: cx(i + 1) - bw / 2, y1: sy(from), y2: sy(from), stroke: g, "stroke-dasharray": "2 3" }, svg);
        const lbl = (s.v >= 0 ? "+£" : "−£") + Math.abs(Math.round(s.v));
        el("text", { x: cx(i + 1), y: y1 - 6, "text-anchor": "middle", fill: isGain ? t : g }, svg).textContent = lbl;
        label(i + 1, s.n);
        run = to;
      });

      // End bar
      const ei = st.length + 1;
      el("line", { x1: cx(ei - 1) + bw / 2, x2: cx(ei) - bw / 2, y1: sy(end), y2: sy(end), stroke: g, "stroke-dasharray": "2 3" }, svg);
      el("rect", { x: cx(ei) - bw / 2, y: sy(end), width: bw, height: bottom - sy(end), rx: 3, fill: t }, svg);
      el("text", { x: cx(ei), y: sy(end) - 6, "text-anchor": "middle", fill: t }, svg).textContent = "£" + Math.round(end).toLocaleString("en-GB");
      label(ei, "Teacher keeps");

      // Readout
      const gain = START * r, costs = st.filter((s) => s.kind !== "gain").reduce((a, s) => a - s.v, 0);
      const out = $("pound-read"); out.textContent = "";
      const a = document.createElement("span"), b = document.createElement("span"); out.append(a, b);
      tex(a, "\\text{Teacher's return} = \\frac{" + Math.round(end) + " - 1000}{1000} = " + ((end - START) / 10).toFixed(1) + "\\%");
      tex(b, "\\text{Fees and costs} = \\text{£}" + Math.round(costs));

      const story = $("pound-story");
      if (gain > 0) story.textContent = "Of the £" + Math.round(gain) + " the market made, £" + Math.round(costs) + " (" + Math.round((costs / gain) * 100) + "%) went on fees and costs." + (hf ? " The hedge fund has to beat the market by a lot to make that worth it. Try the index fund route to compare." : " A cheap route leaves almost all the gain with the saver. Try the hedge fund route to compare.");
      else if (gain < 0) story.textContent = "The market lost £" + Math.round(-gain) + ", and the fees were still charged: £" + Math.round(costs) + " on top." + (hf ? " The performance fee is zero in a losing year, but the management fee isn't." : "");
      else story.textContent = "The market went nowhere, but the costs of £" + Math.round(costs) + " were still charged.";
    };

    $("mret").addEventListener("input", draw);
    H.charts(draw);
  }
})();