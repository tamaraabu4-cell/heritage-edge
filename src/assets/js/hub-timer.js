// hub-timer.js: sends you to the lock screen when your 3-hour pass runs out.
// The real lock is on Cloudflare (functions/_middleware.js). This just makes
// an open hub page react on time instead of waiting for your next click.
(function () {
  var KEY = "he-hub-until";
  var LIMIT = 3 * 60 * 60 * 1000; // 3 hours, keep in step with PASS_HOURS in _middleware.js
  var until;

  try {
    until = Number(localStorage.getItem(KEY));
    if (!until || until <= Date.now()) {
      // First hub page since unlocking: start the clock now
      until = Date.now() + LIMIT;
      localStorage.setItem(KEY, String(until));
    }
  } catch (e) {
    until = Date.now() + LIMIT;
  }

  function check() {
    if (Date.now() >= until) {
      try { localStorage.removeItem(KEY); } catch (e) {}
      location.replace("/api/lock"); // same as pressing Lock
    }
  }

  setInterval(check, 15000); // every 15 seconds
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) check(); // also check when you come back to the tab
  });
  check();
})();