import { qs, qsa, on, prefersReducedMotion } from "./utilities.js";

export function initPreloader() {
  const preloader = qs("[data-preloader]");
  const hero = qs("[data-hero]");
  if (!preloader) return;

  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    preloader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    if (hero) {
      requestAnimationFrame(() => hero.classList.add("is-ready"));
    }
    window.setTimeout(() => {
      preloader.setAttribute("aria-hidden", "true");
      preloader.style.display = "none";
    }, 900);
  };

  if (prefersReducedMotion()) {
    finish();
    return;
  }

  const start = performance.now();
  const minDuration = 1600;

  const done = () => {
    const elapsed = performance.now() - start;
    const wait = Math.max(0, minDuration - elapsed);
    window.setTimeout(finish, wait);
  };

  if (document.readyState === "complete") {
    done();
  } else {
    window.addEventListener("load", done, { once: true });
  }

  window.setTimeout(finish, 3200);
}

export function initNavigation() {
  const header = qs("[data-header]");
  const toggle = qs("[data-nav-toggle]");
  const drawer = qs("[data-nav-drawer]");
  const drawerLinks = qsa("[data-drawer-link]");
  const navLinks = qsa("[data-nav-link]");
  const sections = qsa("main section[id]");

  const setScrolled = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };

  setScrolled();
  on(window, "scroll", setScrolled, { passive: true });

  const openDrawer = () => {
    if (!drawer || !toggle) return;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("has-drawer-open");
  };

  const closeDrawer = () => {
    if (!drawer || !toggle) return;
    drawer.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("has-drawer-open");
    window.setTimeout(() => {
      if (!drawer.classList.contains("is-open")) drawer.hidden = true;
    }, 700);
  };

  on(toggle, "click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeDrawer();
    else openDrawer();
  });

  drawerLinks.forEach((link) => on(link, "click", closeDrawer));

  on(document, "keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const linkMap = new Map();
  [...navLinks].forEach((link) => {
    const id = link.getAttribute("href")?.replace("#", "");
    if (id) linkMap.set(id, link);
  });

  linkMap.set("heritage", linkMap.get("story"));
  linkMap.set("craft", linkMap.get("biryani"));
  linkMap.set("ingredients", linkMap.get("biryani"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((l) => l.classList.remove("is-active"));
        const active = linkMap.get(id);
        if (active) active.classList.add("is-active");
      });
    },
    { rootMargin: "-40% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}
