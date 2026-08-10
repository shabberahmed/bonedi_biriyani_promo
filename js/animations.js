import { qsa, prefersReducedMotion } from "./utilities.js";

export function initScrollAnimations() {
  const targets = qsa(
    ".reveal, .reveal-up, .reveal-left, .reveal-right, .scale-reveal, .stagger, .mask-reveal, .image-reveal"
  );

  if (!targets.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-inview"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        if (entry.target.classList.contains("image-reveal")) {
          entry.target.classList.add("is-revealed");
          const frame = entry.target.closest(".media-frame");
          if (frame) frame.classList.add("is-revealed");
        }
        obs.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));
}

export function initImageReveals() {
  // Covered by initScrollAnimations via .image-reveal
}
