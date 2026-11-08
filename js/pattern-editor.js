import { createColorClipboard, rgbInputMarkup, copyCardFields } from "./color-controls.js";
import { $, channel, clamp, escapeHTML, materialOptions, patternById, patternStyle, rgbCSS, trackEvent } from "./shared.js";
import { BRANDS_2K27, PATTERNS_2K27 } from "./data.js";
import { labelCardFields, readNumber, validateCards } from "./validation.js";

const shoeNameInput = $("shoeName");
const brandSelect = $("brand");
const gameVersionSelect = $("gameVersion");
const componentsContainer = $("componentsContainer");
const clipboard = createColorClipboard(componentsContainer, ".pattern-paste-color-btn");

export function validPatternItems() {
  const cards = [...componentsContainer.querySelectorAll(".component-card")];
  if (!validateCards(cards, ".component-name")) return null;
  return cards.map(componentValues);
}

function setPickerOpen(card, open) {
  card.classList.toggle("pattern-picker-open", open);
  card.querySelector(".pattern-picker").hidden = !open;
  card.querySelector(".pattern-picker-trigger").setAttribute("aria-expanded", String(open));
}

function patternGridMarkup(selected) {
  const pattern = patternById(selected);
  return `
    <div class="pattern-grid">
      ${PATTERNS_2K27.map(p => `
        <button
          type="button"
          class="pattern-option ${p.id === pattern.id ? "is-selected" : ""}"
          data-pattern-id="${p.id}"
          aria-label="Select pattern ${p.id}"
          aria-pressed="${p.id === pattern.id}"
        >
          <span class="pattern-swatch" style="${patternStyle(p)}"></span>
        </button>
      `).join("")}
    </div>
  `;
}

function updateComponentSummary(card) {
  card.querySelector(".pattern-component-summary").textContent =
    `${card.querySelector(".component-name").value.trim() || "Untitled component"} · ${card.querySelector(".component-material").value}`;
}

function pickerMarkup(selected = "pattern-01") {
  const pattern = patternById(selected);

  return `
    <div class="field-group pattern-field-group">

      <label>Pattern</label>

      <input
        type="hidden"
        class="component-pattern-id"
        value="${pattern.id}"
      >

      <button
        type="button"
        class="pattern-picker-trigger"
        aria-expanded="false"
      >
        <span
          class="pattern-trigger-preview pattern-swatch"
          style="${patternStyle(pattern)}"
        ></span>

        <span class="pattern-trigger-copy">
          <span class="pattern-trigger-title">
            Selected Swatch
          </span>

          <span class="pattern-trigger-subtitle">
            Click to change
          </span>
        </span>
      </button>

      <div class="pattern-picker" hidden></div>

    </div>
  `;
}


/* ======================================================
   PATTERN MANAGER — RGB INPUTS
====================================================== */

function colorGroup(n, color = {}) {
  return `
    <div class="color-card">

      <div class="color-card-title">
        Color ${n}
      </div>

      <div class="rgb-stack">
        ${rgbInputMarkup(`color-${n}`, color, true)}
      </div>

    </div>
  `;
}

function rgbFromCard(card, n) {
  return Object.fromEntries(
    ["red", "green", "blue"].map(k => [
      k,
      readNumber(card.querySelector(`.color-${n}-${k}`))
    ])
  );
}

export function componentValues(card) {
  return {
    name: card.querySelector(
      ".component-name"
    ).value.trim(),

    material: card.querySelector(
      ".component-material"
    ).value,

    patternId: card.querySelector(
      ".component-pattern-id"
    ).value,

    color1: rgbFromCard(card, 1),
    color2: rgbFromCard(card, 2),
    color3: rgbFromCard(card, 3),

    x: readNumber(card.querySelector(".component-x")),

    y: readNumber(card.querySelector(".component-y")),

    notes: card.querySelector(
      ".component-notes"
    ).value.trim()
  };
}


/* ======================================================
   PATTERN MANAGER — CARD HELPERS
====================================================== */

function updateComponentNumbers() {
  componentsContainer
    .querySelectorAll(".component-card")
    .forEach((card, i) => {
      card.querySelector(
        ".pattern-component-number"
      ).textContent =
        String(i + 1).padStart(2, "0");

      updateComponentSummary(card);
    });
}

