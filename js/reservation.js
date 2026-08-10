import { qs, qsa, on, prefersReducedMotion } from "./utilities.js";

const LUNCH_SLOTS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
const DINNER_SLOTS = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
const MAX_GUESTS = 8;
const MIN_GUESTS = 1;
const BOOK_AHEAD_DAYS = 60;

function formatDateLabel(iso) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeLabel(time) {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function maxDate() {
  const d = todayDate();
  d.setDate(d.getDate() + BOOK_AHEAD_DAYS);
  return d;
}

function isSlotPast(dateISO, time) {
  if (!dateISO) return false;
  const now = new Date();
  const slot = new Date(`${dateISO}T${time}:00`);
  return slot.getTime() < now.getTime() + 30 * 60 * 1000;
}

function initDatePicker({ root, input, onChange }) {
  if (!root || !input) return { setDate() {} };

  const weekEl = qs("[data-cal-week]", root);
  const prevBtn = qs("[data-cal-prev]", root);
  const nextBtn = qs("[data-cal-next]", root);
  const monthSelect = qs("[data-cal-month]", root);
  const yearSelect = qs("[data-cal-year]", root);

  const min = todayDate();
  const max = maxDate();
  let weekStart = new Date(min);
  let selected = toISODate(min);
  input.value = selected;

  const clampWeekStart = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (start < min) return new Date(min);
    const latestStart = new Date(max);
    latestStart.setDate(latestStart.getDate() - 6);
    if (latestStart < min) return new Date(min);
    if (start > latestStart) return latestStart;
    return start;
  };

  const populateYears = () => {
    if (!yearSelect) return;
    const years = [];
    for (let y = min.getFullYear(); y <= max.getFullYear(); y += 1) years.push(y);
    yearSelect.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join("");
  };

  const populateMonths = (year) => {
    if (!monthSelect) return;
    const months = [];
    for (let m = 0; m < 12; m += 1) {
      const first = new Date(year, m, 1);
      const last = new Date(year, m + 1, 0);
      if (last < min || first > max) continue;
      months.push(m);
    }
    monthSelect.innerHTML = months
      .map((m) => {
        const label = new Date(year, m, 1).toLocaleDateString(undefined, { month: "long" });
        return `<option value="${m}">${label}</option>`;
      })
      .join("");
    return months;
  };

  const syncFiltersFromWeek = () => {
    if (!monthSelect || !yearSelect) return;
    const year = weekStart.getFullYear();
    const month = weekStart.getMonth();
    if (yearSelect.value !== String(year)) {
      yearSelect.value = String(year);
      populateMonths(year);
    }
    if (monthSelect.value !== String(month)) {
      const months = populateMonths(year);
      monthSelect.value = months.includes(month) ? String(month) : String(months[0] ?? min.getMonth());
    }
  };

  const renderWeek = () => {
    weekStart = clampWeekStart(weekStart);
    if (prevBtn) prevBtn.disabled = weekStart.getTime() <= min.getTime();
    if (nextBtn) {
      const probe = new Date(weekStart);
      probe.setDate(probe.getDate() + 7);
      nextBtn.disabled = probe > max;
    }

    if (!weekEl) return;
    weekEl.innerHTML = "";

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      if (date > max) break;
      if (date < min) continue;

      const iso = toISODate(date);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "date-picker__day";
      btn.dataset.date = iso;
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", iso === selected ? "true" : "false");
      btn.innerHTML = `
        <span class="date-picker__weekday">${date.toLocaleDateString(undefined, { weekday: "short" })}</span>
        <span class="date-picker__num">${date.getDate()}</span>
      `;

      if (iso === toISODate(min)) btn.classList.add("is-today");
      if (iso === selected) btn.classList.add("is-selected");

      on(btn, "click", () => {
        selected = iso;
        input.value = selected;
        renderWeek();
        onChange?.(selected);
      });

      weekEl.appendChild(btn);
    }

    syncFiltersFromWeek();
  };

  const jumpToMonthYear = () => {
    const year = Number(yearSelect.value);
    const month = Number(monthSelect.value);
    let start = new Date(year, month, 1);
    if (year === min.getFullYear() && month === min.getMonth()) start = new Date(min);
    if (start < min) start = new Date(min);
    if (start > max) start = new Date(max);
    weekStart = clampWeekStart(start);

    const selectedDate = parseISODate(selected);
    const inRange =
      selectedDate >= weekStart &&
      selectedDate <= new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6) &&
      selectedDate >= min &&
      selectedDate <= max;

    if (!inRange) {
      selected = toISODate(weekStart < min ? min : weekStart);
      input.value = selected;
      onChange?.(selected);
    }
    renderWeek();
  };

  populateYears();
  yearSelect.value = String(min.getFullYear());
  populateMonths(min.getFullYear());
  monthSelect.value = String(min.getMonth());

  on(prevBtn, "click", () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    weekStart = clampWeekStart(prev);
    renderWeek();
  });

  on(nextBtn, "click", () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    weekStart = clampWeekStart(next);
    renderWeek();
  });

  on(yearSelect, "change", () => {
    const months = populateMonths(Number(yearSelect.value));
    if (!months.includes(Number(monthSelect.value))) {
      monthSelect.value = String(months[0] ?? min.getMonth());
    }
    jumpToMonthYear();
  });

  on(monthSelect, "change", jumpToMonthYear);

  renderWeek();

  return {
    setDate(iso) {
      const date = parseISODate(iso);
      const safe = date < min ? new Date(min) : date > max ? new Date(max) : date;
      selected = toISODate(safe);
      input.value = selected;
      weekStart = clampWeekStart(safe);
      renderWeek();
    },
    getDate: () => selected,
  };
}

