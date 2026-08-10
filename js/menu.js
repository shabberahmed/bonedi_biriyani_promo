import { qs, qsa, on } from "./utilities.js";

export function initMenuTabs() {
  const tabs = qsa("[data-menu-tab]");
  const panels = qsa("[data-menu-panel]");
  if (!tabs.length || !panels.length) return;

  const activate = (id) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.menuTab === id;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    panels.forEach((panel) => {
      const match = panel.dataset.menuPanel === id;
      panel.hidden = !match;
    });
  };

  tabs.forEach((tab) => {
    on(tab, "click", () => activate(tab.dataset.menuTab));
  });
}

export function initTestimonials() {
  const root = qs("[data-testimonials]");
  if (!root) return;

  const slides = qsa("[data-testimonial]", root);
  const dotsWrap = qs("[data-testimonial-dots]", root);
  const prev = qs("[data-testimonial-prev]", root);
  const next = qs("[data-testimonial-next]", root);

  if (slides.length < 2) return;

  let index = 0;

  slides.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
    if (i === 0) btn.classList.add("is-active");
    on(btn, "click", () => goTo(i));
    dotsWrap?.appendChild(btn);
  });

  const dots = qsa("button", dotsWrap || root);

  const goTo = (i) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, s) => {
      slide.classList.toggle("is-active", s === index);
    });
    dots.forEach((dot, d) => {
      dot.classList.toggle("is-active", d === index);
    });
  };

  on(prev, "click", () => goTo(index - 1));
  on(next, "click", () => goTo(index + 1));
}
