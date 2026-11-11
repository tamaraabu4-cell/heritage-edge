// ==========================================================
// Heritage Edge: the blog page filter
//
// Pills filter the posts by category. "Reading list" swaps the
// reading-list rows for the bookshelf. The choice is kept in the
// address bar (#reading-list), so a filtered view can be linked to.
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector("[data-blog]");
  if (!wrap) return;

  const pills = [...wrap.querySelectorAll("[data-filter-btn]")];
  const rows = [...wrap.querySelectorAll(".post-row[data-cat]")];
  const slugs = pills.map((p) => p.dataset.filterBtn);

  function apply(slug, updateUrl) {
    if (!slugs.includes(slug)) slug = "all";
    wrap.dataset.filter = slug;

    pills.forEach((p) => p.setAttribute("aria-pressed", String(p.dataset.filterBtn === slug)));

    rows.forEach((row) => {
      let show = slug === "all" || row.dataset.cat === slug;
      // Books on the shelf already have a card, so don't list them twice
      if (slug === "reading-list" && row.hasAttribute("data-onshelf")) show = false;
      row.hidden = !show;
    });

    if (updateUrl) {
      const url = slug === "all" ? location.pathname + location.search : "#" + slug;
      history.replaceState(null, "", url);
    }
  }

  pills.forEach((p) => p.addEventListener("click", () => apply(p.dataset.filterBtn, true)));
  window.addEventListener("hashchange", () => apply(location.hash.slice(1), false));
  apply(location.hash.slice(1) || "all", false);
});