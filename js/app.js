
/* THE SOLE LAB — NBA 2K27: PATTERN MANAGER + QUICK SHARE */

const BRANDS_2K27 = [
  "Nike", "Jordan", "Converse", "adidas", "Puma",
  "New Balance", "Reebok", "Under Armour", "Anta",
  "Li-Ning", "AND 1", "Peak", "Rigorer", "Qiaodan",
  "361", "Skechers", "741", "2K Brand"
];

const MATERIALS_2K27 = [
  "Default", "Rubber", "Metal", "Suede", "Leather",
  "Patent Leather", "Velvet", "Fabric", "Mesh",
  "Crocodile", "Denim Fabric", "Felt Fabric",
  "Fleece Fabric", "Knit Fabric",
  "Engineered Knit Fabric", "Synthetic Fabric",
  "Velvet Fabric", "Glitter", "Classic Leather",
  "Pebble Leather", "Rugged Leather", "Athletic Mesh",
  "Brushed Linear Metal", "Checker Metal",
  "Chrome Metal", "Diamond Metal", "Roundhole Metal",
  "Microfiber", "Ostrich", "Dull Plastic",
  "Semi-shiny Plastic", "Shiny Plastic",
  "Pebble Rubber", "Turing Rubber", "Sequins",
  "Snake", "Fine Suede", "Basket Weave",
  "Birdeye Weave", "Honeycomb Weave",
  "Reversed Honeycomb Weave", "Tabby Weave",
  "Twill Weave"
];

const PATTERNS_2K27 = Array.from(
  { length: 29 },
  (_, i) => ({
    id: `pattern-${String(i + 1).padStart(2, "0")}`,
    image: `assets/patterns/pattern-${String(i + 1).padStart(2, "0")}.jpg`,
    page: i < 20 ? 1 : 2
  })
);

const SOLE_LAB_LOGO = "assets/icons/TSL Logo.png";

const $ = id => document.getElementById(id);

const shoeNameInput = $("shoeName");
const brandSelect = $("brand");
const gameVersionSelect = $("gameVersion");
const componentsContainer = $("componentsContainer");
const addComponentBtn = $("addComponentBtn");
const clearFormBtn = $("clearFormBtn");
const downloadRecipeBtn = $("downloadRecipeBtn");

const patternToolBtn = $("patternToolBtn");
const specToolBtn = $("specToolBtn");
const patternTool = $("patternTool");
const specTool = $("specTool");

const specShoeName = $("specShoeName");
const specBrand = $("specBrand");
const specGameVersion = $("specGameVersion");
const specLayersContainer = $("specLayersContainer");

const addSpecLayerBtn = $("addSpecLayerBtn");
const downloadSpecCardBtn = $("downloadSpecCardBtn");
const clearSpecFormBtn = $("clearSpecFormBtn");

let specColorClipboard = null;
let patternColorClipboard = null;


/* ======================================================
   GENERAL HELPERS
====================================================== */

function trackEvent(name, data = {}) {
  if (window.umami?.track) {
    window.umami.track(name, data);
  }
}

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]
  );
}