function initGuestPicker({ root, input, onChange }) {
  if (!root || !input) return { setGuests() {} };

  const minus = qs("[data-guest-minus]", root);
  const plus = qs("[data-guest-plus]", root);
  const countEl = qs("[data-guest-count]", root);
  const captionEl = qs("[data-guest-caption]", root);
  const chipsWrap = qs("[data-guest-chips]", root);

  let guests = Number(input.value) || 2;

  const renderChips = () => {
    if (!chipsWrap) return;
    chipsWrap.innerHTML = "";
    for (let i = MIN_GUESTS; i <= MAX_GUESTS; i += 1) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "guest-chip";
      chip.textContent = String(i);
      chip.setAttribute("role", "radio");
      chip.setAttribute("aria-checked", i === guests ? "true" : "false");
      if (i === guests) chip.classList.add("is-selected");
      on(chip, "click", () => setGuests(i));
      chipsWrap.appendChild(chip);
    }
  };

  const setGuests = (value) => {
    guests = Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, value));
    input.value = String(guests);
    if (countEl) countEl.textContent = String(guests);
    if (captionEl) captionEl.textContent = guests === 1 ? "guest" : "guests";
    if (minus) minus.disabled = guests <= MIN_GUESTS;
    if (plus) plus.disabled = guests >= MAX_GUESTS;
    renderChips();
    onChange?.(guests);
  };

  on(minus, "click", () => setGuests(guests - 1));
  on(plus, "click", () => setGuests(guests + 1));
  setGuests(guests);

  return { setGuests, getGuests: () => guests };
}

