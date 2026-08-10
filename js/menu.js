import { qs, qsa, on, prefersReducedMotion } from "./utilities.js";

export function initMenuTabs() {
  const root = qs("[data-menu]");
  if (!root) return;

  const tabs = qsa("[data-menu-tab]", root);
  const panels = qsa("[data-menu-panel]", root);
  const indicator = qs("[data-menu-indicator]", root);
  if (!tabs.length || !panels.length) return;

  const tabIds = tabs.map((tab) => tab.dataset.menuTab);

  const moveIndicator = (tab) => {
    if (!indicator || !tab) return;
    const tabsEl = tab.parentElement;
    if (!tabsEl) return;
    const tabsRect = tabsEl.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const left = tabRect.left - tabsRect.left;
    indicator.style.width = `${tabRect.width}px`;
    indicator.style.transform = `translate3d(${left}px, 0, 0)`;
  };

  const activateItem = (panel, item) => {
    if (!panel || !item) return;
    const items = qsa("[data-menu-item]", panel);
    const preview = qs("[data-menu-preview]", panel);
    const img = qs("[data-preview-img]", panel);
    const kicker = qs("[data-preview-kicker]", panel);
    const name = qs("[data-preview-name]", panel);
    const note = qs("[data-preview-note]", panel);
    const frame = qs(".menu-preview__frame", panel);

    items.forEach((el) => {
      const active = el === item;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (!img) return;

    const nextSrc = item.dataset.img;
    const nextPos = item.dataset.pos || "50% 50%";
    const reduced = prefersReducedMotion();

    const applyMeta = () => {
      if (kicker) kicker.textContent = item.dataset.kicker || "";
      if (name) name.textContent = item.dataset.name || "";
      if (note) note.textContent = item.dataset.note || "";
      img.style.objectPosition = nextPos;
    };

    if (reduced || img.getAttribute("src") === nextSrc) {
      applyMeta();
      img.style.objectPosition = nextPos;
      return;
    }

    if (frame) frame.classList.add("is-swapping");
    window.setTimeout(() => {
      img.src = nextSrc;
      applyMeta();
      requestAnimationFrame(() => {
        if (frame) frame.classList.remove("is-swapping");
      });
    }, reduced ? 0 : 280);
  };

  const bindPanelItems = (panel) => {
    const items = qsa("[data-menu-item]", panel);
    items.forEach((item) => {
      on(item, "mouseenter", () => {
        if (window.matchMedia("(hover: hover)").matches) {
          activateItem(panel, item);
        }
      });
      on(item, "focus", () => activateItem(panel, item));
      on(item, "click", () => activateItem(panel, item));
    });
  };

  panels.forEach(bindPanelItems);

  const activateTab = (id, { focusTab = false } = {}) => {
    const activeTab = tabs.find((tab) => tab.dataset.menuTab === id) || tabs[0];

    tabs.forEach((tab) => {
      const active = tab.dataset.menuTab === id;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus();
    });

    panels.forEach((panel) => {
      const match = panel.dataset.menuPanel === id;
      panel.hidden = !match;
      panel.classList.toggle("is-active", match);
      if (match) {
        const first = qs("[data-menu-item]", panel);
        if (first) activateItem(panel, first);
      }
    });

    moveIndicator(activeTab);
  };

  tabs.forEach((tab, index) => {
    tab.tabIndex = index === 0 ? 0 : -1;
    on(tab, "click", () => activateTab(tab.dataset.menuTab));
    on(tab, "keydown", (e) => {
      const current = tabIds.indexOf(tab.dataset.menuTab);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = tabIds[(current + 1) % tabIds.length];
        activateTab(next, { focusTab: true });
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = tabIds[(current - 1 + tabIds.length) % tabIds.length];
        activateTab(prev, { focusTab: true });
      }
      if (e.key === "Home") {
        e.preventDefault();
        activateTab(tabIds[0], { focusTab: true });
      }
      if (e.key === "End") {
        e.preventDefault();
        activateTab(tabIds[tabIds.length - 1], { focusTab: true });
      }
    });
  });

  activateTab("signature");
  on(window, "resize", () => {
    const active = qs("[data-menu-tab].is-active", root);
    moveIndicator(active);
  }, { passive: true });
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