function slugifyFileName(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function populateBrands(select) {
  select.innerHTML = BRANDS_2K27
    .map(v => `
      <option value="${escapeHTML(v)}">
        ${escapeHTML(v)}
      </option>
    `)
    .join("");
}

function materialOptions(selected = "Default") {
  return MATERIALS_2K27
    .map(v => `
      <option
        value="${escapeHTML(v)}"
        ${v === selected ? "selected" : ""}
      >
        ${escapeHTML(v)}
      </option>
    `)
    .join("");
}

function clamp(value, min, max, fallback = min) {
  const n = Number(value);

  return Number.isFinite(n)
    ? Math.min(max, Math.max(min, n))
    : fallback;
}

function channel(value) {
  return Math.round(clamp(value, 0, 255));
}

function patternById(id) {
  return PATTERNS_2K27.find(
    p => p.id === id
  ) || PATTERNS_2K27[0];
}

function patternStyle(pattern) {
  return `
    background-image:url('${pattern.image}');
    background-size:cover;
    background-position:center;
    background-repeat:no-repeat;
  `;
}

function rgbCSS(color) {
  return `rgb(${color.red},${color.green},${color.blue})`;
}


/* ======================================================
   CANVAS FONT HELPERS — ANTON
====================================================== */

function drawText(
  ctx,
  text,
  x,
  y,
  maxWidth,
  size = 24,
  minimum = 15
) {
  text = String(text);

  let s = size;

  while (s > minimum) {
    ctx.font = `${s}px "Anton", sans-serif`;

    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }

    s--;
  }

  ctx.font = `${s}px "Anton", sans-serif`;

  while (
    text.length &&
    ctx.measureText(text).width > maxWidth
  ) {
    text = text.slice(0, -1);
  }

  ctx.fillText(text, x, y);
}

async function loadExportFonts() {
  try {
    await document.fonts.load('32px "Anton"');
    await document.fonts.ready;
  } catch (e) {
    console.warn(
      "Anton could not be loaded; browser fallback will be used.",
      e
    );
  }
}


/* ======================================================
   IMAGE / FILE HELPERS
====================================================== */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => reject(
      new Error(`Could not load ${src}`)
    );

    img.src = src;
  });
}

function canvasToBlob(
  canvas,
  type = "image/png",
  quality = 0.93
) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => b
        ? resolve(b)
        : reject(new Error("Export failed")),
      type,
      quality
    );
  });
}

async function shareOrDownload(files, title, text) {
  if (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) &&
    navigator.share &&
    navigator.canShare?.({ files })
  ) {
    try {
      await navigator.share({
        files,
        title,
        text
      });

      return "shared";
    } catch (e) {
      if (e.name === "AbortError") {
        return "cancelled";
      }

      console.warn("Share failed", e);
    }
  }

  files.forEach(file => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");

    a.href = url;
    a.download = file.name;

    document.body.append(a);
    a.click();
    a.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 30000);
  });

  return "downloaded";
}


/* ======================================================
   TOOL NAVIGATION
====================================================== */

function switchTool(name) {
  const spec = name === "spec";

  patternTool.hidden = spec;
  specTool.hidden = !spec;

  patternTool.classList.toggle("active", !spec);
  specTool.classList.toggle("active", spec);

  patternToolBtn.classList.toggle("active", !spec);
  specToolBtn.classList.toggle("active", spec);

  patternToolBtn.setAttribute(
    "aria-selected",
    String(!spec)
  );

  specToolBtn.setAttribute(
    "aria-selected",
    String(spec)
  );
}


