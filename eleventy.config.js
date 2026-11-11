import { HtmlBasePlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";

export default function (eleventyConfig) {
  // Fixes links so they work at tamaraabu4-cell.github.io/heritage-edge/
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Copy these across exactly as they are
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/projects/*.py");
  eleventyConfig.addPassthroughCopy("src/projects/*.ipynb");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  // Dates for blog posts: "27 October 2026" on the page, "2026-10-27" inside the <time> tag
  eleventyConfig.addFilter("readableDate", (date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
  );
  eleventyConfig.addFilter("htmlDate", (date) => new Date(date).toISOString().slice(0, 10));

  // ==========================================================
  // Knowledge Hub
  //
  // Each topic in _data/shelves.json has chapters, each chapter has
  // subtopics, and each note says which chapter and subtopic it's in:
  //
  //   shelf: markets
  //   chapter: rates-and-bonds      (the chapter's slug or its title)
  //   subtopic: Bond basics
  //   alsoIn: [valuation/time-value-of-money]   (optional: show it as a guest there too)
  // ==========================================================

  // "Rates and bonds" -> "rates-and-bonds"
  const slugify = (text = "") =>
    String(text).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const same = (a = "", b = "") => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

  // A topic's chapters, tidied up: every chapter gets a number and a slug,
  // and every subtopic becomes { name, planned: [...] } even if written as plain text
  function chaptersOf(shelf) {
    return (shelf.chapters || []).map((chapter, i) => ({
      num: i + 1,
      slug: chapter.slug || slugify(chapter.title),
      title: chapter.title,
      blurb: chapter.blurb || "",
      subtopics: (chapter.subtopics || []).map((sub) =>
        typeof sub === "string" ? { name: sub, planned: [] } : { name: sub.name, planned: sub.planned || [] }
      ),
    }));
  }

  function findChapter(chapters, value) {
    return chapters.findIndex((c) => same(c.slug, value) || same(c.title, value));
  }

  // Where a note sits in its topic, for learning order: [chapter, subtopic, order]
  function placeOf(note, shelves) {
    const shelf = shelves.find((s) => s.slug === note.data.shelf);
    const chapters = shelf ? chaptersOf(shelf) : [];
    const ci = findChapter(chapters, note.data.chapter);
    const si = ci === -1 ? -1 : chapters[ci].subtopics.findIndex((s) => same(s.name, note.data.subtopic));
    return {
      chapter: ci,
      chapterTitle: ci === -1 ? "" : chapters[ci].title,
      pos: [ci === -1 ? 99 : ci, si === -1 ? 99 : si, note.data.order || 0],
    };
  }

  // Turns the notes into a small list the hub's script can read
  eleventyConfig.addFilter("hubIndex", (notes = [], shelves = []) =>
    notes.map((note) => {
      const place = placeOf(note, shelves);
      return {
        url: note.url,
        title: note.data.title,
        shelf: note.data.shelf,
        chapterTitle: place.chapterTitle,
        subtopic: note.data.subtopic || "",
        pos: place.pos,
        summary: note.data.summary || "",
        goals: note.data.goals || [],
      };
    })
  );

  // Builds a topic home's path: chapters -> subtopics -> notes.
  // Each subtopic lists, in order: notes you've written, notes you've planned
  // (from shelves.json) and guests (notes from other topics that point here).
  // Writing a note with the same title as a planned one replaces the planned one.
  function buildPath(shelf, notes = [], shelves = []) {
    const chapters = chaptersOf(shelf).map((c) => ({
      ...c,
      subtopics: c.subtopics.map((s) => ({ name: s.name, planned: s.planned, items: [] })),
    }));
    const unsorted = { num: chapters.length + 1, slug: "not-sorted", title: "Not sorted yet", blurb: "Notes whose chapter doesn't match one in shelves.json.", subtopics: [] };

    const subtopicIn = (chapter, name, fallback) => {
      let sub = chapter.subtopics.find((s) => same(s.name, name));
      if (!sub) {
        sub = chapter.subtopics.find((s) => s.name === fallback);
        if (!sub) {
          sub = { name: fallback, planned: [], items: [] };
          chapter.subtopics.push(sub);
        }
      }
      return sub;
    };

    // 1. Notes written for this topic
    const own = notes.filter((n) => n.data.shelf === shelf.slug).sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
    const writtenTitles = own.map((n) => String(n.data.title).toLowerCase());
    own.forEach((n) => {
      const ci = findChapter(chapters, n.data.chapter);
      const chapter = ci === -1 ? unsorted : chapters[ci];
      if (ci === -1) console.warn(`[hub] "${n.data.title}" has chapter "${n.data.chapter}", which isn't in ${shelf.slug}'s chapters.`);
      subtopicIn(chapter, n.data.subtopic, "Other").items.push({ kind: "written", title: n.data.title, url: n.url });
    });

    // 2. Planned notes, unless already written
    chapters.forEach((c) =>
      c.subtopics.forEach((s) =>
        s.planned
          .filter((title) => writtenTitles.indexOf(String(title).toLowerCase()) === -1)
          .forEach((title) => s.items.push({ kind: "planned", title }))
      )
    );

    // 3. Guests: notes from other topics with alsoIn: [this-topic/chapter] or [this-topic/chapter/Subtopic]
    notes.forEach((n) => {
      if (n.data.shelf === shelf.slug) return;
      (n.data.alsoIn || []).forEach((where) => {
        const [topic, chapterRef, subRef] = String(where).split("/");
        if (topic !== shelf.slug) return;
        const ci = findChapter(chapters, chapterRef);
        if (ci === -1) return;
        const home = shelves.find((s) => s.slug === n.data.shelf);
        subtopicIn(chapters[ci], subRef || "", "Also useful").items.push({
          kind: "guest", title: n.data.title, url: n.url, home: home ? home.name : n.data.shelf,
        });
      });
    });

    const all = unsorted.subtopics.length ? chapters.concat([unsorted]) : chapters;
    all.forEach((c) => {
      const items = [];
      c.subtopics.forEach((s) => s.items.forEach((i) => items.push(i)));
      c.planned = items.filter((i) => i.kind === "planned").length;
      c.written = items.filter((i) => i.kind === "written").length;
    });

    return {
      chapters: all,
      written: own.length,
      planned: all.reduce((sum, c) => sum + c.planned, 0),
    };
  }
  eleventyConfig.addFilter("topicPath", buildPath);

    // ==========================================================
  // Glossary (_data/glossary.json)
  //
  // Each term:  term, short, topic (a slug from shelves.json),
  //             added ("2026-11-05"), plain, desk
  // Add new terms at the bottom of the file. Two terms added on the
  // same day: the one lower down counts as newer.
  //
  // `glossaryBank` gives every term its topic name and colour, readable
  // dates, an id to link to (/hub/glossary/#term-basis-point) and the
  // notes that use it (found from the {% gl %} words in each note).
  // Newest first.
  // ==========================================================
  const dayLabel = (iso, long) =>
    iso
      ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
          day: "numeric", month: long ? "long" : "short", year: long ? "numeric" : undefined, timeZone: "UTC",
        })
      : "";

  eleventyConfig.addFilter("glossaryBank", (glossary = [], notes = [], shelves = []) => {
    // Which glossary words each note uses: { "compounding": [{ title, url }] }
    const used = {};
    const glWord = /{%-?\s*gl\s*(?:"([^"]*)"|'([^']*)')?\s*-?%}([\s\S]*?){%-?\s*endgl\s*-?%}/g;
    notes.forEach((note) => {
      let raw = "";
      try { raw = readFileSync(note.inputPath, "utf8"); } catch (e) { return; }
      for (const m of raw.matchAll(glWord)) {
        const key = String(m[1] || m[2] || m[3]).trim().toLowerCase();
        used[key] = used[key] || [];
        if (!used[key].some((n) => n.url === note.url)) used[key].push({ title: note.data.title, url: note.url });
      }
    });

    return glossary
      .map((g, i) => {
        const shelf = shelves.find((s) => s.slug === g.topic);
        const usedIn = [];
        [g.term, g.short].filter(Boolean).forEach((word) =>
          (used[String(word).toLowerCase()] || []).forEach((n) => {
            if (!usedIn.some((x) => x.url === n.url)) usedIn.push(n);
          })
        );
        const added = g.added ? String(g.added).slice(0, 10) : "";
        return {
          ...g,
          id: "term-" + slugify(g.term),
          letter: String(g.term).charAt(0).toUpperCase(),
          topicName: shelf ? shelf.name : "",
          colour: shelf ? shelf.colour || "" : "",
          added,
          addedLabel: dayLabel(added, false),
          addedLong: dayLabel(added, true),
          order: i,
          usedIn,
        };
      })
      .sort((a, b) => b.added.localeCompare(a.added) || b.order - a.order);
  });

  // The topics that have glossary terms, in shelf order, with how many each has
  eleventyConfig.addFilter("glossaryTopics", (bank = [], shelves = []) =>
    shelves
      .map((s) => ({ slug: s.slug, name: s.name, colour: s.colour || "", count: bank.filter((g) => g.topic === s.slug).length }))
      .filter((t) => t.count > 0)
  );

  // Everything a note page needs to know about where it sits:
  // its topic, its chapter, the chapter's notes in order, and what comes next.
  eleventyConfig.addFilter("noteContext", (data, url, notes = [], shelves = []) => {
    const shelf = shelves.find((s) => s.slug === data.shelf);
    if (!shelf) return null;
    const path = buildPath(shelf, notes, shelves);
    const chapter = path.chapters.find((c) => c.subtopics.some((s) => s.items.some((i) => i.url === url)));
    if (!chapter) return null;
    const items = [];
    chapter.subtopics.forEach((s) =>
      s.items.forEach((i) => { if (i.kind !== "guest") items.push({ kind: i.kind, title: i.title, url: i.url || "", subtopic: s.name }); })
    );
    const index = items.findIndex((i) => i.url === url);
    const theme = (slug) => {
      const t = shelves.find((s) => s.slug === slug);
      return t ? { name: t.name, url: "/hub/" + t.slug + "/", colour: t.colour || "" } : null;
    };
    return {
      shelf: { name: shelf.name, slug: shelf.slug, colour: shelf.colour || "", url: "/hub/" + shelf.slug + "/" },
      chapter: { num: chapter.num, title: chapter.title, slug: chapter.slug },
      subtopic: data.subtopic || "",
      items,
      index,
      total: items.length,
      next: items[index + 1] || null,
      themes: (data.themes || []).map(theme).filter(Boolean),
    };
  });


  // ==========================================================
  // Homepage highlights
  //
  // Builds the pool of highlight cards from everything on the site:
  //   - every project in _data/projects.json
  //   - every blog post
  //   - hub lessons that say `highlight: true` in their front matter
  //   - hand-written cards in _data/highlights.json (these replace the
  //     automatic card for the same URL, so you can write better wording)
  //
  // Any project, post or lesson can carry its own wording:
  //   highlight: { headline: "...", summary: "...", points: ["...", "..."], cta: "...", pin: true }
  // `pin: true` keeps a card in every visit's mix. `highlight: false` on a project
  // or post leaves it out. On the page, highlights.js picks a fresh mix each visit.
  // ==========================================================
  eleventyConfig.addFilter("highlightPool", (handWritten = [], projects = [], posts = [], notes = [], shelves = []) => {
    const colourOf = (topic) => {
      if (!topic) return "";
      if (topic === "simulations") return "walnut";
      const shelf = shelves.find((s) => s.slug === topic);
      return shelf ? shelf.colour || "" : "";
    };
    const shelfName = (slug) => (shelves.find((s) => s.slug === slug) || {}).name || "Knowledge Hub";
    const dayOf = (d) => {
      if (!d) return "";
      if (d instanceof Date) return d.toISOString().slice(0, 10);
      const s = String(d);
      return /^\d{4}-\d{2}$/.test(s) ? s + "-15" : s.slice(0, 10); // "2026-10" → mid-month
    };
    const extra = (h) => (h && typeof h === "object" ? h : {});
    // One card, with any hand-written wording from `highlight: {...}` laid on top
    const card = (base, h) => {
      const o = extra(h);
      return {
        ...base,
        tag: o.tag || base.tag,
        headline: o.headline || base.headline,
        summary: o.summary || (o.points ? "" : base.summary || ""),
        points: o.points || base.points || null,
        cta: o.cta || base.cta,
        colour: o.topic ? colourOf(o.topic) : base.colour,
        pin: !!o.pin,
      };
    };

    const cards = [];
    projects.forEach((p) => {
      if (p.highlight === false || !p.url) return;
      cards.push(card({
        kind: "project",
        tag: "Project · " + ((p.markets || [])[0] || p.kind || "Projects"),
        headline: p.title,
        summary: p.headline,
        url: p.url,
        cta: p.cta || "View project",
        colour: colourOf(p.topic),
        date: dayOf(p.date),
      }, p.highlight));
    });
    posts.forEach((post) => {
      const d = post.data || {};
      if (d.highlight === false) return;
      cards.push(card({
        kind: "post",
        tag: "Blog · " + (d.category || "Post"),
        headline: d.title,
        summary: d.summary,
        url: post.url,
        cta: "Read the post",
        colour: colourOf(d.topic),
        date: dayOf(post.date),
      }, d.highlight));
    });
    // The reading list: one pinned card for the blog's bookshelf, so it shows on
    // every visit. It's built from every review with `book:` in its front matter,
    // so a new review updates it automatically. Newest book first.
    const books = posts
      .filter((post) => post.data && post.data.book)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (books.length) {
      const titles = books.map((post) => post.data.book.title);
      const points = titles.slice(0, 3);
      if (titles.length > 3) points.push("+ " + (titles.length - 3) + " more");
      cards.push({
        kind: "post",
        tag: "Blog · Reading list",
        headline: titles.length + " trading books, read and reviewed.",
        summary: "",
        points,
        url: "/blog/blog.html#reading-list",
        cta: "See the bookshelf",
        colour: "",
        date: dayOf(books[0].date),
        pin: true,
      });
    }
    notes.forEach((note) => {
      const d = note.data || {};
      if (!d.highlight) return; // lessons only join when they ask to
      cards.push(card({
        kind: "lesson",
        tag: "Knowledge Hub · " + shelfName(d.shelf),
        headline: d.title,
        summary: d.summary,
        url: note.url,
        cta: "Read the note",
        colour: colourOf(d.shelf),
        date: dayOf(extra(d.highlight).date), // lessons have no date unless you give one
      }, d.highlight));
    });

    // Hand-written cards win over the automatic card for the same page
    handWritten.forEach((h) => {
      const i = cards.findIndex((c) => c.url === h.url);
      const auto = i === -1 ? null : cards[i];
      const kind = h.url.startsWith("/hub/") ? "lesson" : h.url.startsWith("/blog/") ? "post" : "project";
      const c = {
        kind,
        tag: h.tag || (auto && auto.tag) || "",
        headline: h.headline || (auto && auto.headline) || "",
        summary: h.points ? "" : h.summary || (auto && auto.summary) || "",
        points: h.points || null,
        url: h.url,
        cta: h.cta || (auto && auto.cta) || "Take a look",
        colour: h.topic ? colourOf(h.topic) : auto ? auto.colour : "",
        date: dayOf(h.date) || (auto && auto.date) || "",
        pin: !!h.pin,
      };
      if (i === -1) cards.push(c);
      else cards[i] = c;
    });

    // Pinned first, then newest first; keep the page light by sending at most 40
    cards.sort((a, b) => (b.pin - a.pin) || String(b.date).localeCompare(String(a.date)));
    return cards.slice(0, 40);
  });

  // Everything a project page needs (layouts/project.njk): its entry in
  // projects.json (found by the page's URL), its topic and colour, up to
  // three projects to suggest (same topic first, then same market), and the next one.
  eleventyConfig.addFilter("projectContext", (url, projects = [], shelves = []) => {
    const topicOf = (p) => {
      if (p.topic === "simulations") return { name: "Simulations", colour: "walnut", url: "/projects/simulations/" };
      const shelf = shelves.find((s) => s.slug === p.topic);
      return shelf
        ? { name: shelf.name, colour: shelf.colour || "", url: "/projects/" + shelf.slug + "/" }
        : { name: "Projects", colour: "", url: "/projects/projects.html" };
    };
    const i = projects.findIndex((p) => p.url === url);
    if (i === -1) {
      console.warn(`[projects] ${url} isn't in _data/projects.json, so its page has no topic or four steps.`);
      return null;
    }
    const project = projects[i];
    const mine = project.markets || [];
    const shared = (q) => (q.markets || []).find((m) => mine.indexOf(m) !== -1);
    const rank = (q) => (q.topic === project.topic ? 0 : shared(q) ? 1 : 2);
    const more = projects
      .map((q, j) => ({ q, j }))
      .filter((x) => x.j !== i)
      .sort((a, b) => rank(a.q) - rank(b.q) || a.j - b.j)
      .slice(0, 3)
      .map(({ q }) => {
        const t = topicOf(q);
        const why = q.topic === project.topic ? "Also in " + t.name : shared(q) ? "Also trades " + shared(q) : t.name;
        return { title: q.title, url: q.url, colour: t.colour, why, where: [q.kind].concat(q.markets || []).filter(Boolean).join(" · ") };
      });
    const next = projects.length > 1 ? projects[(i + 1) % projects.length] : null;
    return { project, topic: topicOf(project), more, next: next ? { title: next.title, url: next.url } : null };
  });

  // {% psec 1, "Title", "The question it answers", "Short rail title" %} ... {% endpsec %}
  // → a numbered section on a project page. The 4th argument is optional.
  eleventyConfig.addPairedShortcode("psec", (content, num, title, question = "", short = "") => {
    const n = String(num).padStart(2, "0");
    return `<section class="psec" id="s${num}" data-psec data-title="${short || title}">
  <div class="psec-head">
    <span class="psec-num">${n}</span>
    <h2 id="s${num}-title">${title}</h2>${question ? `<p class="psec-q">${question}</p>` : ""}
  </div>
  <div class="project-page psec-body">
${content}
  </div>
</section>`;
  });

  // ---------- Shortcodes for writing notes ----------
  // {% sec 1, "Title", "The question it answers" %} ... {% endsec %}  → a numbered note section
  // Add a 4th, shorter title if the heading is too long for the contents rail:
  // {% sec 4, "How does this link to trading, real estate, quant and fintech?", "…", "How it links to the plan" %}
  eleventyConfig.addPairedShortcode("sec", (content, num, title, question = "", short = "") => {
    const n = String(num).padStart(2, "0");
    return `<section class="sec" id="s${num}" data-sec data-title="${short || title}">
  <div class="sec-head">
    <div class="sec-top"><span class="sec-num">${n}</span><button class="add-note" type="button" data-note-for="s${num}" aria-label="Add a note to this section"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Note</button></div>
    <h2 id="s${num}-title">${title}</h2>${question ? `<p class="sec-q">${question}</p>` : ""}
  </div>
${content}
</section>`;
  });
  // {% gl "asymptote" %}asymptote{% endgl %}  → a glossary word with a dotted underline and a pop-up
  eleventyConfig.addPairedShortcode("gl", (content, key) =>
    `<span class="gl" data-g="${key || String(content).toLowerCase()}" tabindex="0">${content}</span>`
  );
}

export const config = {
  dir: { input: "src", output: "_site" },
  templateFormats: ["njk", "md"],
  pathPrefix: "/",
};