import { initPreloader, initNavigation } from "./navigation.js";
import { initScrollAnimations, initImageReveals } from "./animations.js";
import { initScrollProgress, initParallax, initYear } from "./scroll.js";
import { initCraftScroll } from "./craft.js";
import { initMenuTabs, initTestimonials } from "./menu.js";
import { initCursor } from "./cursor.js";
import { initReservation } from "./reservation.js";

function init() {
  initYear();
  initPreloader();
  initNavigation();
  initScrollProgress();
  initScrollAnimations();
  initImageReveals();
  initCraftScroll();
  initMenuTabs();
  initTestimonials();
  initParallax();
  initCursor();
  initReservation();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