/* ======================================================
   PATTERN MANAGER — PATTERN PICKER
====================================================== */

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

      <div class="pattern-picker">
        ${[1, 2].map(page => `
          <div class="pattern-page-group">

            <div class="pattern-page-title">
              Page ${page}
            </div>

            <div class="pattern-grid">
              ${PATTERNS_2K27
                .filter(p => p.page === page)
                .map(p => `
                  <button
                    type="button"
                    class="pattern-option ${p.id === pattern.id ? "is-selected" : ""}"
                    data-pattern-id="${p.id}"
                    aria-label="Select pattern ${p.id}"
                  >
                    <span
                      class="pattern-swatch"
                      style="${patternStyle(p)}"
                    ></span>
                  </button>
                `)
                .join("")}
            </div>

          </div>
        `).join("")}
      </div>

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
        ${[
          ["red", "R"],
          ["green", "G"],
          ["blue", "B"]
        ].map(([key, label]) => `
          <div class="rgb-row">

            <span class="rgb-label">
              ${label}:
            </span>

            <input
              type="number"
              inputmode="numeric"
              min="0"
              max="255"
              step="1"
              class="color-${n}-${key} rgb-value"
              value="${channel(color[key] ?? 0)}"
            >

          </div>
        `).join("")}
      </div>

    </div>
  `;
}

function rgbFromCard(card, n) {
  return Object.fromEntries(
    ["red", "green", "blue"].map(k => [
      k,
      channel(
        card.querySelector(
          `.color-${n}-${k}`
        ).value
      )
    ])
  );
}

function componentValues(card) {
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

    x: Number(
      card.querySelector(".component-x").value
    ),

    y: Number(
      card.querySelector(".component-y").value
    ),

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

      const summary = card.querySelector(
        ".pattern-component-summary"
      );

      summary.textContent =
        `${card.querySelector(".component-name").value.trim() || "Untitled component"} · ${card.querySelector(".component-material").value}`;
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

function closeAllPatternPickers(except = null) {
  componentsContainer
    .querySelectorAll(".pattern-picker-open")
    .forEach(card => {
      if (card !== except) {
        card.classList.remove("pattern-picker-open");
      }
    });
}


/* ======================================================
   PATTERN MANAGER — CREATE COMPONENT
====================================================== */

function createComponentRow(data = {}) {
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

    trackEvent("solelab_remove_component");
  });

  /* DUPLICATE */

  card.querySelector(
    ".pattern-duplicate-btn"
  ).addEventListener("click", () => {
    const copy = createComponentRow(
      componentValues(card)
    );

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
    updateComponentNumbers
  );

  card.querySelector(
    ".component-material"
  ).addEventListener(
    "change",
    updateComponentNumbers
  );

  /* PATTERN PICKER */

  const trigger = card.querySelector(
    ".pattern-picker-trigger"
  );

  trigger.addEventListener("click", () => {
    const wasOpen =
      card.classList.contains("pattern-picker-open");

    closeAllPatternPickers(card);

    card.classList.toggle(
      "pattern-picker-open",
      !wasOpen
    );

    trackEvent("solelab_open_pattern_picker");
  });

  card.querySelectorAll(
    ".pattern-option"
  ).forEach(option => {
    option.addEventListener("click", () => {
      const p = patternById(
        option.dataset.patternId
      );

      card.querySelector(
        ".component-pattern-id"
      ).value = p.id;

      card.querySelector(
        ".pattern-trigger-preview"
      ).setAttribute(
        "style",
        patternStyle(p)
      );

      card.querySelectorAll(
        ".pattern-option"
      ).forEach(button => {
        button.classList.toggle(
          "is-selected",
          button === option
        );
      });

      card.classList.remove(
        "pattern-picker-open"
      );

      trackEvent(
        "solelab_select_pattern",
        {
          patternId: p.id,
          page: p.page
        }
      );
    });
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

    actions.append(copy, paste);
    colorCard.append(swatch, actions);

    copy.addEventListener("click", () => {
      patternColorClipboard =
        rgbFromCard(card, n);

      copy.textContent = "Copied!";

      setTimeout(() => {
        if (copy.isConnected) {
          copy.textContent = "Copy";
        }
      }, 1200);

      trackEvent("solelab_copy_pattern_color");
    });

    paste.addEventListener("click", () => {
      if (!patternColorClipboard) {
        return;
      }

      for (
        const [key, value] of
        Object.entries(patternColorClipboard)
      ) {
        card.querySelector(
          `.color-${n}-${key}`
        ).value = value;
      }

      updatePatternColors(card);

      paste.textContent = "Pasted!";

      setTimeout(() => {
        if (paste.isConnected) {
          paste.textContent = "Paste";
        }
      }, 1200);

      trackEvent("solelab_paste_pattern_color");
    });
  });

  /* RGB VALIDATION AND LIVE SWATCHES */

  card.querySelectorAll(
    ".rgb-value"
  ).forEach(input => {
    input.addEventListener("focus", () => {
      if (input.value === "0") {
        input.value = "";
      }
    });

    input.addEventListener("input", () => {
      if (input.value !== "") {
        input.value = channel(input.value);
      }

      updatePatternColors(card);
    });

    input.addEventListener("change", () => {
      input.value = channel(input.value);
      updatePatternColors(card);
    });
  });

  /* SCALE AND ROTATION */

  for (const [selector, min, max] of [
    [".component-x", 0.5, 12],
    [".component-y", 0, 6.28]
  ]) {
    const field = card.querySelector(selector);

    field.addEventListener("focus", () => {
      if (
        field.value ===
        (selector === ".component-x" ? "0.50" : "0.00")
      ) {
        field.value = "";
      }
    });

    field.addEventListener("change", () => {
      field.value =
        clamp(field.value, min, max).toFixed(2);
    });
  }

  updatePatternColors(card);
  updateComponentNumbers();

  return card;
}


/* ======================================================
   PATTERN MANAGER — RESET AND VALIDATION
====================================================== */

function resetForm() {
  shoeNameInput.value = "";
  brandSelect.value = BRANDS_2K27[0];
  gameVersionSelect.value = "NBA 2K27";

  componentsContainer.replaceChildren();

  patternColorClipboard = null;

  createComponentRow();
}

function validateComponents(items) {
  for (const p of items) {
    if (!(p.x >= 0.5 && p.x <= 12)) {
      alert(
        `${p.name}: Scale must be 0.50–12.00`
      );

      return false;
    }

    if (!(p.y >= 0 && p.y <= 6.28)) {
      alert(
        `${p.name}: Rotation must be 0.00–6.28`
      );

      return false;
    }

    for (const color of [
      p.color1,
      p.color2,
      p.color3
    ]) {
      if (
        Object.values(color).some(
          v =>
            !Number.isInteger(v) ||
            v < 0 ||
            v > 255
        )
      ) {
        alert(
          `${p.name}: RGB must be 0–255`
        );

        return false;
      }
    }
  }

  return true;
}


/* ======================================================
   PATTERN MANAGER — JPEG DRAWING
====================================================== */

function drawPatternColor(ctx, label, color, x, y) {
  ctx.fillStyle = "#9da7b2";

  drawText(
    ctx, label, x, y, 175, 16
  );

  ctx.fillStyle = rgbCSS(color);
  ctx.fillRect(x, y + 10, 28, 28);

  ctx.strokeStyle = "#65717c";
  ctx.strokeRect(x, y + 10, 28, 28);

  ctx.fillStyle = "#ffffff";

  drawText(
    ctx,
    `${color.red}, ${color.green}, ${color.blue}`,
    x + 38,
    y + 33,
    185,
    19,
    15
  );
}

async function renderPatternPage(
  shoe,
  brand,
  version,
  items,
  page,
  total
) {
  const canvas = document.createElement("canvas");

  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  /* BACKGROUND */

  ctx.fillStyle = "#0d1014";
  ctx.fillRect(0, 0, 1080, 1350);

  /* HEADER */

  ctx.fillStyle = "#8ac73f";
  ctx.fillRect(65, 58, 8, 87);

  ctx.fillStyle = "#ffffff";

  drawText(
    ctx,
    "THE SOLE LAB",
    95,
    103,
    860,
    48
  );

  ctx.fillStyle = "#8ac73f";

  drawText(
    ctx,
    "PATTERN MANAGER / SHOE SPECS",
    96,
    142,
    850,
    22
  );

  /* SHOE INFORMATION */

  ctx.fillStyle = "#191f26";
  ctx.fillRect(65, 175, 950, 130);

  ctx.fillStyle = "#ffffff";

  drawText(
    ctx,
    shoe,
    90,
    225,
    885,
    37,
    22
  );

  ctx.fillStyle = "#9da7b2";

  drawText(
    ctx,
    `${brand}  •  ${version}  •  Card ${page + 1} of ${total}`,
    90,
    274,
    885,
    23,
    17
  );

  /* COMPONENTS */

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const y = 325 + i * 181;

    ctx.fillStyle = "#191f26";
    ctx.fillRect(65, y, 950, 170);

    /* COMPONENT NUMBER */

    ctx.fillStyle = "#8ac73f";

    drawText(
      ctx,
      String(page * 5 + i + 1).padStart(2, "0"),
      82,
      y + 31,
      38,
      23
    );

    /* COMPONENT NAME */

    ctx.fillStyle = "#ffffff";

    drawText(
      ctx,
      item.name,
      125,
      y + 31,
      465,
      26,
      18
    );

    /* MATERIAL */

    ctx.fillStyle = "#c9d1d9";

    drawText(
      ctx,
      item.material,
      625,
      y + 30,
      365,
      20
    );

    /* ACTUAL PATTERN IMAGE */

    const pattern = patternById(
      item.patternId
    );

    try {
      ctx.drawImage(
        await loadImage(pattern.image),
        84,
        y + 54,
        88,
        88
      );
    } catch (e) {
      ctx.fillStyle = "#30363d";

      ctx.fillRect(
        84,
        y + 54,
        88,
        88
      );
    }

    ctx.fillStyle = "#9da7b2";

    drawText(
      ctx,
      `Pattern ${pattern.id.slice(-2)}`,
      84,
      y + 160,
      90,
      15
    );

    /* PATTERN COLORS */

    drawPatternColor(
      ctx,
      "COLOR 1",
      item.color1,
      192,
      y + 67
    );

    drawPatternColor(
      ctx,
      "COLOR 2",
      item.color2,
      463,
      y + 67
    );

    drawPatternColor(
      ctx,
      "COLOR 3",
      item.color3,
      734,
      y + 67
    );

    /* SCALE AND ROTATION */

    ctx.fillStyle = "#aeb7c2";

    drawText(
      ctx,
      `X Scale: ${item.x.toFixed(2)}     Y Rotation: ${item.y.toFixed(2)}`,
      192,
      y + 148,
      345,
      16
    );

    /* OPTIONAL NOTES */

    if (item.notes) {
      drawText(
        ctx,
        `Notes: ${item.notes}`,
        548,
        y + 148,
        455,
        16,
        14
      );
    }
  }

  /* FOOTER */

  ctx.fillStyle = "#30363d";
  ctx.fillRect(65, 1259, 950, 2);

  ctx.fillStyle = "#9da7b2";

  drawText(
    ctx,
    "NBA 2K Shoe Creator Pattern Manager",
    65,
    1300,
    670,
    18
  );

  ctx.fillStyle = "#8ac73f";

  drawText(
    ctx,
    "THE SOLE LAB",
    866,
    1300,
    149,
    18
  );

  return canvas;
}


/* ======================================================
   PATTERN MANAGER — JPEG DOWNLOAD
====================================================== */

async function downloadRecipeJPEG() {
  const shoe = shoeNameInput.value.trim();

  if (!shoe) {
    alert("Enter a shoe name before downloading.");
    shoeNameInput.focus();
    return;
  }

  const cards = [
    ...componentsContainer.querySelectorAll(
      ".component-card"
    )
  ];

  const items = cards
    .filter(card =>
      card.querySelector(
        ".component-name"
      ).value.trim()
    )
    .map(componentValues);

  if (!items.length) {
    alert("Add at least one named component.");
    return;
  }

  if (!validateComponents(items)) {
    return;
  }

  downloadRecipeBtn.disabled = true;

  try {
    await loadExportFonts();

    const files = [];
    const total = Math.ceil(items.length / 5);

    for (let page = 0; page < total; page++) {
      const canvas = await renderPatternPage(
        shoe,
        brandSelect.value,
        gameVersionSelect.value,
        items.slice(page * 5, (page + 1) * 5),
        page,
        total
      );

      const blob = await canvasToBlob(
        canvas,
        "image/jpeg",
        0.93
      );

      files.push(
        new File(
          [blob],
          `${slugifyFileName(shoe) || "shoe"}-pattern-${page + 1}.jpg`,
          { type: "image/jpeg" }
        )
      );
    }

    const result = await shareOrDownload(
      files,
      "The Sole Lab — Pattern Specs",
      `${shoe} - ${gameVersionSelect.value}`
    );

    if (result !== "cancelled") {
      trackEvent("solelab_download_jpeg", {
        brand: brandSelect.value,
        componentCount: items.length,
        cardCount: total
      });
    }
  } catch (e) {
    console.error("Pattern export failed", e);

    alert("Could not export the pattern cards.");
  } finally {
    downloadRecipeBtn.disabled = false;
  }
}


/* ======================================================
   QUICK SHARE — LAYER HELPERS
====================================================== */

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

function readSpecLayer(card) {
  return {
    name: card.querySelector(
      ".spec-layer-name"
    ).value.trim(),

    material: card.querySelector(
      ".spec-layer-material"
    ).value,

    red: channel(
      card.querySelector(".spec-red").value
    ),

    green: channel(
      card.querySelector(".spec-green").value
    ),

    blue: channel(
      card.querySelector(".spec-blue").value
    )
  };
}

function updateSpecColorPreview(card) {
  const p = readSpecLayer(card);

  card.querySelector(
    ".spec-color-preview"
  ).style.backgroundColor = rgbCSS(p);
}

function updateSpecPasteButtons() {
  specLayersContainer
    .querySelectorAll(".spec-paste-color-btn")
    .forEach(btn => {
      btn.disabled = !specColorClipboard;
    });
}


/* ======================================================
   QUICK SHARE — CREATE LAYER
====================================================== */

function addSpecLayer(data = {}) {
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
          ${[
            ["red", "R"],
            ["green", "G"],
            ["blue", "B"]
          ].map(([key, label]) => `
            <div class="field-group">

              <label>${label}</label>

              <input
                type="number"
                inputmode="numeric"
                class="spec-${key}"
                min="0"
                max="255"
                step="1"
                value="${channel(data[key] ?? 0)}"
              >

            </div>
          `).join("")}

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
            ${specColorClipboard ? "" : "disabled"}
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

    trackEvent("solelab_remove_spec_layer");
  });

  /* DUPLICATE */

  card.querySelector(
    ".spec-duplicate-layer-btn"
  ).addEventListener("click", () => {
    const copy = addSpecLayer(
      readSpecLayer(card)
    );

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

  copyBtn.addEventListener("click", () => {
    const p = readSpecLayer(card);

    specColorClipboard = {
      red: p.red,
      green: p.green,
      blue: p.blue
    };

    updateSpecPasteButtons();

    copyBtn.textContent = "✓ Copied!";

    setTimeout(() => {
      if (copyBtn.isConnected) {
        copyBtn.textContent = "Copy Color";
      }
    }, 1200);

    trackEvent("solelab_copy_color");
  });

  pasteBtn.addEventListener("click", () => {
    if (!specColorClipboard) {
      return;
    }

    for (
      const [key, value] of
      Object.entries(specColorClipboard)
    ) {
      card.querySelector(
        `.spec-${key}`
      ).value = value;
    }

    updateSpecColorPreview(card);

    pasteBtn.textContent = "✓ Pasted!";

    setTimeout(() => {
      if (pasteBtn.isConnected) {
        pasteBtn.textContent = "Paste Color";
      }
    }, 1200);

    trackEvent("solelab_paste_color");
  });

  /* RGB EVENTS */

  card.querySelectorAll(
    ".spec-red,.spec-green,.spec-blue"
  ).forEach(input => {
    input.addEventListener("focus", () => {
      if (input.value === "0") {
        input.value = "";
      }
    });

    input.addEventListener("input", () => {
      updateSpecColorPreview(card);
    });

    input.addEventListener("change", () => {
      input.value = channel(input.value);
      updateSpecColorPreview(card);
    });
  });

  return card;
}


/* ======================================================
   QUICK SHARE — RESET / VALIDATION
====================================================== */

function resetSpecForm() {
  specShoeName.value = "";
  specBrand.value = BRANDS_2K27[0];
  specGameVersion.value = "NBA 2K27";

  specLayersContainer.replaceChildren();

  specColorClipboard = null;

  addSpecLayer();
}

function validSpecLayers() {
  const cards = [
    ...specLayersContainer.querySelectorAll(
      ".spec-layer-card"
    )
  ].filter(c =>
    c.querySelector(
      ".spec-layer-name"
    ).value.trim()
  );

  if (!cards.length) {
    alert("Enter at least one shoe layer name.");
    return null;
  }

  for (const c of cards) {
    for (
      const input of
      c.querySelectorAll(
        ".spec-red,.spec-green,.spec-blue"
      )
    ) {
      const n = Number(input.value);

      if (
        input.value.trim() === "" ||
        !Number.isInteger(n) ||
        n < 0 ||
        n > 255
      ) {
        alert(
          `${c.querySelector(".spec-layer-name").value}: RGB values must be 0–255.`
        );

        input.focus();

        return null;
      }
    }
  }

  return cards.map(readSpecLayer);
}


/* ======================================================
   QUICK SHARE — PNG CARD
====================================================== */

function drawSpecCard(
  shoe,
  brand,
  version,
  layers,
  page,
  total
) {
  const canvas = document.createElement("canvas");

  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  /* BACKGROUND */

  ctx.fillStyle = "#0d1014";
  ctx.fillRect(0, 0, 1080, 1350);

  /* HEADER */

  ctx.fillStyle = "#8ac73f";
  ctx.fillRect(65, 67, 8, 85);

  ctx.fillStyle = "#ffffff";

  drawText(
    ctx,
    "THE SOLE LAB",
    98,
    114,
    870,
    56
  );

  ctx.fillStyle = "#8ac73f";

  drawText(
    ctx,
    "QUICK SHARE / SHOE SPECS",
    99,
    151,
    830,
    24
  );

  /* SHOE INFORMATION */

  ctx.fillStyle = "#14191f";
  ctx.fillRect(65, 185, 950, 174);

  ctx.fillStyle = "#ffffff";

  drawText(
    ctx,
    shoe,
    96,
    246,
    865,
    41,
    22
  );

  ctx.fillStyle = "#9da7b2";

  drawText(
    ctx,
    `${brand}   •   ${version}`,
    96,
    293,
    870,
    25
  );

  drawText(
    ctx,
    `LAYERS ${page * 10 + 1}–${page * 10 + layers.length}  •  CARD ${page + 1} OF ${total}`,
    96,
    332,
    870,
    19
  );

  /* COLUMN HEADERS */

  ctx.fillStyle = "#8ac73f";
  ctx.fillRect(65, 386, 950, 3);

  ctx.fillStyle = "#9da7b2";

  for (const [text, x] of [
    ["#", 84],
    ["LAYER", 135],
    ["MATERIAL", 535],
    ["RGB", 790]
  ]) {
    drawText(
      ctx,
      text,
      x,
      428,
      210,
      20
    );
  }

  /* LAYER ROWS */

  layers.forEach((p, i) => {
    const y = 446 + i * 76;

    ctx.fillStyle =
      i % 2 === 0
        ? "#191f26"
        : "#14191f";

    ctx.fillRect(65, y, 950, 72);

    ctx.fillStyle = "#8ac73f";

    drawText(
      ctx,
      String(page * 10 + i + 1).padStart(2, "0"),
      84,
      y + 44,
      43,
      21
    );

    /* LAYER */

    ctx.fillStyle = "#ffffff";

    drawText(
      ctx,
      p.name,
      135,
      y + 44,
      380,
      23,
      17
    );

    /* MATERIAL */

    ctx.fillStyle = "#c9d1d9";

    drawText(
      ctx,
      p.material,
      535,
      y + 44,
      235,
      19,
      16
    );

    /* RGB SWATCH */

    ctx.fillStyle = rgbCSS(p);
    ctx.fillRect(790, y + 21, 30, 30);

    ctx.strokeStyle = "#68737e";
    ctx.strokeRect(790, y + 21, 30, 30);

    /* RGB NUMBERS */

    ctx.fillStyle = "#ffffff";

    drawText(
      ctx,
      `${p.red}, ${p.green}, ${p.blue}`,
      835,
      y + 44,
      170,
      20,
      16
    );
  });

  /* FOOTER */

  ctx.fillStyle = "#283039";
  ctx.fillRect(65, 1254, 950, 2);

  ctx.fillStyle = "#9da7b2";

  drawText(
    ctx,
    "NBA 2K Shoe Creator • RGB values 0–255",
    65,
    1299,
    750,
    20
  );

  ctx.fillStyle = "#8ac73f";

  drawText(
    ctx,
    "THE SOLE LAB",
    881,
    1299,
    134,
    20
  );

  return canvas;
}


/* ======================================================
   QUICK SHARE — PNG DOWNLOAD
====================================================== */

async function downloadQuickShareSpec() {
  const shoe = specShoeName.value.trim();

  if (!shoe) {
    alert("Enter a shoe name before downloading.");
    specShoeName.focus();
    return;
  }

  const layers = validSpecLayers();

  if (!layers) {
    return;
  }

  const count = Math.ceil(layers.length / 10);
  const original = downloadSpecCardBtn.textContent;

  downloadSpecCardBtn.disabled = true;

  downloadSpecCardBtn.textContent =
    "Preparing Spec Cards...";

  try {
    await loadExportFonts();

    const files = [];

    for (let page = 0; page < count; page++) {
      const canvas = drawSpecCard(
        shoe,
        specBrand.value,
        specGameVersion.value,
        layers.slice(
          page * 10,
          (page + 1) * 10
        ),
        page,
        count
      );

      const blob = await canvasToBlob(canvas);

      files.push(
        new File(
          [blob],
          `${slugifyFileName(shoe) || "shoe"}-spec-card-${page + 1}.png`,
          { type: "image/png" }
        )
      );
    }

    const result = await shareOrDownload(
      files,
      "The Sole Lab — Shoe Specs",
      `${shoe} - ${specGameVersion.value}`
    );

    if (result !== "cancelled") {
      trackEvent(
        "solelab_download_spec_card",
        {
          brand: specBrand.value,
          layerCount: layers.length,
          cardCount: count
        }
      );
    }
  } catch (e) {
    console.error("Spec export failed", e);

    alert("Could not create your spec card.");
  } finally {
    downloadSpecCardBtn.disabled = false;
    downloadSpecCardBtn.textContent = original;
  }
}


/* ======================================================
   INITIALIZE THE SOLE LAB
====================================================== */

function initializeSoleLab() {
  populateBrands(brandSelect);
  populateBrands(specBrand);

  resetForm();
  resetSpecForm();

  switchTool("pattern");
}

/* NAVIGATION */

patternToolBtn.addEventListener(
  "click",
  () => switchTool("pattern")
);

specToolBtn.addEventListener(
  "click",
  () => switchTool("spec")
);

/* PATTERN MANAGER */

addComponentBtn.addEventListener("click", () => {
  createComponentRow();
  trackEvent("solelab_add_component");
});

clearFormBtn.addEventListener(
  "click",
  resetForm
);

downloadRecipeBtn.addEventListener(
  "click",
  downloadRecipeJPEG
);

/* QUICK SHARE */

addSpecLayerBtn.addEventListener("click", () => {
  addSpecLayer();
  trackEvent("solelab_add_spec_layer");
});

clearSpecFormBtn.addEventListener(
  "click",
  resetSpecForm
);

downloadSpecCardBtn.addEventListener(
  "click",
  downloadQuickShareSpec
);

/* CLOSE PATTERN PICKER */

document.addEventListener("click", e => {
  if (!e.target.closest(".pattern-field-group")) {
    closeAllPatternPickers();
  }
});

/* START */

initializeSoleLab();
