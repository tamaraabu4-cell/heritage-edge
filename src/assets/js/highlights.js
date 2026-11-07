/* ==========================================================
   Homepage highlights: a fresh mix on every visit
   The page holds a pool of cards (projects, blog posts, marked lessons,
   hand-written cards). This picks a few to show:
   - pinned cards (data-pin) always make it
   - at least one of each kind, when there is one
   - the rest drawn at random, newer things more likely
   - no more than half of the cards of any one kind
   Without JavaScript, the newest cards show instead.
   ========================================================== */
(function () {
  // Newer is more likely: something from today weighs 1, from two months ago 0.5,
  // from six months ago 0.25. Cards without a date count as two months old.
  var today = Date.now();
  function weight(card) {
    var d = Date.parse(card.getAttribute("data-date") || "");
    var days = isNaN(d) ? 60 : Math.max(0, (today - d) / 86400000);
    return 1 / (1 + days / 60);
  }
  function kindOf(card) { return card.getAttribute("data-kind") || "other"; }

  // Draw one card at random from a list, by weight
  function draw(list) {
    var total = 0;
    list.forEach(function (c) { total += weight(c); });
    var r = Math.random() * total;
    for (var i = 0; i < list.length; i++) {
      r -= weight(list[i]);
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function start() {
    var carousel = document.querySelector("[data-highlights]");
    if (!carousel) return;
    var cards = Array.prototype.slice.call(carousel.querySelectorAll(".highlight-card"));
    var show = parseInt(carousel.getAttribute("data-show"), 10) || 8;
    if (cards.length <= 1) return;

    var picked = cards.filter(function (c) { return c.hasAttribute("data-pin"); }).slice(0, show);
    var left = cards.filter(function (c) { return picked.indexOf(c) === -1; });
    function take(card) { picked.push(card); left.splice(left.indexOf(card), 1); }
    function count(kind) { return picked.filter(function (c) { return kindOf(c) === kind; }).length; }

    // One of each kind first
    var kinds = [];
    cards.forEach(function (c) { if (kinds.indexOf(kindOf(c)) === -1) kinds.push(kindOf(c)); });
    kinds.forEach(function (k) {
      if (picked.length >= show || count(k) > 0) return;
      var mine = left.filter(function (c) { return kindOf(c) === k; });
      if (mine.length) take(draw(mine));
    });

    // Then fill up, keeping any one kind to half the cards while others are still available
    var cap = Math.ceil(show / 2);
    while (picked.length < show && left.length) {
      var open = left.filter(function (c) { return count(kindOf(c)) < cap; });
      take(draw(open.length ? open : left));
    }

    // Shuffle the chosen cards so the order changes too
    for (var i = picked.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = picked[i]; picked[i] = picked[j]; picked[j] = t;
    }

    // Chosen cards first (so the colour sequence still alternates), the rest hidden after them
    picked.forEach(function (c) { c.hidden = false; carousel.appendChild(c); });
    left.forEach(function (c) { c.hidden = true; carousel.appendChild(c); });
    carousel.scrollLeft = 0;
  }

  // The page loads this script in the <head>, so wait for the cards to exist
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();