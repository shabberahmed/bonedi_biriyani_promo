import { qs, qsa, prefersReducedMotion } from "./utilities.js";

export function initCraftScroll() {
  const root = qs("[data-craft]");
  if (!root) return;

  const steps = qsa("[data-craft-step]", root);
  const progress = qsa("[data-craft-progress] span", root);
  const image = qs("[data-craft-image]", root);

  if (!steps.length) return;

  const setActive = (index) => {
    steps.forEach((step, i) => {
      step.classList.toggle("is-active", i === index);
    });
    progress.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      dot.classList.toggle("is-done", i < index);
    });
    if (image && !prefersReducedMotion()) {
      const scale = 1 + index * 0.012;
      image.style.transform = `scale(${scale})`;
    }
  };

  setActive(0);

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = steps.indexOf(entry.target);
        if (index >= 0) setActive(index);
      });
    },
    { root: null, rootMargin: "-40% 0px -40% 0px", threshold: 0.1 }
  );

  steps.forEach((step) => observer.observe(step));
}