function updatePatternColors(card) {
  for (let i = 1; i <= 3; i++) {
    card.querySelector(
      `.pattern-live-swatch[data-color="${i}"]`
    ).style.background =
      rgbCSS(rgbFromCard(card, i));
  }
}

export function closeAllPatternPickers(except = null) {
  componentsContainer
    .querySelectorAll(".pattern-picker-open")
    .forEach(card => {
      if (card !== except) {
        setPickerOpen(card, false);
      }
    });
}


/* ======================================================
   PATTERN MANAGER — CREATE COMPONENT
====================================================== */

export function createComponentRow(data = {}) {
  const card = document.createElement("div");

  card.className =
    "component-card pattern-compact-card";

  card.innerHTML = `
    <div class="component-card-header">

      <h3>
        <span class="pattern-component-number"></span>
        · Shoe Component
      </h3>

      <div class="pattern-header-actions">

        <button
          type="button"
          class="pattern-collapse-toggle"
          aria-expanded="true"
        >
          Collapse ▴
        </button>

        <button
          type="button"
          class="button button-secondary pattern-duplicate-btn"
        >
          Duplicate
        </button>

        <button
          type="button"
          class="remove-component-btn"
        >
          Remove
        </button>

      </div>

      <div
        class="pattern-component-summary"
        hidden
      ></div>

    </div>

    <div class="pattern-component-body">

      <div class="component-main-grid">

        <div class="field-group">
          <label>Component Name</label>

          <input
            type="text"
            class="component-name"
            maxlength="100"
            placeholder="Example: Base"
            value="${escapeHTML(data.name || "")}"
          >
        </div>

        <div class="field-group">
          <label>Material</label>

          <select class="component-material">
            ${materialOptions(data.material || "Default")}
          </select>
        </div>

        ${pickerMarkup(data.patternId)}

      </div>

      <div class="component-section">

        <div class="component-section-title">
          Pattern Colors
        </div>

        <div class="color-grid">
          ${colorGroup(1, data.color1)}
          ${colorGroup(2, data.color2)}
          ${colorGroup(3, data.color3)}
        </div>

      </div>

      <div class="component-section">

        <div class="component-section-title">
          Pattern Position
        </div>

        <div class="position-grid">

          <div class="field-group">
            <label>X — Scale</label>

            <input
              type="number"
              inputmode="decimal"
              class="component-x"
              min="0.50"
              max="12.00"
              step="0.01"
              value="${clamp(data.x ?? 0.5, 0.5, 12).toFixed(2)}"
            >

            <span class="field-range">
              0.50 – 12.00
            </span>
          </div>

          <div class="field-group">
            <label>Y — Rotation</label>

            <input
              type="number"
              inputmode="decimal"
              class="component-y"
              min="0"
              max="6.28"
              step="0.01"
              value="${clamp(data.y ?? 0, 0, 6.28).toFixed(2)}"
            >

            <span class="field-range">
              0.00 – 6.28
            </span>
          </div>

        </div>

      </div>

      <div class="field-group component-notes-field">
        <label>Notes</label>

        <input
          type="text"
          class="component-notes"
          maxlength="300"
          placeholder="Optional notes"
          value="${escapeHTML(data.notes || "")}"
        >
      </div>

    </div>
  `;

  componentsContainer.append(card);

  const body = card.querySelector(
    ".pattern-component-body"
  );

  const summary = card.querySelector(
    ".pattern-component-summary"
  );

  const toggle = card.querySelector(
    ".pattern-collapse-toggle"
  );

  /* COLLAPSE / EXPAND */

  toggle.addEventListener("click", () => {
    const collapsed =
      !card.classList.contains("is-collapsed");

    card.classList.toggle(
      "is-collapsed",
      collapsed
    );

    if (collapsed) setPickerOpen(card, false);
    body.hidden = collapsed;
    summary.hidden = !collapsed;

    toggle.textContent =
      collapsed ? "Expand ▾" : "Collapse ▴";

    toggle.setAttribute(
      "aria-expanded",
      String(!collapsed)
    );

    updateComponentNumbers();
  });

  /* REMOVE */

  card.querySelector(
    ".remove-component-btn"
  ).addEventListener("click", () => {
    card.remove();

    updateComponentNumbers();
    (componentsContainer.querySelector(".remove-component-btn") || $("addComponentBtn")).focus();
    trackEvent("solelab_remove_component");
  });

  /* DUPLICATE */

  card.querySelector(
    ".pattern-duplicate-btn"
  ).addEventListener("click", () => {
    const copy = createComponentRow(
      componentValues(card)
    );

    copyCardFields(card, copy);
    card.after(copy);

    updateComponentNumbers();

    trackEvent(
      "solelab_duplicate_pattern_component"
    );
  });

  /* UPDATE SUMMARY */

  card.querySelector(
    ".component-name"
  ).addEventListener(
    "input",
    () => updateComponentSummary(card)
  );

  card.querySelector(
    ".component-material"
  ).addEventListener(
    "change",
    () => updateComponentSummary(card)
  );

  /* PATTERN PICKER */

  const trigger = card.querySelector(
    ".pattern-picker-trigger"
  );

  trigger.addEventListener("click", () => {
    const wasOpen = card.classList.contains("pattern-picker-open");
    const picker = card.querySelector(".pattern-picker");
    if (!picker.childElementCount) {
      picker.innerHTML = patternGridMarkup(card.querySelector(".component-pattern-id").value);
    }

    closeAllPatternPickers(card);

    setPickerOpen(card, !wasOpen);

    trackEvent("solelab_open_pattern_picker");
  });

  card.querySelector(".pattern-picker").addEventListener("click", event => {
    const option = event.target.closest(".pattern-option");
    if (!option) return;
    const pattern = patternById(option.dataset.patternId);
    card.querySelector(".component-pattern-id").value = pattern.id;
    card.querySelector(".pattern-trigger-preview").setAttribute("style", patternStyle(pattern));
    card.querySelectorAll(".pattern-option").forEach(button => {
      const selected = button === option;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    setPickerOpen(card, false);
    trigger.focus();
    trackEvent("solelab_select_pattern", { patternId: pattern.id, page: pattern.page });
  });
  card.addEventListener("keydown", event => {
    if (event.key === "Escape" && card.classList.contains("pattern-picker-open")) {
      setPickerOpen(card, false);
      trigger.focus();
    }
  });

  /* COLOR PREVIEWS AND COPY / PASTE */

  card.querySelectorAll(
    ".color-card"
  ).forEach((colorCard, i) => {
    const n = i + 1;

    const swatch = document.createElement("span");

    swatch.className = "pattern-live-swatch";
    swatch.dataset.color = n;

    swatch.setAttribute("role", "img");

    swatch.setAttribute(
      "aria-label",
      `Color ${n} preview`
    );

    const actions = document.createElement("div");

    actions.className = "pattern-color-actions";

    const copy = document.createElement("button");
    const paste = document.createElement("button");

    for (const button of [copy, paste]) {
      button.type = "button";
      button.className = "button button-secondary";
    }

    copy.textContent = "Copy";
    paste.textContent = "Paste";
    paste.classList.add("pattern-paste-color-btn");

    actions.append(copy, paste);
    colorCard.append(swatch, actions);

    clipboard.bind({
      copy, paste,
      inputs: [...colorCard.querySelectorAll("input")],
      read: () => rgbFromCard(card, n),
      write: color => {
        for (const [key, value] of Object.entries(color)) card.querySelector(`.color-${n}-${key}`).value = value;
        updatePatternColors(card);
      },
      copyEvent: "solelab_copy_pattern_color",
      pasteEvent: "solelab_paste_pattern_color"
    });
  });

  card.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener("focus", () => input.select());
    input.addEventListener("input", () => updatePatternColors(card));
  });

  labelCardFields(card, "pattern");
  updatePatternColors(card);
  updateComponentNumbers();
  return card;
}

/* ======================================================
   PATTERN MANAGER — RESET AND VALIDATION
====================================================== */

export function resetForm() {
  shoeNameInput.value = "";
  brandSelect.value = BRANDS_2K27[0];
  gameVersionSelect.value = "NBA 2K27";

  componentsContainer.replaceChildren();

  clipboard.reset();

  createComponentRow();
}
