import { createColorClipboard, rgbInputMarkup, copyCardFields } from "./color-controls.js";
import { $, escapeHTML, materialOptions, rgbCSS, trackEvent } from "./shared.js";
import { BRANDS_2K27 } from "./data.js";
import { labelCardFields, readNumber, validateCards } from "./validation.js";

const specShoeName = $("specShoeName");
const specBrand = $("specBrand");
const specGameVersion = $("specGameVersion");
const specLayersContainer = $("specLayersContainer");
const clipboard = createColorClipboard(specLayersContainer, ".spec-paste-color-btn");

function refreshSpecLayerNumbers() {
  specLayersContainer
    .querySelectorAll(".spec-layer-card")
    .forEach((card, i) => {
      card.querySelector(
        ".spec-layer-number"
      ).textContent =
        String(i + 1).padStart(2, "0");
    });
}

export function readSpecLayer(card) {
  return {
    name: card.querySelector(
      ".spec-layer-name"
    ).value.trim(),

    material: card.querySelector(
      ".spec-layer-material"
    ).value,

    red: readNumber(card.querySelector(".spec-red")),

    green: readNumber(card.querySelector(".spec-green")),

    blue: readNumber(card.querySelector(".spec-blue"))
  };
}

function updateSpecColorPreview(card) {
  const p = readSpecLayer(card);

  card.querySelector(
    ".spec-color-preview"
  ).style.backgroundColor = rgbCSS(p);
}

/* ======================================================
   QUICK SHARE — CREATE LAYER
====================================================== */

export function addSpecLayer(data = {}) {
  const card = document.createElement("div");

  card.className = "spec-layer-card";

  card.innerHTML = `
    <div class="spec-layer-header">

      <h3>
        <span class="spec-layer-number"></span>
        Shoe Layer
      </h3>

      <div class="spec-layer-actions">

        <button
          type="button"
          class="button button-secondary spec-duplicate-layer-btn"
        >
          Duplicate
        </button>

        <button
          type="button"
          class="button button-secondary spec-remove-layer-btn"
        >
          Remove
        </button>

      </div>

    </div>

    <div class="spec-layer-grid">

      <div class="field-group">
        <label>Layer Name</label>

        <input
          type="text"
          class="spec-layer-name"
          maxlength="70"
          placeholder="Example: Toe / Base"
          value="${escapeHTML(data.name || "")}"
        >
      </div>

      <div class="field-group">
        <label>Material</label>

        <select class="spec-layer-material compact-select">
          ${materialOptions(data.material || "Default")}
        </select>
      </div>

      <div class="spec-color-section">

        <div class="spec-rgb-fields">
          ${rgbInputMarkup("spec", data)}

          <span
            class="spec-color-preview"
            role="img"
            aria-label="Color preview"
          ></span>
        </div>

        <div class="spec-color-actions">

          <button
            type="button"
            class="button button-secondary spec-copy-color-btn"
          >
            Copy Color
          </button>

          <button
            type="button"
            class="button button-secondary spec-paste-color-btn"
            disabled
          >
            Paste Color
          </button>

        </div>

      </div>

    </div>
  `;

  specLayersContainer.append(card);

  refreshSpecLayerNumbers();
  updateSpecColorPreview(card);

  /* REMOVE */

  card.querySelector(
    ".spec-remove-layer-btn"
  ).addEventListener("click", () => {
    card.remove();

    refreshSpecLayerNumbers();
    (specLayersContainer.querySelector(".spec-remove-layer-btn") || $("addSpecLayerBtn")).focus();
    trackEvent("solelab_remove_spec_layer");
  });

  /* DUPLICATE */

  card.querySelector(
    ".spec-duplicate-layer-btn"
  ).addEventListener("click", () => {
    const copy = addSpecLayer(
      readSpecLayer(card)
    );

    copyCardFields(card, copy);
    card.after(copy);

    refreshSpecLayerNumbers();

    trackEvent("solelab_duplicate_spec_layer");
  });

  /* COPY / PASTE COLOR */

  const copyBtn = card.querySelector(
    ".spec-copy-color-btn"
  );

  const pasteBtn = card.querySelector(
    ".spec-paste-color-btn"
  );

  clipboard.bind({
    copy: copyBtn, paste: pasteBtn,
    inputs: [...card.querySelectorAll('input[type="number"]')],
    read: () => {
      const { red, green, blue } = readSpecLayer(card);
      return { red, green, blue };
    },
    write: color => {
      for (const [key, value] of Object.entries(color)) card.querySelector(`.spec-${key}`).value = value;
      updateSpecColorPreview(card);
    },
    copyEvent: "solelab_copy_color",
    pasteEvent: "solelab_paste_color"
  });

  card.querySelectorAll(".spec-red,.spec-green,.spec-blue").forEach(input => {
    input.addEventListener("focus", () => input.select());
    input.addEventListener("input", () => updateSpecColorPreview(card));
  });
  labelCardFields(card, "spec");

  return card;
}


/* ======================================================
   QUICK SHARE — RESET / VALIDATION
====================================================== */

export function resetSpecForm() {
  specShoeName.value = "";
  specBrand.value = BRANDS_2K27[0];
  specGameVersion.value = "NBA 2K27";

  specLayersContainer.replaceChildren();

  clipboard.reset();

  addSpecLayer();
}

export function validSpecLayers() {
  const cards = [...specLayersContainer.querySelectorAll(".spec-layer-card")];
  if (!validateCards(cards, ".spec-layer-name")) return null;
  return cards.map(readSpecLayer);
}
