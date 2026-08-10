import { qs, qsa, on, clamp, prefersReducedMotion } from "./utilities.js";

export function initScrollProgress() {
  const bar = qs("[data-scroll-progress]");
  if (!bar) return;

  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const progress = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    bar.style.width = `${progress}%`;
  };

  update();
  on(window, "scroll", update, { passive: true });
  on(window, "resize", update, { passive: true });
}

export function initParallax() {
  if (prefersReducedMotion()) return;

  const nodes = qsa("[data-parallax-img] img");
  if (!nodes.length) return;

  let ticking = false;

  const update = () => {
    nodes.forEach((img) => {
      const parent = img.closest("section, .reserve");
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewH) return;
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const shift = clamp((progress - 0.5) * 16, -10, 10);
      img.style.transform = `scale(1.08) translate3d(0, ${shift}%, 0)`;
    });
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  on(window, "scroll", onScroll, { passive: true });
  update();
}

export function initYear() {
  const el = qs("[data-year]");
  if (el) el.textContent = String(new Date().getFullYear());
}
