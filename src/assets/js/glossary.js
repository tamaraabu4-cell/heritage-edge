// ==========================================================
// Heritage Edge — Glossary page (/hub/glossary/)
//
// The page arrives with every word already on it, twice: A–Z and
// newest first. This script only shows and hides things:
//   1. search box     hides words that don't contain what you type
//   2. topic chips    hides words from other topics
//   3. sort buttons   swaps between the A–Z and newest-first lists
// The letter bar greys out letters with nothing left to show.
// ==========================================================
(function () {
  const page = document.querySelector("[data-glossary]");
  if (!page) return;

  const search = page.querySelector("#gloss-search");
  const chips = Array.from(page.querySelectorAll("[data-topic-chip]"));
  const sortButtons = Array.from(page.querySelectorAll("[data-sort]"));
  const views = Array.from(page.querySelectorAll("[data-view]"));
  const letterBar = page.querySelector("[data-letters]");
  const letters = Array.from(page.querySelectorAll("[data-letter]"));
  const empty = page.querySelector("[data-empty]");
  const emptyWord = page.querySelector("[data-q]");
  const showing = page.querySelector("[data-showing]");
  const total = page.querySelectorAll('[data-view="az"] [data-gterm]').length;

  let topic = "all";
  let sort = "az";

  function update() {
    const typed = search.value.trim();
    const q = typed.toLowerCase();
    let shown = 0;

    views.forEach((view) => {
      const name = view.dataset.view;
      view.hidden = name !== sort;
      view.querySelectorAll("[data-group]").forEach((group) => {
        let any = false;
        group.querySelectorAll("[data-gterm]").forEach((word) => {
          const match = (topic === "all" || word.dataset.topic === topic) && (!q || word.dataset.text.includes(q));
          word.hidden = !match;
          if (match) {
            any = true;
            if (name === "az") shown++;
          }
        });
        group.hidden = !any;
      });
    });

    // Letter bar: only in A–Z, and only letters that still have words
    letterBar.hidden = sort !== "az" || shown === 0;
    letters.forEach((link) => {
      const group = document.getElementById("letter-" + link.dataset.letter);
      const on = !!group && !group.hidden;
      link.classList.toggle("is-off", !on);
      link.tabIndex = on ? 0 : -1;
      if (on) link.removeAttribute("aria-disabled");
      else link.setAttribute("aria-disabled", "true");
    });

    empty.hidden = shown > 0;
    emptyWord.textContent = typed;
    showing.textContent = shown === total ? total + " terms" : "Showing " + shown + " of " + total + " terms";
  }

  search.addEventListener("input", update);

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      topic = chip.dataset.topicChip;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      update();
    })
  );

  sortButtons.forEach((button) =>
    button.addEventListener("click", () => {
      sort = button.dataset.sort;
      sortButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      update();
    })
  );

  // Arriving from a hub card (/hub/glossary/#term-…): make sure that word is showing
  if (location.hash.indexOf("#term-") === 0) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ block: "center" });
  }

  update();
})();