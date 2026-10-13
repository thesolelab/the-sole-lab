
/* ======================================================
   THE SOLE LAB
   NBA 2K27 SHOE CREATOR TOOLS

   PATTERN MANAGER + QUICK SHARE
====================================================== */


/* ======================================================
   NBA 2K27 DATA
====================================================== */

const BRANDS_2K27 = [
  "Nike",
  "Jordan",
  "Converse",
  "adidas",
  "Puma",
  "New Balance",
  "Reebok",
  "Under Armour",
  "Anta",
  "Li-Ning",
  "AND 1",
  "Peak",
  "Rigorer",
  "Qiaodan",
  "361",
  "Skechers",
  "741",
  "2K Brand"
];

const MATERIALS_2K27 = [
  "Default",
  "Rubber",
  "Metal",
  "Suede",
  "Leather",
  "Patent Leather",
  "Velvet",
  "Fabric",
  "Mesh",
  "Crocodile",
  "Denim Fabric",
  "Felt Fabric",
  "Fleece Fabric",
  "Knit Fabric",
  "Engineered Knit Fabric",
  "Synthetic Fabric",
  "Velvet Fabric",
  "Glitter",
  "Classic Leather",
  "Pebble Leather",
  "Rugged Leather",
  "Athletic Mesh",
  "Brushed Linear Metal",
  "Checker Metal",
  "Chrome Metal",
  "Diamond Metal",
  "Roundhole Metal",
  "Microfiber",
  "Ostrich",
  "Dull Plastic",
  "Semi-shiny Plastic",
  "Shiny Plastic",
  "Pebble Rubber",
  "Turing Rubber",
  "Sequins",
  "Snake",
  "Fine Suede",
  "Basket Weave",
  "Birdeye Weave",
  "Honeycomb Weave",
  "Reversed Honeycomb Weave",
  "Tabby Weave",
  "Twill Weave"
];

const PATTERNS_2K27 = Array.from(
  { length: 29 },
  (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `pattern-${number}`,
      image: `assets/patterns/pattern-${number}.jpg`,
      page: index < 20 ? 1 : 2
    };
  }
);

const SOLE_LAB_LOGO = "assets/icons/TSL Logo.png";


/* ======================================================
   DOM ELEMENTS
====================================================== */

const shoeNameInput =
  document.getElementById("shoeName");

const brandSelect =
  document.getElementById("brand");

const gameVersionSelect =
  document.getElementById("gameVersion");

const componentsContainer =
  document.getElementById("componentsContainer");

const addComponentBtn =
  document.getElementById("addComponentBtn");

const clearFormBtn =
  document.getElementById("clearFormBtn");

const downloadRecipeBtn =
  document.getElementById("downloadRecipeBtn");


/* QUICK SHARE ELEMENTS */

const patternToolBtn =
  document.getElementById("patternToolBtn");

const specToolBtn =
  document.getElementById("specToolBtn");

const patternTool =
  document.getElementById("patternTool");

const specTool =
  document.getElementById("specTool");

const specShoeName =
  document.getElementById("specShoeName");

const specBrand =
  document.getElementById("specBrand");

const specGameVersion =
  document.getElementById("specGameVersion");

const specLayersContainer =
  document.getElementById("specLayersContainer");

const addSpecLayerBtn =
  document.getElementById("addSpecLayerBtn");

const downloadSpecCardBtn =
  document.getElementById("downloadSpecCardBtn");

const clearSpecFormBtn =
  document.getElementById("clearSpecFormBtn");


/* ======================================================
   GENERAL HELPERS
====================================================== */

function trackEvent(eventName, eventData = {}) {
  if (window.umami) {
    window.umami.track(eventName, eventData);
  }
}

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]
  );
}

function slugifyFileName(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function populateBrandSelect(select) {
  select.replaceChildren();

  BRANDS_2K27.forEach(brand => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    select.appendChild(option);
  });
}

function getMaterialOptions(selectedMaterial = "Default") {
  return MATERIALS_2K27.map(material => {
    const selected =
      material === selectedMaterial ? "selected" : "";

    return `
      <option value="${escapeHTML(material)}" ${selected}>
        ${escapeHTML(material)}
      </option>
    `;
  }).join("");
}

function clampNumber(value, minimum, maximum, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(minimum, Math.min(maximum, number));
}

function clampRGBInput(input) {
  if (input.value === "") {
    return;
  }

  input.value = Math.round(
    clampNumber(input.value, 0, 255, 0)
  );
}

function clampScaleInput(input) {
  input.value = clampNumber(
    input.value, 0.5, 12, 0.5
  ).toFixed(2);
}

function clampRotationInput(input) {
  input.value = clampNumber(
    input.value, 0, 6.28, 0
  ).toFixed(2);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(
      new Error(`Could not load image: ${src}`)
    );

    image.src = src;
  });
}

