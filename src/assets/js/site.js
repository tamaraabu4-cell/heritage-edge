const root = document.documentElement;
const deviceDark = window.matchMedia("(prefers-color-scheme: dark)");

// Tells any page with charts that the theme just changed, so it can redraw
function announceTheme() {
  document.dispatchEvent(new CustomEvent("themechange"));
}

// Follow the device live: if it switches mode while the page is open, so does the site
deviceDark.addEventListener("change", (event) => {
  let chosen = null;
  try { chosen = sessionStorage.getItem("theme"); } catch (e) {}
  if (!chosen) root.setAttribute("data-theme", event.matches ? "dark" : "light");
  announceTheme(); 
});

// Toggle button: switch mode for this visit only
const themeToggle = document.querySelector("[data-theme-toggle]");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { sessionStorage.setItem("theme", next); } catch (e) {}
    announceTheme(); 
  });
}

// Three-line button: opens and closes the sidebar (styles in site.css section 4)
const menuToggle = document.querySelector("[data-menu-toggle]");

function setMenu(open) {
  root.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", open);
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));

  // Close it by tapping the dimmed page (phones) or pressing Escape
  document.querySelectorAll("[data-menu-close]").forEach((el) =>
    el.addEventListener("click", () => setMenu(false))
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.classList.contains("menu-open")) {
      setMenu(false);
      menuToggle.focus();
    }
  });
}