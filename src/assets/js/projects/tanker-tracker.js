/* ==========================================================
   Oil tanker tracker project page.
   Reads two files straight from the tracker's GitHub repo,
   which GitHub Actions refreshes on its own:
     tankers.json  - the latest snapshot (the map and count tiles)
     summary.json  - one line per snapshot (the metrics and chart)
   ========================================================== */
(function () {
  const REPO = "https://raw.githubusercontent.com/tamaraabu4-cell/oil-tanker-tracker/main/";
  const $ = (id) => document.getElementById(id);
  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

  // How each kind of dot looks, and its label
  const STYLE = {
    full:   { color: "#23573F", fillColor: "#23573F", fillOpacity: 1, weight: 2 },
    empty:  { color: "#6B6B66", fillColor: "#FFFFFF", fillOpacity: 1, weight: 2 },
    unsure: { color: "#A15F0C", fillColor: "#FBE9CF", fillOpacity: 1, weight: 2, dashArray: "3 3" },
  };
  const LABEL = { full: "Full (laden)", empty: "Empty (in ballast)", unsure: "Unsure" };
  const RADIUS = { VLCC: 11, Suezmax: 9, Aframax: 7 };

  // Ship names and destinations are typed by crews: always treat them as plain text
  function safe(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
  }

  function when(iso) {
    return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function getJSON(file) {
    return fetch(REPO + file, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error(file + " " + r.status);
      return r.json();
    });
  }

  function showError(el, message) {
    el.innerHTML = '<div class="tk-error">' + message + "</div>";
  }

  // ── 1. The live map ──
  function drawMap() {
    const box = $("tk-map");
    if (!box || typeof L === "undefined") return;

    const map = L.map(box, { scrollWheelZoom: false });   // scrolling the page shouldn't zoom the map
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 12,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    map.setView([51, 0.5], 6);

    getJSON("tankers.json")
      .then((data) => {
        $("tk-updated").textContent =
          data.area + " · updated " + when(data.updated_utc) + " · " + data.ships.length + " crude-size tankers";
        $("tk-n-full").textContent = data.counts.full;
        $("tk-n-empty").textContent = data.counts.empty;
        $("tk-n-unsure").textContent = data.counts.unsure;

        // The patch(es) of sea the tracker listens to
        const corners = [];
        (data.boxes || []).forEach((b) => {
          L.rectangle(b, { color: "#23573F", weight: 1, fill: false, dashArray: "4 4" }).addTo(map);
          corners.push(...b);
        });
        if (corners.length) map.fitBounds(corners);

        data.ships.forEach((s) => {
          const pct = s.pct_full === null ? "depth not entered" : s.pct_full + "% full";
          const popup =
            "<h4>" + safe(s.name) + "</h4>" +
            "<p>" + safe(s.size_class) + " · " + s.length_m + " m long</p>" +
            "<p><b>" + LABEL[s.status] + "</b> · " + pct + "</p>" +
            "<p>Sitting " + s.draught_m + " m deep (about " + s.full_draught_m + " m when full)</p>" +
            "<p>Heading to " + safe(s.destination) + " at " + s.speed_kn + " knots</p>";
          L.circleMarker([s.lat, s.lon], { ...STYLE[s.status], radius: RADIUS[s.size_class] || 7 })
            .bindPopup(popup)
            .addTo(map);
        });
      })
      .catch(() => {
        $("tk-updated").textContent = "Couldn't load the latest snapshot. Try refreshing in a minute.";
      });
  }

  // ── 2. The first-week numbers and chart ──
  let rows = [];
  let chart = null;

  function drawChart() {
    const canvas = $("tk-chart");
    if (!canvas || typeof Chart === "undefined" || !rows.length) return;
    if (chart) chart.destroy();

    const dark = isDark();
    const text = "#8e8e93";
    const grid = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
    const series = [
      { key: "full", label: "Full", colour: dark ? "#5fae86" : "#23573F" },
      { key: "empty", label: "Empty", colour: dark ? "#8a8a84" : "#a8a69d" },
      { key: "unsure", label: "Unsure", colour: dark ? "#e0a54a" : "#C17A16" },
    ];

    chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: rows.map((r) => when(r.time_utc)),
        datasets: series.map((s) => ({
          label: s.label,
          data: rows.map((r) => r[s.key]),
          backgroundColor: s.colour,
          borderRadius: 3,
          maxBarThickness: 28,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { labels: { color: text, font: { size: 11, family: "DM Sans" }, usePointStyle: true, boxHeight: 8 } },
          tooltip: {
            backgroundColor: dark ? "#1e1e25" : "#fff",
            titleColor: dark ? "#f5f5f7" : "#1d1d1f",
            bodyColor: dark ? "#f5f5f7" : "#1d1d1f",
            borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            borderWidth: 1,
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: text, font: { size: 10 }, maxRotation: 60, autoSkip: true } },
          y: { stacked: true, beginAtZero: true, grid: { color: grid }, ticks: { color: text, precision: 0 },
               title: { display: true, text: "Crude tankers", color: text, font: { size: 11 } } },
        },
      },
    });
  }

  function loadSummary() {
    getJSON("summary.json")
      .then((all) => {
        // Only compare like with like: snapshots that listened to the current area
        const area = all.length ? all[all.length - 1].area : "";
        rows = all.filter((r) => r.area === area);

        const total = (r) => r.full + r.empty + r.unsure;
        const sightings = rows.reduce((n, r) => n + total(r), 0);
        const full = rows.reduce((n, r) => n + r.full, 0);
        $("tk-m-snaps").textContent = rows.length;
        $("tk-m-avg").textContent = rows.length ? (sightings / rows.length).toFixed(1) : "–";
        $("tk-m-full").textContent = sightings ? Math.round((full / sightings) * 100) + "%" : "–";

        drawChart();
      })
      .catch(() => {
        const wrap = $("tk-chart") && $("tk-chart").parentElement;
        if (wrap) showError(wrap, "Couldn't load the snapshot history. Try refreshing in a minute.");
      });
  }

  document.addEventListener("themechange", drawChart);
  drawMap();
  loadSummary();
})();