export function initReservation() {
  const modal = qs("[data-reserve-modal]");
  const form = qs("[data-reserve-form]");
  if (!modal || !form) return;

  const openers = qsa("[data-open-reserve]");
  const closers = qsa("[data-reserve-close]", modal);
  const steps = qsa("[data-reserve-step]", form);
  const stepDots = qsa("[data-step-dot]", modal);
  const dateInput = qs("[data-reserve-date]", form);
  const guestsInput = qs("[data-reserve-guests]", form);
  const slotInput = qs("[data-reserve-slot]", form);
  const slotDate = qs("[data-reserve-slot-date]", form);
  const slotError = qs("[data-reserve-slot-error]", form);
  const lunchGroup = qs('[data-slot-group="lunch"]', form);
  const dinnerGroup = qs('[data-slot-group="dinner"]', form);
  const summary = qs("[data-reserve-summary]", form);
  const success = qs("[data-reserve-success]", modal);
  const successCopy = qs("[data-reserve-success-copy]", modal);
  const header = qs(".reserve-modal__header", modal);
  const stepsBar = qs("[data-reserve-steps]", modal);

  let step = 1;
  let lastFocus = null;

  const datePicker = initDatePicker({
    root: qs("[data-date-picker]", form),
    input: dateInput,
    onChange: () => {
      if (slotInput) slotInput.value = "";
      if (step === 2) renderSlots();
    },
  });

  initGuestPicker({
    root: qs("[data-guest-picker]", form),
    input: guestsInput,
  });

  const renderSlots = () => {
    const date = dateInput?.value;
    if (slotDate) slotDate.textContent = formatDateLabel(date);

    const build = (group, times) => {
      if (!group) return;
      group.innerHTML = "";
      times.forEach((time) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "reserve-slot";
        btn.textContent = formatTimeLabel(time);
        btn.dataset.slot = time;
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", "false");

        const past = isSlotPast(date, time);
        const bookedHash = `${date}-${time}`.length % 7 === 0;
        if (past || bookedHash) {
          btn.disabled = true;
          btn.title = past ? "Unavailable" : "Fully booked";
        }

        if (slotInput?.value === time && !btn.disabled) {
          btn.classList.add("is-selected");
          btn.setAttribute("aria-checked", "true");
        }

        on(btn, "click", () => {
          if (btn.disabled) return;
          qsa(".reserve-slot", form).forEach((el) => {
            el.classList.remove("is-selected");
            el.setAttribute("aria-checked", "false");
          });
          btn.classList.add("is-selected");
          btn.setAttribute("aria-checked", "true");
          if (slotInput) slotInput.value = time;
          if (slotError) slotError.hidden = true;
        });

        group.appendChild(btn);
      });
    };

    build(lunchGroup, LUNCH_SLOTS);
    build(dinnerGroup, DINNER_SLOTS);
  };

  const updateSummary = () => {
    if (!summary) return;
    const date = formatDateLabel(dateInput?.value);
    const slot = slotInput?.value ? formatTimeLabel(slotInput.value) : "—";
    const guests = guestsInput?.value || "2";
    summary.innerHTML = `<strong>${date}</strong> at <strong>${slot}</strong> · <strong>${guests}</strong> guest${guests === "1" ? "" : "s"}`;
  };

  const setStep = (next) => {
    step = next;
    steps.forEach((el) => {
      const n = Number(el.dataset.reserveStep);
      const active = n === step;
      el.hidden = !active;
      el.classList.toggle("is-active", active);
    });
    stepDots.forEach((dot) => {
      const n = Number(dot.dataset.stepDot);
      dot.classList.toggle("is-active", n === step);
      dot.classList.toggle("is-done", n < step);
    });

    if (step === 2) {
      if (slotInput) slotInput.value = "";
      renderSlots();
    }
    if (step === 3) updateSummary();
  };

  const openModal = (e) => {
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    modal.hidden = false;
    if (success) success.hidden = true;
    if (form) form.hidden = false;
    if (header) header.hidden = false;
    if (stepsBar) stepsBar.hidden = false;
    datePicker.setDate(toISODate(todayDate()));
    setStep(1);
    document.body.classList.add("has-reserve-open");
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      qs("[data-cal-grid] .date-picker__day.is-selected", form)?.focus();
    });
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    document.body.classList.remove("has-reserve-open");
    const delay = prefersReducedMotion() ? 0 : 400;
    window.setTimeout(() => {
      modal.hidden = true;
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }, delay);
  };

  openers.forEach((el) => on(el, "click", openModal));
  closers.forEach((el) => on(el, "click", closeModal));

  on(document, "keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  qsa("[data-reserve-next]", form).forEach((btn) => {
    on(btn, "click", () => {
      if (step === 1) {
        if (!dateInput?.value) return;
        setStep(2);
        return;
      }
      if (step === 2) {
        if (!slotInput?.value) {
          if (slotError) slotError.hidden = false;
          return;
        }
        setStep(3);
      }
    });
  });

  qsa("[data-reserve-back]", form).forEach((btn) => {
    on(btn, "click", () => setStep(Math.max(1, step - 1)));
  });

  on(form, "submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!slotInput?.value) {
      setStep(2);
      if (slotError) slotError.hidden = false;
      return;
    }

    const data = new FormData(form);
    const booking = {
      date: data.get("date"),
      slot: data.get("slot"),
      guests: data.get("guests"),
      name: data.get("name"),
      phone: data.get("phone"),
      email: data.get("email"),
      notes: data.get("notes") || "",
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("bonedi-reservations") || "[]");
      existing.push(booking);
      localStorage.setItem("bonedi-reservations", JSON.stringify(existing));
    } catch {
      // ignore storage errors
    }

    form.hidden = true;
    if (header) header.hidden = true;
    if (stepsBar) stepsBar.hidden = true;
    if (success) success.hidden = false;
    if (successCopy) {
      successCopy.textContent = `${booking.name}, we look forward to welcoming you on ${formatDateLabel(
        String(booking.date)
      )} at ${formatTimeLabel(String(booking.slot))} for ${booking.guests} guest${
        booking.guests === "1" ? "" : "s"
      }.`;
    }
  });
}
