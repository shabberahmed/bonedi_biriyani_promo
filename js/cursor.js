import { qs, qsa, on, isTouchDevice, prefersReducedMotion } from "./utilities.js";

export function initCursor() {
  if (isTouchDevice() || prefersReducedMotion()) return;

  const cursor = qs("[data-cursor]");
  if (!cursor) return;

  document.body.classList.add("has-custom-cursor");
  cursor.classList.add("is-visible");

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let cx = x;
  let cy = y;
  let raf = 0;
  let visible = true;

  const render = () => {
    cx += (x - cx) * 0.28;
    cy += (y - cy) * 0.28;
    const half = cursor.offsetWidth / 2;
    cursor.style.transform = `translate3d(${cx - half}px, ${cy - half}px, 0)`;
    raf = requestAnimationFrame(render);
  };

  raf = requestAnimationFrame(render);

  on(window, "mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!visible) {
      visible = true;
      cursor.classList.add("is-visible");
    }
  });

  const setHover = (onHover) => {
    cursor.classList.toggle("is-hover", onHover);
  };

  const setView = (onView) => {
    cursor.classList.toggle("is-view", onView);
  };

  qsa("a, button, [data-cursor-hover]").forEach((el) => {
    on(el, "mouseenter", () => setHover(true));
    on(el, "mouseleave", () => setHover(false));
  });

  qsa(
    ".experience-gallery__item, .menu-card, .ingredient-card, .media-frame, .signature__media, .heritage__media, .intro__media"
  ).forEach((el) => {
    on(el, "mouseenter", () => setView(true));
    on(el, "mouseleave", () => setView(false));
  });

  on(document, "mouseleave", () => {
    visible = false;
    cursor.classList.remove("is-visible");
  });

  on(document.documentElement, "mouseenter", () => {
    visible = true;
    cursor.classList.add("is-visible");
  });

  return () => cancelAnimationFrame(raf);
}