function drawRoundedRect(
  ctx, x, y, width, height, radius
) {
  ctx.beginPath();

  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }

  ctx.fill();
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not generate image."));
      }
    }, type, quality);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 30000);
}

async function shareOrDownloadFiles(files, title, text) {
  const mobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (
    mobile &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files })
  ) {
    try {
      await navigator.share({
        files,
        title,
        text
      });

      return "shared";
    } catch (error) {
      if (error.name === "AbortError") {
        return "cancelled";
      }

      console.warn("Native share failed:", error);
    }
  }

  files.forEach(file => {
    downloadBlob(file, file.name);
  });

  return "downloaded";
}


/* ======================================================
   TOOL NAVIGATION
====================================================== */

function switchTool(toolName) {
  const showSpec = toolName === "spec";

  patternTool.hidden = showSpec;
  specTool.hidden = !showSpec;

  patternTool.classList.toggle("active", !showSpec);
  specTool.classList.toggle("active", showSpec);

  patternToolBtn.classList.toggle("active", !showSpec);
  specToolBtn.classList.toggle("active", showSpec);

  patternToolBtn.setAttribute(
    "aria-selected", String(!showSpec)
  );

  specToolBtn.setAttribute(
    "aria-selected", String(showSpec)
  );
}

patternToolBtn.addEventListener("click", () => {
  switchTool("pattern");
});

specToolBtn.addEventListener("click", () => {
  switchTool("spec");
});


/* ======================================================
   PATTERN MANAGER
   PATTERN HELPERS
====================================================== */

function getPatternById(patternId) {
  return PATTERNS_2K27.find(
    pattern => pattern.id === patternId
  ) || PATTERNS_2K27[0];
}

function getPatternsByPage(pageNumber) {
  return PATTERNS_2K27.filter(
    pattern => pattern.page === pageNumber
  );
}

function getSwatchStyle(pattern) {
  return [
    `background-image: url('${pattern.image}')`,
    "background-size: cover",
    "background-position: center",
    "background-repeat: no-repeat"
  ].join("; ");
}

function createPatternPageMarkup(
  pageNumber,
  selectedPatternId
) {
  const patterns = getPatternsByPage(pageNumber);

  return `
    <div class="pattern-page-group">

      <div class="pattern-page-title">
        Page ${pageNumber}
      </div>

      <div class="pattern-grid">

        ${patterns.map(pattern => {
          const isSelected =
            pattern.id === selectedPatternId
              ? "is-selected"
              : "";

          return `
            <button
              type="button"
              class="pattern-option ${isSelected}"
              data-pattern-id="${pattern.id}"
              aria-label="Select pattern ${pattern.id}"
            >
              <span
                class="pattern-swatch"
                style="${getSwatchStyle(pattern)}"
              ></span>
            </button>
          `;
        }).join("")}

      </div>

    </div>
  `;
}

function createPatternPickerMarkup(
  selectedPatternId = "pattern-01"
) {
  const selectedPattern =
    getPatternById(selectedPatternId);

  return `
    <div class="field-group pattern-field-group">

      <label>Pattern</label>

      <input
        type="hidden"
        class="component-pattern-id"
        value="${selectedPattern.id}"
      />

      <button
        type="button"
        class="pattern-picker-trigger"
      >
        <span
          class="pattern-trigger-preview pattern-swatch"
          style="${getSwatchStyle(selectedPattern)}"
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

      <div class="pattern-picker">
        ${createPatternPageMarkup(
          1, selectedPattern.id
        )}

        ${createPatternPageMarkup(
          2, selectedPattern.id
        )}
      </div>

    </div>
  `;
}

function closeAllPatternPickers(exceptCard = null) {
  document.querySelectorAll(
    ".component-card.pattern-picker-open"
  ).forEach(card => {
    if (card !== exceptCard) {
      card.classList.remove("pattern-picker-open");
    }
  });
}


/* ======================================================
   PATTERN MANAGER
   RGB FIELDS
====================================================== */

function createRGBGroup(colorNumber, color = {}) {
  return `
    <div class="color-card">

      <div class="color-card-title">
        Color ${colorNumber}
      </div>

      <div class="rgb-stack">

        ${[
          ["red", "R", color.red ?? 0],
          ["green", "G", color.green ?? 0],
          ["blue", "B", color.blue ?? 0]
        ].map(([channel, label, value]) => `
          <div class="rgb-row">
            <span class="rgb-label">
              ${label}:
            </span>

            <input
              type="number"
              inputmode="numeric"
              class="color-${colorNumber}-${channel} rgb-value"
              min="0"
              max="255"
              step="1"
              value="${value}"
            />
          </div>
        `).join("")}

      </div>

    </div>
  `;
}


