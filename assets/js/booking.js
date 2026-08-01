/**
 * Booking modal
 * File: assets/js/booking.js
 *
 * Usage later:
 * 1. Add <link rel="stylesheet" href="assets/css/booking.css">
 * 2. Add <script src="assets/js/booking.js" defer></script>
 * 3. Add data-booking-open to any "Schedule a call" button/link.
 *
 * Important:
 * Front-end JavaScript cannot send email silently by itself.
 * This version opens the visitor's mail app with all booking details filled in.
 * Primary recipient: amanraj.gtm@gmail.com
 * CC recipient: amanwalker9@gmail.com
 *
 * A backend endpoint can be connected later through BOOKING_CONFIG.endpoint.
 */

(() => {
  "use strict";

  const BOOKING_CONFIG = {
    primaryEmail: "amanraj.gtm@gmail.com",
    ccEmail: "amanwalker9@gmail.com",
    timezoneLabel: "IST",
    maxDaysAhead: 90,
    endpoint: "",
    slotPools: {
      1: ["09:30", "10:30", "11:45", "14:00", "15:30", "17:00"],
      2: ["09:00", "10:15", "12:00", "13:30", "15:00", "16:45"],
      3: ["09:45", "11:00", "12:30", "14:30", "16:00", "17:30"],
      4: ["09:15", "10:45", "12:15", "14:00", "15:45", "17:15"],
      5: ["09:30", "11:30", "13:00", "14:45", "16:15"]
    }
  };

  const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_LABELS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  let modal = null;
  let dialog = null;
  let calendarGrid = null;
  let monthLabel = null;
  let previousMonthButton = null;
  let nextMonthButton = null;
  let slotsSection = null;
  let slotsGrid = null;
  let selectedDateLabel = null;
  let selectedTimeLabel = null;
  let bookingForm = null;
  let submitButton = null;
  let statusMessage = null;
  let lastFocusedElement = null;

  const today = startOfDay(new Date());
  const lastAllowedDate = addDays(today, BOOKING_CONFIG.maxDaysAhead);

  const state = {
    visibleMonth: new Date(today.getFullYear(), today.getMonth(), 1),
    selectedDate: null,
    selectedTime: ""
  };

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function sameDay(first, second) {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  function formatISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatHumanDate(date) {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
  }

  function isOutsideAllowedRange(date) {
    return date < today || date > lastAllowedDate;
  }

  function seededNumber(seedText) {
    let hash = 2166136261;

    for (let index = 0; index < seedText.length; index += 1) {
      hash ^= seedText.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return Math.abs(hash >>> 0);
  }

  /**
   * Creates a stable "busy-looking" set of slots for each date.
   * It is deterministic, so refreshing the page does not change that date's slots.
   */
  function getSlotsForDate(date) {
    const pool = BOOKING_CONFIG.slotPools[date.getDay()] || [];
    const seed = seededNumber(formatISODate(date));
    const desiredCount = Math.min(pool.length, 3 + (seed % 3));

    return pool
      .map((slot, index) => ({
        slot,
        score: seededNumber(`${formatISODate(date)}-${slot}-${index}`)
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, desiredCount)
      .map((item) => item.slot)
      .sort((a, b) => a.localeCompare(b));
  }

  function buildModalMarkup() {
    const weekdayMarkup = WEEKDAY_LABELS
      .map((day) => `<span>${day}</span>`)
      .join("");

    return `
      <div class="booking-modal" data-booking-modal hidden>
        <div class="booking-modal__backdrop" data-booking-close></div>

        <section
          aria-labelledby="booking-title"
          aria-modal="true"
          class="booking-modal__dialog"
          data-booking-dialog
          role="dialog"
        >
          <header class="booking-modal__topbar">
            <div>
              <p class="booking-modal__eyebrow">Schedule a call</p>
              <h2 class="booking-modal__title" id="booking-title">
                Choose a date and time
              </h2>
            </div>

            <button
              aria-label="Close booking calendar"
              class="booking-modal__close"
              data-booking-close
              type="button"
            >
              ×
            </button>
          </header>

          <div class="booking-modal__body">
            <section class="booking-calendar-panel">
              <p class="booking-step-label">01 / Select a date</p>

              <div class="booking-calendar">
                <div class="booking-calendar__nav">
                  <button
                    aria-label="Previous month"
                    class="booking-calendar__nav-button"
                    data-booking-prev-month
                    type="button"
                  >
                    ‹
                  </button>

                  <p
                    aria-live="polite"
                    class="booking-calendar__month"
                    data-booking-month-label
                  ></p>

                  <button
                    aria-label="Next month"
                    class="booking-calendar__nav-button"
                    data-booking-next-month
                    type="button"
                  >
                    ›
                  </button>
                </div>

                <div
                  aria-hidden="true"
                  class="booking-calendar__weekdays"
                >
                  ${weekdayMarkup}
                </div>

                <div
                  aria-label="Available booking dates"
                  class="booking-calendar__grid"
                  data-booking-calendar-grid
                  role="grid"
                ></div>
              </div>

              <p class="booking-calendar__hint">
                Saturday and Sunday are unavailable. Times are shown in
                24-hour format (${BOOKING_CONFIG.timezoneLabel}).
              </p>

              <div class="booking-slots" data-booking-slots hidden>
                <p class="booking-step-label">02 / Select a time</p>
                <p class="booking-slots__title" data-booking-slots-title></p>
                <div
                  class="booking-slots__grid"
                  data-booking-slots-grid
                ></div>
              </div>
            </section>

            <section class="booking-details-panel">
              <p class="booking-step-label">03 / Your details</p>

              <div class="booking-summary">
                <div class="booking-summary__item">
                  <span>Date</span>
                  <strong data-booking-selected-date>Not selected</strong>
                </div>

                <div class="booking-summary__item">
                  <span>Time</span>
                  <strong data-booking-selected-time>Not selected</strong>
                </div>
              </div>

              <form class="booking-form" data-booking-form>
                <label class="booking-field">
                  <span>Your name *</span>
                  <input
                    autocomplete="name"
                    name="name"
                    placeholder="John Smith"
                    required
                    type="text"
                  >
                </label>

                <label class="booking-field">
                  <span>Your email *</span>
                  <input
                    autocomplete="email"
                    name="email"
                    placeholder="mail@example.com"
                    required
                    type="email"
                  >
                </label>

                <label class="booking-field">
                  <span>What would you like to discuss?</span>
                  <textarea
                    name="message"
                    placeholder="A short note about the project, role, or opportunity."
                    rows="4"
                  ></textarea>
                </label>

                <button
                  class="booking-submit"
                  data-booking-submit
                  disabled
                  type="submit"
                >
                  Confirm booking
                  <span aria-hidden="true">↗</span>
                </button>

                <p class="booking-form__note">
                  Your email app will open with the booking details ready to send.
                </p>

                <p
                  aria-live="polite"
                  class="booking-status"
                  data-booking-status
                ></p>
              </form>
            </section>
          </div>
        </section>
      </div>
    `;
  }

  function cacheElements() {
    modal = document.querySelector("[data-booking-modal]");
    dialog = modal.querySelector("[data-booking-dialog]");
    calendarGrid = modal.querySelector("[data-booking-calendar-grid]");
    monthLabel = modal.querySelector("[data-booking-month-label]");
    previousMonthButton = modal.querySelector("[data-booking-prev-month]");
    nextMonthButton = modal.querySelector("[data-booking-next-month]");
    slotsSection = modal.querySelector("[data-booking-slots]");
    slotsGrid = modal.querySelector("[data-booking-slots-grid]");
    selectedDateLabel = modal.querySelector("[data-booking-selected-date]");
    selectedTimeLabel = modal.querySelector("[data-booking-selected-time]");
    bookingForm = modal.querySelector("[data-booking-form]");
    submitButton = modal.querySelector("[data-booking-submit]");
    statusMessage = modal.querySelector("[data-booking-status]");
  }

  function renderCalendar() {
    const year = state.visibleMonth.getFullYear();
    const month = state.visibleMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    monthLabel.textContent = `${MONTH_LABELS[month]} ${year}`;
    calendarGrid.innerHTML = "";

    for (let index = 0; index < firstDayIndex; index += 1) {
      const blank = document.createElement("span");
      blank.className = "booking-calendar__day is-outside";
      blank.setAttribute("aria-hidden", "true");
      calendarGrid.appendChild(blank);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const button = document.createElement("button");
      const weekend = isWeekend(date);
      const unavailable = weekend || isOutsideAllowedRange(date);

      button.type = "button";
      button.className = "booking-calendar__day";
      button.textContent = String(day);
      button.dataset.date = formatISODate(date);
      button.setAttribute("role", "gridcell");
      button.setAttribute(
        "aria-label",
        `${formatHumanDate(date)}${weekend ? ", unavailable" : ""}`
      );

      if (sameDay(date, today)) {
        button.classList.add("is-today");
      }

      if (weekend) {
        button.classList.add("is-weekend");
      }

      if (state.selectedDate && sameDay(date, state.selectedDate)) {
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      } else {
        button.setAttribute("aria-pressed", "false");
      }

      button.disabled = unavailable;

      if (!unavailable) {
        button.addEventListener("click", () => selectDate(date));
      }

      calendarGrid.appendChild(button);
    }

    const firstVisibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const finalVisibleMonth = new Date(
      lastAllowedDate.getFullYear(),
      lastAllowedDate.getMonth(),
      1
    );

    previousMonthButton.disabled =
      state.visibleMonth <= firstVisibleMonth;

    nextMonthButton.disabled =
      state.visibleMonth >= finalVisibleMonth;
  }

  function selectDate(date) {
    state.selectedDate = startOfDay(date);
    state.selectedTime = "";

    selectedDateLabel.textContent = formatHumanDate(state.selectedDate);
    selectedTimeLabel.textContent = "Not selected";
    statusMessage.textContent = "";
    statusMessage.className = "booking-status";

    renderCalendar();
    renderSlots();
    updateSubmitState();
  }

  function renderSlots() {
    if (!state.selectedDate) {
      slotsSection.hidden = true;
      slotsGrid.innerHTML = "";
      return;
    }

    const slots = getSlotsForDate(state.selectedDate);
    slotsSection.hidden = false;
    slotsGrid.innerHTML = "";

    const slotsTitle = modal.querySelector("[data-booking-slots-title]");
    slotsTitle.textContent = formatHumanDate(state.selectedDate);

    slots.forEach((time) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-slot";
      button.textContent = time;
      button.dataset.time = time;
      button.setAttribute(
        "aria-label",
        `Select ${time} ${BOOKING_CONFIG.timezoneLabel}`
      );

      if (state.selectedTime === time) {
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      } else {
        button.setAttribute("aria-pressed", "false");
      }

      button.addEventListener("click", () => selectTime(time));
      slotsGrid.appendChild(button);
    });

    slotsSection.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });
  }

  function selectTime(time) {
    state.selectedTime = time;
    selectedTimeLabel.textContent = `${time} ${BOOKING_CONFIG.timezoneLabel}`;

    slotsGrid.querySelectorAll(".booking-slot").forEach((button) => {
      const isSelected = button.dataset.time === time;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    updateSubmitState();
  }

  function updateSubmitState() {
    submitButton.disabled = !(state.selectedDate && state.selectedTime);
  }

  function changeMonth(offset) {
    state.visibleMonth = new Date(
      state.visibleMonth.getFullYear(),
      state.visibleMonth.getMonth() + offset,
      1
    );

    renderCalendar();
  }

  function openModal(trigger) {
    lastFocusedElement = trigger || document.activeElement;
    modal.hidden = false;

    document.documentElement.classList.add("booking-lock");
    document.body.classList.add("booking-lock");

    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      modal.querySelector("[data-booking-close]").focus();
    });
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.documentElement.classList.remove("booking-lock");
    document.body.classList.remove("booking-lock");

    window.setTimeout(() => {
      modal.hidden = true;
      lastFocusedElement?.focus?.();
    }, 280);
  }

  function getFocusableElements() {
    return Array.from(
      dialog.querySelectorAll(
        [
          "a[href]",
          "button:not([disabled])",
          "input:not([disabled])",
          "textarea:not([disabled])",
          "select:not([disabled])",
          '[tabindex]:not([tabindex="-1"])'
        ].join(",")
      )
    ).filter((element) => !element.hasAttribute("hidden"));
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || modal.hidden) {
      return;
    }

    const focusable = getFocusableElements();

    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function buildEmailPayload(formData) {
    const dateText = formatHumanDate(state.selectedDate);
    const timeText = `${state.selectedTime} ${BOOKING_CONFIG.timezoneLabel}`;

    const subject = `Booking request: ${dateText} at ${state.selectedTime}`;
    const body = [
      "New booking request",
      "",
      `Name: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      `Date: ${dateText}`,
      `Time: ${timeText}`,
      "",
      "Discussion notes:",
      formData.get("message") || "No additional notes provided."
    ].join("\n");

    return { subject, body };
  }

  async function sendThroughEndpoint(payload, formData) {
    const response = await fetch(BOOKING_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        name: formData.get("name"),
        email: formData.get("email"),
        date: formatISODate(state.selectedDate),
        time: state.selectedTime,
        timezone: BOOKING_CONFIG.timezoneLabel,
        recipients: [
          BOOKING_CONFIG.primaryEmail,
          BOOKING_CONFIG.ccEmail
        ]
      })
    });

    if (!response.ok) {
      throw new Error("The booking could not be sent.");
    }
  }

  function openMailClient(payload) {
    const mailto = new URL(`mailto:${BOOKING_CONFIG.primaryEmail}`);
    mailto.searchParams.set("cc", BOOKING_CONFIG.ccEmail);
    mailto.searchParams.set("subject", payload.subject);
    mailto.searchParams.set("body", payload.body);

    window.location.href = mailto.toString();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    statusMessage.textContent = "";
    statusMessage.className = "booking-status";

    if (!state.selectedDate || !state.selectedTime) {
      statusMessage.textContent = "Please select a date and time first.";
      statusMessage.classList.add("is-error");
      return;
    }

    if (!bookingForm.reportValidity()) {
      return;
    }

    const formData = new FormData(bookingForm);
    const payload = buildEmailPayload(formData);

    submitButton.disabled = true;
    submitButton.textContent = "Preparing booking…";

    try {
      if (BOOKING_CONFIG.endpoint) {
        await sendThroughEndpoint(payload, formData);
        statusMessage.textContent =
          "Booking request sent successfully.";
        statusMessage.classList.add("is-success");
        bookingForm.reset();
      } else {
        openMailClient(payload);
        statusMessage.textContent =
          "Your email app has been opened with the booking details.";
        statusMessage.classList.add("is-success");
      }
    } catch (error) {
      statusMessage.textContent =
        error instanceof Error
          ? error.message
          : "The booking could not be prepared.";
      statusMessage.classList.add("is-error");
    } finally {
      submitButton.innerHTML =
        'Confirm booking <span aria-hidden="true">↗</span>';
      updateSubmitState();
    }
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const openTrigger = event.target.closest("[data-booking-open]");

      if (openTrigger) {
        event.preventDefault();
        openModal(openTrigger);
        return;
      }

      if (
        !modal.hidden &&
        event.target.closest("[data-booking-close]")
      ) {
        closeModal();
      }
    });

    previousMonthButton.addEventListener("click", () => changeMonth(-1));
    nextMonthButton.addEventListener("click", () => changeMonth(1));
    bookingForm.addEventListener("submit", handleSubmit);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
        return;
      }

      trapFocus(event);
    });
  }

  function initialise() {
    if (!document.querySelector("[data-booking-modal]")) {
      document.body.insertAdjacentHTML("beforeend", buildModalMarkup());
    }

    cacheElements();
    renderCalendar();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
