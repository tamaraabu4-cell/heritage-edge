/* ==========================================================
   Charts for the mean reversion in FX and commodities project.
   The tables below are copied from the four notebooks' outputs.
   The roll fingerprint and the equity curves need daily detail, so they
   load /assets/data/mean-reversion.json, saved by the export cell at the
   end of the Stage 4 notebook.
   ========================================================== */
(function () {
const DATA_URL = '/assets/data/mean-reversion.json';

// ── Numbers from the notebooks ──
const MARKETS = ['EURUSD', 'USDJPY', 'Gold', 'WTI oil'];
const S1 = {
  before: [0.36, 0.20, 0.52, 0.26],
  after: [0.19, 0.00, 0.29, 0.11],
  costLabels: ['Free', '0.5×', '1× (estimate)', '2×', '3×'],
  cost: {
    'EURUSD': [0.36, 0.27, 0.19, 0.03, -0.14],
    'USDJPY': [0.20, 0.10, 0.00, -0.21, -0.41],
    'Gold': [0.52, 0.40, 0.29, 0.05, -0.18],
    'WTI oil': [0.26, 0.18, 0.11, -0.03, -0.18],
  },
};
const S2 = {
  labels: [['Big fall', 'z < −2'], ['Fall', '−2 to −1'], ['Small fall', '−1 to 0'], ['Small rise', '0 to 1'], ['Rise', '1 to 2'], ['Big rise', 'z > 2']],
  move: {
    'EURUSD': [0.0397, 0.0426, 0.0071, 0.0199, -0.1158, -0.0463],
    'USDJPY': [-0.1034, 0.0065, 0.0229, 0.0116, -0.0629, -0.0307],
    'Gold': [-0.0601, 0.0807, 0.0163, -0.0089, -0.1157, 0.1465],
    'WTI oil': [-0.0125, 0.0671, -0.0189, -0.0173, -0.0090, 0.2234],
  },
};
const S3 = {
  pairs: ['Gold vs silver', 'Brent vs WTI', 'AUDUSD vs NZDUSD'],
  train: [-0.33, 0.60, -0.23],
  test: [-0.56, 1.50, -0.54],
};
const S4 = {
  slots: ['Days 1–5', '6–10', '11–15', '16–20', '21–25', '26–31'],
  slotDays: [5, 5, 5, 5, 5, 6],
  entries: { futures: [30, 4, 8, 12, 19, 13], spot: [18, 20, 17, 23, 19, 16] },
  stressLabels: ['Entry at 1.5', 'Entry at 2 (chosen)', 'Entry at 2.5', 'Free trading', '2× costs', '3× costs', 'One day late'],
  stress: { futures: [1.73, 1.38, 1.37, 1.49, 1.26, 1.14, 0.77], spot: [1.89, 1.57, 1.38, 1.65, 1.48, 1.40, 0.92] },
};
const SOURCES = { futures: 'Futures (Yahoo)', spot: 'Spot (FRED)' };

// ── Colours and shared chart settings (same style as the other project pages) ──
const $ = (id) => document.getElementById(id);
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
const charts = {};
const C = {
  'EURUSD': () => (isDark() ? '#60a5fa' : '#2563eb'),
  'USDJPY': () => (isDark() ? '#a78bfa' : '#7c3aed'),
  'Gold': () => (isDark() ? '#fbbf24' : '#d97706'),
  'WTI oil': () => (isDark() ? '#2dd4bf' : '#0f766e'),
  futures: () => (isDark() ? '#f0997b' : '#b5523b'),
  spot: () => (isDark() ? '#34d399' : '#047857'),
  muted: () => (isDark() ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)'),
  strong: () => (isDark() ? '#818cf8' : '#4f46e5'),
};

function getColors() {
  return {
    grid: isDark() ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    zero: isDark() ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
    text: '#8e8e93',
    tooltipBg: isDark() ? '#1e1e25' : '#fff',
    tooltipText: isDark() ? '#f5f5f7' : '#1d1d1f',
    tooltipBorder: isDark() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };
}

// baseline: the y value that gets a stronger grid line (0 for Sharpe, 1 for the roll chart)
function chartOpts(yFmt, baseline) {
  const c = getColors();
  return {
    responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { position: 'top', align: 'center', labels: { color: c.text, font: { size: 11, family: 'DM Sans' }, usePointStyle: true, pointStyleWidth: 10, padding: 14, boxHeight: 8 } },
      tooltip: { backgroundColor: c.tooltipBg, titleColor: c.text, bodyColor: c.tooltipText, borderColor: c.tooltipBorder, borderWidth: 1, padding: 12 },
    },
    scales: {
      x: { grid: { color: c.grid }, ticks: { color: c.text, font: { size: 10, family: 'DM Sans' }, maxRotation: 0, autoSkip: true }, border: { display: false } },
      y: {
        grid: { color: (ctx) => (baseline !== undefined && ctx.tick && ctx.tick.value === baseline ? c.zero : c.grid), lineWidth: (ctx) => (baseline !== undefined && ctx.tick && ctx.tick.value === baseline ? 1.2 : 1) },
        ticks: { color: c.text, font: { size: 10, family: 'DM Sans' }, callback: yFmt },
        border: { display: false },
      },
    },
  };
}
const sharpe = (v) => (+v).toFixed(1);
const signed = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (iso) => { const [y, m] = iso.split('-'); return MONTHS[+m - 1] + ' ' + y; };

// A dashed line where the unseen test period starts
const splitLine = {
  id: 'splitLine',
  afterDatasetsDraw(chart, args, opts) {
    if (opts.index === undefined || opts.index === null || opts.index < 0) return;
    const x = chart.scales.x.getPixelForValue(opts.index);
    const { top, bottom } = chart.chartArea;
    const ctx = chart.ctx;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = opts.color;
    ctx.font = '11px DM Sans';
    ctx.fillText('Unseen test →', x + 6, top + 12);
    ctx.restore();
  },
};

// ── Stage 1 ──
function buildS1() {
  charts.s1 = new Chart($('chartS1'), {
    type: 'bar',
    data: { labels: MARKETS, datasets: [
      { label: 'Before costs', data: S1.before, backgroundColor: C.muted(), borderWidth: 0, borderRadius: 4 },
      { label: 'After costs', data: S1.after, backgroundColor: MARKETS.map((m) => C[m]()), borderWidth: 0, borderRadius: 4 },
    ] },
    options: (() => {
      const o = chartOpts(sharpe, 0);
      o.plugins.legend.labels.generateLabels = () => [
        { text: 'Before costs', fillStyle: C.muted(), strokeStyle: C.muted(), fontColor: getColors().text, pointStyle: 'circle', datasetIndex: 0 },
        { text: 'After costs', fillStyle: C.strong(), strokeStyle: C.strong(), fontColor: getColors().text, pointStyle: 'circle', datasetIndex: 1 },
      ];
      o.plugins.tooltip.callbacks = { label: (it) => it.dataset.label + ': ' + signed(it.parsed.y) };
      return o;
    })(),
  });
}

function buildS1Cost() {
  charts.s1cost = new Chart($('chartS1Cost'), {
    type: 'line',
    data: { labels: S1.costLabels, datasets: MARKETS.map((m) => ({
      label: m, data: S1.cost[m], borderColor: C[m](), backgroundColor: C[m](), borderWidth: 2, pointRadius: 3.5, tension: 0.15,
    })) },
    options: (() => {
      const o = chartOpts(sharpe, 0);
      o.plugins.tooltip.callbacks = { title: (it) => 'Costs: ' + it[0].label, label: (it) => it.dataset.label + ': ' + signed(it.parsed.y) };
      return o;
    })(),
  });
}

// ── Stage 2 ──
function buildS2() {
  charts.s2 = new Chart($('chartS2'), {
    type: 'bar',
    data: { labels: S2.labels, datasets: MARKETS.map((m) => ({
      label: m, data: S2.move[m], backgroundColor: C[m](), borderWidth: 0, borderRadius: 3,
    })) },
    options: (() => {
      const o = chartOpts((v) => (+v).toFixed(2), 0);
      o.plugins.tooltip.callbacks = {
        title: (it) => 'Yesterday: ' + S2.labels[it[0].dataIndex].join(', '),
        label: (it) => it.dataset.label + ': ' + signed(it.parsed.y) + ' normal days',
      };
      return o;
    })(),
  });
}

// ── Stage 3 ──
function buildS3() {
  charts.s3 = new Chart($('chartS3'), {
    type: 'bar',
    data: { labels: S3.pairs, datasets: [
      { label: 'Training, to 2022', data: S3.train, backgroundColor: C.muted(), borderWidth: 0, borderRadius: 4 },
      { label: 'Unseen test, 2023 on', data: S3.test, backgroundColor: C.strong(), borderWidth: 0, borderRadius: 4 },
    ] },
    options: (() => {
      const o = chartOpts(sharpe, 0);
      o.plugins.tooltip.callbacks = { label: (it) => it.dataset.label + ': Sharpe ' + signed(it.parsed.y) };
      return o;
    })(),
  });
}

// ── Stage 4: the two charts that don't need the data file ──
function buildEntries() {
  const share = (list) => { const n = list.reduce((a, b) => a + b, 0); return list.map((v) => +(v / n * 100).toFixed(1)); };
  const random = S4.slotDays.map((d) => +(d / 31 * 100).toFixed(1));
  charts.entries = new Chart($('chartEntries'), {
    type: 'bar',
    data: { labels: S4.slots, datasets: [
      { label: SOURCES.futures, data: share(S4.entries.futures), backgroundColor: C.futures(), borderWidth: 0, borderRadius: 4 },
      { label: SOURCES.spot, data: share(S4.entries.spot), backgroundColor: C.spot(), borderWidth: 0, borderRadius: 4 },
      { label: 'If entries were random', data: random, type: 'line', borderColor: C.muted(), backgroundColor: C.muted(), borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, stepped: 'middle' },
    ] },
    options: (() => {
      const o = chartOpts((v) => v + '%');
      o.scales.y.beginAtZero = true;
      o.plugins.tooltip.callbacks = { label: (it) => {
        const key = it.datasetIndex === 0 ? 'futures' : it.datasetIndex === 1 ? 'spot' : null;
        return it.dataset.label + ': ' + it.parsed.y.toFixed(0) + '%' + (key ? ' (' + S4.entries[key][it.dataIndex] + ' trades)' : '');
      } };
      return o;
    })(),
  });
}

function buildStress() {
  charts.stress = new Chart($('chartStress'), {
    type: 'bar',
    data: { labels: S4.stressLabels.map((l) => l.split(' (')[0] === l ? l : [l.split(' (')[0], '(' + l.split(' (')[1]]), datasets: [
      { label: SOURCES.futures, data: S4.stress.futures, backgroundColor: C.futures(), borderWidth: 0, borderRadius: 4 },
      { label: SOURCES.spot, data: S4.stress.spot, backgroundColor: C.spot(), borderWidth: 0, borderRadius: 4 },
    ] },
    options: (() => {
      const o = chartOpts(sharpe, 0);
      o.scales.y.beginAtZero = true;
      o.plugins.tooltip.callbacks = { title: (it) => S4.stressLabels[it[0].dataIndex], label: (it) => it.dataset.label + ': Sharpe ' + it.parsed.y.toFixed(2) };
      return o;
    })(),
  });
}

// ── Stage 4: the two charts that use the data file ──
let DATA = null;
let rollView = 'typical';
let eqView = 'full';

function showMissing(canvasId, text) {
  const wrap = $(canvasId).parentNode;
  if (wrap.querySelector('.chart-empty')) return;
  const note = document.createElement('div');
  note.className = 'chart-empty';
  note.textContent = text;
  wrap.appendChild(note);
}

function buildRoll() {
  if (!DATA) return;
  const set = DATA.jumps[rollView];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  charts.roll = new Chart($('chartRoll'), {
    type: 'bar',
    data: { labels: days, datasets: [
      { label: SOURCES.futures, data: set[SOURCES.futures], backgroundColor: C.futures(), borderWidth: 0, borderRadius: 3 },
      { label: SOURCES.spot, data: set[SOURCES.spot], backgroundColor: C.spot(), borderWidth: 0, borderRadius: 3 },
    ] },
    options: (() => {
      const o = chartOpts((v) => (+v).toFixed(1) + '×', 1);
      o.scales.y.beginAtZero = true;
      o.scales.x.ticks.autoSkip = false;
      o.plugins.tooltip.callbacks = {
        title: (it) => 'Day ' + it[0].label + ' of the month',
        label: (it) => it.dataset.label + ': ' + it.parsed.y.toFixed(2) + '× a normal day',
      };
      return o;
    })(),
  });
}

function buildEquity() {
  if (!DATA) return;
  const fut = DATA.equity[SOURCES.futures], spot = DATA.equity[SOURCES.spot];
  // Line both sources up on the same weeks
  const dates = Array.from(new Set(fut.map((r) => r[0]).concat(spot.map((r) => r[0])))).sort();
  const lookup = (rows) => { const m = new Map(rows); return dates.map((d) => (m.has(d) ? m.get(d) : null)); };
  let fv = lookup(fut), sv = lookup(spot), labels = dates;
  let split = dates.findIndex((d) => d >= DATA.split);

  if (eqView === 'test' && split >= 0) {
    // Start both at £1 on the first week of the unseen test
    const base = (vals) => { const b = vals.slice(split).find((v) => v !== null); return vals.slice(split).map((v) => (v === null ? null : +(v / b).toFixed(4))); };
    fv = base(fv); sv = base(sv); labels = dates.slice(split); split = -1;
  }

  charts.equity = new Chart($('chartEquity'), {
    type: 'line',
    data: { labels, datasets: [
      { label: SOURCES.futures, data: fv, borderColor: C.futures(), backgroundColor: C.futures(), borderWidth: 1.6, pointRadius: 0, tension: 0, spanGaps: true },
      { label: SOURCES.spot, data: sv, borderColor: C.spot(), backgroundColor: C.spot(), borderWidth: 1.6, pointRadius: 0, tension: 0, spanGaps: true },
    ] },
    plugins: [splitLine],
    options: (() => {
      const o = chartOpts((v) => '£' + (+v).toFixed(2), 1);
      o.scales.x.ticks.maxTicksLimit = 8;
      o.scales.x.ticks.callback = function (v) { return monthLabel(this.getLabelForValue(v)); };
      o.plugins.splitLine = { index: split, color: getColors().zero };
      o.plugins.tooltip.callbacks = {
        title: (it) => 'Week to ' + it[0].label,
        label: (it) => it.dataset.label + ': £' + it.parsed.y.toFixed(2),
      };
      return o;
    })(),
  });
}

function rebuildDataCharts() {
  ['roll', 'equity'].forEach((k) => { if (charts[k]) { charts[k].destroy(); delete charts[k]; } });
  buildRoll(); buildEquity();
}

function buildAll() {
  Object.keys(charts).forEach((k) => { charts[k].destroy(); delete charts[k]; });
  buildS1(); buildS1Cost(); buildS2(); buildS3(); buildEntries(); buildStress();
  buildRoll(); buildEquity();
}

// The two switches: Typical / Average day, and Full period / Unseen years
function wireSwitch(attr, onPick) {
  const buttons = document.querySelectorAll('[data-' + attr + ']');
  buttons.forEach((b) => b.addEventListener('click', () => {
    buttons.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    onPick(b.dataset[attr]);
  }));
  buttons.forEach((x) => x.setAttribute('aria-pressed', x.classList.contains('is-on') ? 'true' : 'false'));
}

function start() {
  if (typeof Chart === 'undefined') return;
  wireSwitch('roll', (v) => { rollView = v; rebuildDataCharts(); });
  wireSwitch('eq', (v) => { eqView = v; rebuildDataCharts(); });
  buildAll();
  // Redraw in the right colours when the site's theme changes
  document.addEventListener('themechange', buildAll);

  fetch(DATA_URL)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { DATA = d; rebuildDataCharts(); })
    .catch(() => {
      const msg = 'Chart data not found. Run the export cell in the Stage 4 notebook and save mean-reversion.json in src/assets/data/.';
      showMissing('chartRoll', msg);
      showMissing('chartEquity', msg);
    });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
})();