/* ======================================================
   PATTERN MANAGER
   COMPONENT CREATION
====================================================== */

function createComponentRow(component = {}) {
  const card = document.createElement("div");
  card.className = "component-card";

  card.innerHTML = `
    <div class="component-card-header">

      <h3>Shoe Component</h3>

      <button
        type="button"
        class="remove-component-btn"
      >
        Remove
      </button>

    </div>

    <div class="component-main-grid">

      <div class="field-group">
        <label>Component Name</label>

        <input
          type="text"
          class="component-name"
          placeholder="Example: Base"
          value="${escapeHTML(component.name || "")}"
        />
      </div>

      <div class="field-group">
        <label>Material</label>

        <select class="component-material">
          ${getMaterialOptions(
            component.material || "Default"
          )}
        </select>
      </div>

      ${createPatternPickerMarkup(
        component.patternId || "pattern-01"
      )}

    </div>

    <div class="component-section">

      <div class="component-section-title">
        Pattern Colors
      </div>

      <div class="color-grid">

        ${createRGBGroup(1, component.color1)}

        ${createRGBGroup(2, component.color2)}

        ${createRGBGroup(3, component.color3)}

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
            value="${component.x ?? "0.50"}"
          />

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
            min="0.00"
            max="6.28"
            step="0.01"
            value="${component.y ?? "0.00"}"
          />

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
        placeholder="Optional notes"
        value="${escapeHTML(component.notes || "")}"
      />
    </div>
  `;

  componentsContainer.appendChild(card);
  wireComponentCard(card);

  return card;
}


/* ======================================================
   PATTERN MANAGER
   COMPONENT EVENTS
====================================================== */

function wireComponentCard(card) {
  const removeBtn =
    card.querySelector(".remove-component-btn");

  const patternTrigger =
    card.querySelector(".pattern-picker-trigger");

  const hiddenPatternInput =
    card.querySelector(".component-pattern-id");

  const previewSwatch =
    card.querySelector(".pattern-trigger-preview");

  const patternOptions =
    card.querySelectorAll(".pattern-option");

  const rgbInputs =
    card.querySelectorAll(".rgb-value");

  const scaleInput =
    card.querySelector(".component-x");

  const rotationInput =
    card.querySelector(".component-y");

  rgbInputs.forEach(input => {
    input.addEventListener("focus", () => {
      if (input.value === "0") {
        input.value = "";
      }
    });

    input.addEventListener("input", () => {
      clampRGBInput(input);
    });
  });

  scaleInput.addEventListener("focus", () => {
    if (scaleInput.value === "0.50") {
      scaleInput.value = "";
    }
  });

  rotationInput.addEventListener("focus", () => {
    if (rotationInput.value === "0.00") {
      rotationInput.value = "";
    }
  });

  scaleInput.addEventListener("change", () => {
    clampScaleInput(scaleInput);
  });

  rotationInput.addEventListener("change", () => {
    clampRotationInput(rotationInput);
  });

  removeBtn.addEventListener("click", () => {
    card.remove();
    trackEvent("solelab_remove_component");
  });

  patternTrigger.addEventListener("click", () => {
    const isOpen =
      card.classList.contains("pattern-picker-open");

    closeAllPatternPickers(card);

    card.classList.toggle(
      "pattern-picker-open",
      !isOpen
    );

    trackEvent("solelab_open_pattern_picker");
  });

  patternOptions.forEach(option => {
    option.addEventListener("click", () => {
      const pattern =
        getPatternById(option.dataset.patternId);

      hiddenPatternInput.value = pattern.id;

      previewSwatch.setAttribute(
        "style",
        getSwatchStyle(pattern)
      );

      patternOptions.forEach(item => {
        item.classList.remove("is-selected");
      });

      option.classList.add("is-selected");

      card.classList.remove("pattern-picker-open");

      trackEvent("solelab_select_pattern", {
        patternId: pattern.id,
        page: pattern.page
      });
    });
  });
}


/* ======================================================
   PATTERN MANAGER
   READ COMPONENT VALUES
====================================================== */

function getRGBValues(card, colorNumber) {
  return {
    red: Number(
      card.querySelector(
        `.color-${colorNumber}-red`
      ).value
    ),

    green: Number(
      card.querySelector(
        `.color-${colorNumber}-green`
      ).value
    ),

    blue: Number(
      card.querySelector(
        `.color-${colorNumber}-blue`
      ).value
    )
  };
}

function getComponentValues() {
  return Array.from(
    componentsContainer.querySelectorAll(
      ".component-card"
    )
  ).map(card => ({
    name: card.querySelector(
      ".component-name"
    ).value.trim(),

    material: card.querySelector(
      ".component-material"
    ).value,

    patternId: card.querySelector(
      ".component-pattern-id"
    ).value,

    color1: getRGBValues(card, 1),
    color2: getRGBValues(card, 2),
    color3: getRGBValues(card, 3),

    x: Number(
      card.querySelector(".component-x").value
    ),

    y: Number(
      card.querySelector(".component-y").value
    ),

    notes: card.querySelector(
      ".component-notes"
    ).value.trim()
  })).filter(component => component.name);
}

function validateComponents(components) {
  for (const component of components) {
    if (
      !Number.isFinite(component.x) ||
      component.x < 0.5 ||
      component.x > 12
    ) {
      alert(
        `${component.name}: X / Scale must be between 0.50 and 12.00.`
      );

      return false;
    }

    if (
      !Number.isFinite(component.y) ||
      component.y < 0 ||
      component.y > 6.28
    ) {
      alert(
        `${component.name}: Y / Rotation must be between 0.00 and 6.28.`
      );

      return false;
    }

    for (const color of [
      component.color1,
      component.color2,
      component.color3
    ]) {
      if ([
        color.red,
        color.green,
        color.blue
      ].some(value =>
        !Number.isInteger(value) ||
        value < 0 ||
        value > 255
      )) {
        alert(
          `${component.name}: RGB values must be whole numbers from 0 to 255.`
        );

        return false;
      }
    }
  }

  return true;
}

function resetForm() {
  shoeNameInput.value = "";
  brandSelect.value = BRANDS_2K27[0];
  gameVersionSelect.value = "NBA 2K27";

  componentsContainer.replaceChildren();
  createComponentRow();
}


/* ======================================================
   PATTERN MANAGER
   JPEG EXPORT HELPERS
====================================================== */

function drawRGBColumn(ctx, title, color, x, y) {
  ctx.fillStyle = "#9ba6b2";
  ctx.font = "22px Anton";
  ctx.fillText(title, x, y);

  ctx.fillStyle = "#ffffff";
  ctx.font = "26px Anton";

  ctx.fillText(`R:  ${color.red}`, x, y + 42);
  ctx.fillText(`G:  ${color.green}`, x, y + 80);
  ctx.fillText(`B:  ${color.blue}`, x, y + 118);
}


/* ======================================================
   PATTERN MANAGER
   JPEG EXPORT
====================================================== */

async function downloadRecipeJPEG() {
  const shoeName = shoeNameInput.value.trim();

  if (!shoeName) {
    alert("Enter a shoe name before downloading.");
    shoeNameInput.focus();
    return;
  }

  const components = getComponentValues();

  if (components.length === 0) {
    alert(
      "Add at least one shoe component before downloading."
    );
    return;
  }

  if (!validateComponents(components)) {
    return;
  }

  downloadRecipeBtn.disabled = true;

  try {
    await document.fonts.load('34px "Anton"');

    const canvasWidth = 1400;
    const headerHeight = 300;
    const componentHeight = 390;
    const footerHeight = 100;

    const canvasHeight =
      headerHeight +
      components.length * componentHeight +
      footerHeight;

    const canvas = document.createElement("canvas");

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");

    /* BACKGROUND */

    ctx.fillStyle = "#0e1117";
    ctx.fillRect(
      0, 0, canvasWidth, canvasHeight
    );

    /* SHOE NAME */

    ctx.fillStyle = "#ffffff";
    ctx.font = "52px Anton";
    ctx.fillText(shoeName, 80, 155);

    /* BRAND AND VERSION */

    ctx.fillStyle = "#9ba6b2";
    ctx.font = "26px Anton";

    ctx.fillText(
      `${brandSelect.value}  •  ${gameVersionSelect.value}`,
      80,
      205
    );

    /* DIVIDER */

    ctx.fillStyle = "#8ac73f";
    ctx.fillRect(80, 245, 1240, 2);

    /* COMPONENT CARDS */

    for (
      let index = 0;
      index < components.length;
      index++
    ) {
      const component = components[index];

      const startY =
        headerHeight + index * componentHeight;

      ctx.fillStyle = "#161b22";

      drawRoundedRect(
        ctx, 80, startY, 1240, 340, 18
      );

      /* NAME */

      ctx.fillStyle = "#ffffff";
      ctx.font = "32px Anton";

      ctx.fillText(
        component.name,
        120,
        startY + 55
      );

      /* MATERIAL */

      ctx.fillStyle = "#9ba6b2";
      ctx.font = "21px Anton";

      ctx.fillText(
        `Material: ${component.material}`,
        120,
        startY + 95
      );

      /* PATTERN IMAGE */

      const pattern =
        getPatternById(component.patternId);

      try {
        const patternImage =
          await loadImage(pattern.image);

        ctx.drawImage(
          patternImage,
          1060,
          startY + 35,
          200,
          200
        );
      } catch (error) {
        console.warn(
          "Pattern image could not be loaded.",
          error
        );
      }

      /* RGB VALUES */

      drawRGBColumn(
        ctx,
        "COLOR 1",
        component.color1,
        120,
        startY + 155
      );

      drawRGBColumn(
        ctx,
        "COLOR 2",
        component.color2,
        370,
        startY + 155
      );

      drawRGBColumn(
        ctx,
        "COLOR 3",
        component.color3,
        620,
        startY + 155
      );

      /* SCALE / ROTATION */

      ctx.fillStyle = "#9ba6b2";
      ctx.font = "20px Anton";

      ctx.fillText(
        "X — SCALE",
        860,
        startY + 275
      );

      ctx.fillText(
        "Y — ROTATION",
        1060,
        startY + 275
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "28px Anton";

      ctx.fillText(
        component.x.toFixed(2),
        860,
        startY + 315
      );

      ctx.fillText(
        component.y.toFixed(2),
        1060,
        startY + 315
      );
    }

    /* WATERMARK */

    ctx.save();

    ctx.fillStyle =
      "rgba(255, 255, 255, 0.006)";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '90px "Anton"';

    ctx.fillText(
      "THE",
      canvasWidth / 2,
      canvasHeight / 2 - 90
    );

    ctx.fillText(
      "SOLE",
      canvasWidth / 2,
      canvasHeight / 2 + 5
    );

    ctx.fillText(
      "LAB",
      canvasWidth / 2,
      canvasHeight / 2 + 100
    );

    ctx.restore();

    /* FOOTER LOGO */

    try {
      const footerLogo =
        await loadImage(SOLE_LAB_LOGO);

      ctx.drawImage(
        footerLogo,
        80,
        canvasHeight - 78,
        48,
        48
      );
    } catch (error) {
      console.warn(
        "Footer logo could not be loaded.",
        error
      );
    }

    /* EXPORT */

    const blob = await canvasToBlob(
      canvas,
      "image/jpeg",
      0.92
    );

    const filename =
      `${slugifyFileName(shoeName) || "shoe"}-2k27.jpg`;

    const file = new File(
      [blob],
      filename,
      { type: "image/jpeg" }
    );

    const result = await shareOrDownloadFiles(
      [file],
      "The Sole Lab",
      `${shoeName} - ${gameVersionSelect.value}`
    );

    if (result !== "cancelled") {
      trackEvent("solelab_download_jpeg", {
        brand: brandSelect.value,
        componentCount: components.length
      });
    }

  } catch (error) {
    console.error("JPEG export failed:", error);

    alert(
      "Unable to create the JPEG. Please try again."
    );
  } finally {
    downloadRecipeBtn.disabled = false;
  }
}


/* ======================================================
   PATTERN MANAGER
   EVENTS
====================================================== */

addComponentBtn.addEventListener("click", () => {
  createComponentRow();
});

clearFormBtn.addEventListener("click", resetForm);

downloadRecipeBtn.addEventListener(
  "click",
  downloadRecipeJPEG
);

document.addEventListener("click", event => {
  if (!event.target.closest(".pattern-field-group")) {
    closeAllPatternPickers();
  }
});


/* ======================================================
   QUICK SHARE
   LAYER MANAGER
====================================================== */

function refreshSpecLayerNumbers() {
  const cards = specLayersContainer.querySelectorAll(
    ".spec-layer-card"
  );

  cards.forEach((card, index) => {
    card.querySelector(
      ".spec-layer-number"
    ).textContent = String(index + 1).padStart(2, "0");
  });
}

function validSpecChannel(value) {
  return Math.round(
    clampNumber(value, 0, 255, 0)
  );
}

function readSpecLayer(card) {
  return {
    name: card.querySelector(
      ".spec-layer-name"
    ).value.trim(),

    material: card.querySelector(
      ".spec-layer-material"
    ).value,

    red: validSpecChannel(
      card.querySelector(".spec-red").value
    ),

    green: validSpecChannel(
      card.querySelector(".spec-green").value
    ),

    blue: validSpecChannel(
      card.querySelector(".spec-blue").value
    )
  };
}

function updateSpecColorPreview(card) {
  const layer = readSpecLayer(card);

  const preview =
    card.querySelector(".spec-color-preview");

  preview.style.backgroundColor =
    `rgb(${layer.red}, ${layer.green}, ${layer.blue})`;
}


/* ======================================================
   QUICK SHARE
   CREATE LAYER
====================================================== */


/* ======================================================
   QUICK SHARE
   COLOR CLIPBOARD
====================================================== */

let specColorClipboard = null;

function copySpecColor(card) {
  const layer = readSpecLayer(card);

  specColorClipboard = {
    red: layer.red,
    green: layer.green,
    blue: layer.blue
  };

  // Update buttons on all layers.
  updateSpecPasteButtons();

  const copyBtn = card.querySelector(
    ".spec-copy-color-btn"
  );

  copyBtn.textContent = "✓ Copied!";

  setTimeout(() => {
    if (copyBtn.isConnected) {
      copyBtn.textContent = "Copy Color";
    }
  }, 1500);

  trackEvent("solelab_copy_color");
}

function pasteSpecColor(card) {
  if (!specColorClipboard) {
    return;
  }

  card.querySelector(".spec-red").value =
    specColorClipboard.red;

  card.querySelector(".spec-green").value =
    specColorClipboard.green;

  card.querySelector(".spec-blue").value =
    specColorClipboard.blue;

  // Update the existing live color swatch.
  updateSpecColorPreview(card);

  const pasteBtn = card.querySelector(
    ".spec-paste-color-btn"
  );

  pasteBtn.textContent = "✓ Pasted!";

  setTimeout(() => {
    if (pasteBtn.isConnected) {
      pasteBtn.textContent = "Paste Color";
    }
  }, 1500);

  trackEvent("solelab_paste_color");
}

function updateSpecPasteButtons() {
  const pasteButtons =
    specLayersContainer.querySelectorAll(
      ".spec-paste-color-btn"
    );

  pasteButtons.forEach(button => {
    button.disabled = !specColorClipboard;
  });
}


/* ======================================================
   QUICK SHARE
   CREATE LAYER
====================================================== */

function addSpecLayer(layer = {}) {
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

      <!-- LAYER NAME -->

      <div class="field-group">

        <label>Layer Name</label>

        <input
          type="text"
          class="spec-layer-name"
          maxlength="70"
          placeholder="Example: Toe / Base"
          value="${escapeHTML(layer.name || "")}"
        />

      </div>

      <!-- MATERIAL -->

      <div class="field-group">

        <label>Material</label>

        <select
          class="spec-layer-material compact-select"
        >
          ${getMaterialOptions(
            layer.material || "Default"
          )}
        </select>

      </div>

      <!-- RGB VALUES -->

      <div class="spec-color-section">

        <div class="spec-rgb-fields">

          <div class="field-group">
            <label>R</label>

            <input
              type="number"
              inputmode="numeric"
              class="spec-red"
              min="0"
              max="255"
              step="1"
              value="${validSpecChannel(layer.red ?? 0)}"
            />
          </div>

          <div class="field-group">
            <label>G</label>

            <input
              type="number"
              inputmode="numeric"
              class="spec-green"
              min="0"
              max="255"
              step="1"
              value="${validSpecChannel(layer.green ?? 0)}"
            />
          </div>

          <div class="field-group">
            <label>B</label>

            <input
              type="number"
              inputmode="numeric"
              class="spec-blue"
              min="0"
              max="255"
              step="1"
              value="${validSpecChannel(layer.blue ?? 0)}"
            />
          </div>

          <!-- LIVE COLOR PREVIEW -->

          <span
            class="spec-color-preview"
            role="img"
            aria-label="Color preview"
          ></span>

        </div>

        <!-- COLOR ACTIONS -->

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
            ${specColorClipboard ? "" : "disabled"}
          >
            Paste Color
          </button>

        </div>

      </div>

    </div>
  `;

  specLayersContainer.appendChild(card);

  refreshSpecLayerNumbers();
  updateSpecColorPreview(card);

  /* REMOVE LAYER */

  card.querySelector(
    ".spec-remove-layer-btn"
  ).addEventListener("click", () => {

    card.remove();

    refreshSpecLayerNumbers();

    trackEvent("solelab_remove_spec_layer");
  });

  /* DUPLICATE LAYER */

  card.querySelector(
    ".spec-duplicate-layer-btn"
  ).addEventListener("click", () => {

    const values = readSpecLayer(card);

    const duplicate = addSpecLayer(values);

    card.after(duplicate);

    refreshSpecLayerNumbers();

    trackEvent("solelab_duplicate_spec_layer");
  });

  /* COPY COLOR */

  card.querySelector(
    ".spec-copy-color-btn"
  ).addEventListener("click", () => {
    copySpecColor(card);
  });

  /* PASTE COLOR */

  card.querySelector(
    ".spec-paste-color-btn"
  ).addEventListener("click", () => {
    pasteSpecColor(card);
  });

  /* RGB INPUTS */

  const inputs = card.querySelectorAll(
    ".spec-red, .spec-green, .spec-blue"
  );

  inputs.forEach(input => {

    input.addEventListener("focus", () => {
      if (input.value === "0") {
        input.value = "";
      }
    });

    input.addEventListener("input", () => {
      updateSpecColorPreview(card);
    });

    input.addEventListener("change", () => {
      input.value = validSpecChannel(input.value);

      updateSpecColorPreview(card);
    });

  });

  return card;
}


/* ======================================================
   QUICK SHARE
   RESET FORM
====================================================== */

function resetSpecForm() {
  specShoeName.value = "";
  specBrand.value = BRANDS_2K27[0];
  specGameVersion.value = "NBA 2K27";

  specLayersContainer.replaceChildren();

  addSpecLayer();
}


/* ======================================================
   QUICK SHARE
   CANVAS TEXT HELPER
====================================================== */

function specFitText(
  ctx,
  text,
  maxWidth,
  initialSize,
  minSize = 16
) {
  let size = initialSize;

  while (size > minSize) {
    ctx.font = `700 ${size}px Arial, sans-serif`;

    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }

    size--;
  }

  ctx.font = `700 ${size}px Arial, sans-serif`;

  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let shortened = text;

  while (
    shortened.length > 0 &&
    ctx.measureText(shortened + "…").width > maxWidth
  ) {
    shortened = shortened.slice(0, -1);
  }

  return shortened + "…";
}


/* ======================================================
   QUICK SHARE
   DRAW SPEC CARD

   Size: 1080 x 1350
   Maximum: 10 layers per card
====================================================== */

function drawSpecCard(
  shoeName,
  brand,
  gameVersion,
  layers,
  pageIndex,
  pageCount
) {
  const width = 1080;
  const height = 1350;

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  /* BACKGROUND */

  ctx.fillStyle = "#0d1014";
  ctx.fillRect(0, 0, width, height);

  /* HEADER GREEN ACCENT */

  ctx.fillStyle = "#8ac73f";
  ctx.fillRect(65, 67, 8, 85);

  /* LOGO TEXT */

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 56px Arial, sans-serif";
  ctx.fillText("THE SOLE LAB", 98, 114);

  ctx.fillStyle = "#8ac73f";
  ctx.font = "700 24px Arial, sans-serif";

  ctx.fillText(
    "QUICK SHARE  /  SHOE SPECS",
    99,
    151
  );

  /* SHOE DETAILS PANEL */

  ctx.fillStyle = "#14191f";
  ctx.fillRect(65, 185, 950, 174);

  ctx.fillStyle = "#ffffff";

  ctx.fillText(
    specFitText(ctx, shoeName, 865, 41, 22),
    96,
    246
  );

  ctx.fillStyle = "#9da7b2";
  ctx.font = "25px Arial, sans-serif";

  ctx.fillText(
    `${brand}   •   ${gameVersion}`,
    96,
    293
  );

  ctx.font = "19px Arial, sans-serif";

  const startLayer = pageIndex * 10 + 1;
  const endLayer = pageIndex * 10 + layers.length;

  ctx.fillText(
    `LAYERS ${startLayer}–${endLayer}   •   CARD ${pageIndex + 1} OF ${pageCount}`,
    96,
    332
  );

  /* TABLE DIVIDER */

  ctx.fillStyle = "#8ac73f";
  ctx.fillRect(65, 386, 950, 3);

  /* COLUMN HEADERS */

  ctx.fillStyle = "#9da7b2";
  ctx.font = "700 20px Arial, sans-serif";

  ctx.fillText("#", 84, 428);
  ctx.fillText("LAYER", 135, 428);
  ctx.fillText("RGB", 590, 428);
  ctx.fillText("MATERIAL", 790, 428);

  /* LAYER ROWS */

  layers.forEach((layer, index) => {
    const y = 446 + index * 76;

    ctx.fillStyle =
      index % 2 === 0
        ? "#191f26"
        : "#14191f";

    ctx.fillRect(65, y, 950, 72);

    /* LAYER NUMBER */

    ctx.fillStyle = "#8ac73f";
    ctx.font = "700 21px Arial, sans-serif";

    ctx.fillText(
      String(
        pageIndex * 10 + index + 1
      ).padStart(2, "0"),
      84,
      y + 44
    );

    /* LAYER NAME */

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
      specFitText(ctx, layer.name, 390, 23, 17),
      135,
      y + 44
    );

    /* COLOR SWATCH */

    ctx.fillStyle =
      `rgb(${layer.red},${layer.green},${layer.blue})`;

    ctx.fillRect(535, y + 21, 30, 30);

    ctx.strokeStyle = "#68737e";
    ctx.strokeRect(535, y + 21, 30, 30);

    /* RGB VALUES */

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px Arial, sans-serif";

    ctx.fillText(
      `${layer.red}, ${layer.green}, ${layer.blue}`,
      585,
      y + 44
    );

    /* MATERIAL */

    ctx.fillStyle = "#c9d1d9";

    ctx.fillText(
      specFitText(
        ctx,
        layer.material,
        206,
        19,
        16
      ),
      790,
      y + 44
    );
  });

  /* FOOTER */

  ctx.fillStyle = "#283039";
  ctx.fillRect(65, 1254, 950, 2);

  ctx.fillStyle = "#9da7b2";
  ctx.font = "20px Arial, sans-serif";

  ctx.fillText(
    "NBA 2K Shoe Creator • RGB values 0–255",
    65,
    1299
  );

  ctx.fillStyle = "#8ac73f";
  ctx.font = "700 20px Arial, sans-serif";

  ctx.textAlign = "right";

  ctx.fillText(
    "THE SOLE LAB",
    1015,
    1299
  );

  ctx.textAlign = "left";

  return canvas;
}


/* ======================================================
   QUICK SHARE
   VALIDATION
====================================================== */

function getValidatedSpecLayers() {
  const cards = Array.from(
    specLayersContainer.querySelectorAll(
      ".spec-layer-card"
    )
  );

  const namedCards = cards.filter(card =>
    card.querySelector(
      ".spec-layer-name"
    ).value.trim()
  );

  if (namedCards.length === 0) {
    alert("Enter a name for at least one shoe layer.");
    return null;
  }

  for (const card of namedCards) {
    const layerName = card.querySelector(
      ".spec-layer-name"
    ).value.trim();

    const inputs = card.querySelectorAll(
      ".spec-red, .spec-green, .spec-blue"
    );

    for (const input of inputs) {
      const value = Number(input.value);

      if (
        input.value.trim() === "" ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 255
      ) {
        alert(
          `${layerName}: RGB values must be whole numbers between 0 and 255.`
        );

        input.focus();

        return null;
      }
    }
  }

  return namedCards.map(readSpecLayer);
}


/* ======================================================
   QUICK SHARE
   PNG EXPORT
====================================================== */

async function downloadQuickShareSpec() {
  const shoeName = specShoeName.value.trim();

  if (!shoeName) {
    alert("Enter a shoe name before downloading.");
    specShoeName.focus();
    return;
  }

  const layers = getValidatedSpecLayers();

  if (!layers) {
    return;
  }

  /* SPLIT INTO GROUPS OF 10 */

  const pages = [];

  for (
    let index = 0;
    index < layers.length;
    index += 10
  ) {
    pages.push(layers.slice(index, index + 10));
  }

  const fileSlug =
    slugifyFileName(shoeName) || "shoe";

  const originalButtonText =
    downloadSpecCardBtn.textContent;

  downloadSpecCardBtn.disabled = true;
  downloadSpecCardBtn.textContent =
    "Preparing Spec Cards...";

  try {
    const files = [];

    for (
      let pageIndex = 0;
      pageIndex < pages.length;
      pageIndex++
    ) {
      const canvas = drawSpecCard(
        shoeName,
        specBrand.value,
        specGameVersion.value,
        pages[pageIndex],
        pageIndex,
        pages.length
      );

      const blob = await canvasToBlob(
        canvas,
        "image/png"
      );

      const filename =
        `${fileSlug}-spec-card-${pageIndex + 1}.png`;

      const file = new File(
        [blob],
        filename,
        { type: "image/png" }
      );

      files.push(file);
    }

    const result = await shareOrDownloadFiles(
      files,
      "The Sole Lab — Shoe Specs",
      `${shoeName} - ${specGameVersion.value}`
    );

    if (result !== "cancelled") {
      trackEvent("solelab_download_spec_card", {
        brand: specBrand.value,
        layerCount: layers.length,
        cardCount: pages.length
      });
    }

  } catch (error) {
    console.error(
      "Spec card export failed:",
      error
    );

    alert(
      "Could not create your spec card. Please try again."
    );
  } finally {
    downloadSpecCardBtn.disabled = false;

    downloadSpecCardBtn.textContent =
      originalButtonText;
  }
}


/* ======================================================
   QUICK SHARE
   EVENTS
====================================================== */

addSpecLayerBtn.addEventListener("click", () => {
  addSpecLayer();
});

clearSpecFormBtn.addEventListener(
  "click",
  resetSpecForm
);

downloadSpecCardBtn.addEventListener(
  "click",
  downloadQuickShareSpec
);


/* ======================================================
   INITIALIZE THE SOLE LAB
====================================================== */

function initializeSoleLab() {
  /* POPULATE BOTH BRAND LISTS */

  populateBrandSelect(brandSelect);
  populateBrandSelect(specBrand);

  /* INITIALIZE PATTERN MANAGER */

  resetForm();

  /* INITIALIZE QUICK SHARE */

  resetSpecForm();

  /* DEFAULT TO PATTERN MANAGER */

  switchTool("pattern");
}

initializeSoleLab();
