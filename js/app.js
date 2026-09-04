/* ======================================================
   THE SOLE LAB
   NBA 2K SHOE RECIPE TRACKER
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
  "Patent Leather",
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


/* ======================================================
   NBA 2K27 PATTERNS
====================================================== */

const PATTERNS_2K27 = Array.from(
  { length: 29 },
  (_, index) => {

    const number =
      String(index + 1).padStart(2, "0");

    return {
      id: `pattern-${number}`,
      image: `assets/patterns/pattern-${number}.jpg`,
      page: index < 20 ? 1 : 2
    };

  }
);


/* ======================================================
   SOLE LAB LOGO
====================================================== */

const SOLE_LAB_LOGO =
  "assets/icons/TSL Logo.png";


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

/* ======================================================
   UMAMI
====================================================== */

function trackEvent(
  eventName,
  eventData = {}
) {

  if (window.umami) {

    umami.track(
      eventName,
      eventData
    );

  }

}


/* ======================================================
   BRAND OPTIONS
====================================================== */

function populateBrandOptions() {

  brandSelect.innerHTML = "";


  BRANDS_2K27.forEach(
    brand => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        brand;

      option.textContent =
        brand;

      brandSelect.appendChild(
        option
      );

    }
  );

}


/* ======================================================
   MATERIAL OPTIONS
====================================================== */

function getMaterialOptions(
  selectedMaterial = "Default"
) {

  return MATERIALS_2K27
    .map(
      material => {

        const selected =
          material === selectedMaterial
            ? "selected"
            : "";

        return `
          <option
            value="${material}"
            ${selected}
          >
            ${material}
          </option>
        `;

      }
    )
    .join("");

}


/* ======================================================
   PATTERN HELPERS
====================================================== */

function getPatternById(
  patternId
) {

  return (
    PATTERNS_2K27.find(
      pattern =>
        pattern.id === patternId
    )
    ||
    PATTERNS_2K27[0]
  );

}


function getPatternsByPage(
  pageNumber
) {

  return PATTERNS_2K27.filter(
    pattern =>
      pattern.page === pageNumber
  );

}


/* ======================================================
   PATTERN SWATCH IMAGE
====================================================== */

function getSwatchStyle(
  pattern
) {

  return [
    `background-image: url('${pattern.image}')`,
    "background-size: cover",
    "background-position: center",
    "background-repeat: no-repeat"
  ].join("; ");

}


/* ======================================================
   PATTERN PAGE
====================================================== */

function createPatternPageMarkup(
  pageNumber,
  selectedPatternId
) {

  const patterns =
    getPatternsByPage(
      pageNumber
    );

  return `

    <div class="pattern-page-group">

      <div class="pattern-page-title">
        Page ${pageNumber}
      </div>

      <div class="pattern-grid">

        ${patterns
          .map(
            pattern => {

              const isSelected =
                pattern.id === selectedPatternId
                  ? "is-selected"
                  : "";

              return `

                <button
                  type="button"
                  class="pattern-option ${isSelected}"
                  data-pattern-id="${pattern.id}"
                  aria-label="Select pattern swatch"
                >

                  <span
                    class="pattern-swatch"
                    style="${getSwatchStyle(pattern)}"
                  ></span>

                </button>

              `;

            }
          )
          .join("")}

      </div>

    </div>

  `;

}


/* ======================================================
   PATTERN PICKER
====================================================== */

function createPatternPickerMarkup(
  selectedPatternId = "pattern-01"
) {

  const selectedPattern =
    getPatternById(
      selectedPatternId
    );

  return `

    <div class="field-group pattern-field-group">

      <label>
        Pattern
      </label>

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
          1,
          selectedPattern.id
        )}

        ${createPatternPageMarkup(
          2,
          selectedPattern.id
        )}

      </div>

    </div>

  `;

}


/* ======================================================
   CLOSE PATTERN PICKERS
====================================================== */

function closeAllPatternPickers(
  exceptCard = null
) {

  document
    .querySelectorAll(
      ".component-card.pattern-picker-open"
    )
    .forEach(
      card => {

        if (
          card !== exceptCard
        ) {

          card.classList.remove(
            "pattern-picker-open"
          );

        }

      }
    );

}


/* ======================================================
   RGB FIELD
====================================================== */

function createRGBGroup(
  colorNumber,
  color = {}
) {

  return `

    <div class="color-card">

      <div class="color-card-title">
        Color ${colorNumber}
      </div>

      <div class="rgb-stack">

        <div class="rgb-row">

          <span class="rgb-label">
            R:
          </span>

          <input
            type="number"
            inputmode="numeric"
            class="color-${colorNumber}-red rgb-value"
            min="0"
            max="255"
            step="1"
            value="${color.red ?? 0}"
          />

        </div>

        <div class="rgb-row">

          <span class="rgb-label">
            G:
          </span>

          <input
            type="number"
            inputmode="numeric"
            class="color-${colorNumber}-green rgb-value"
            min="0"
            max="255"
            step="1"
            value="${color.green ?? 0}"
          />

        </div>

        <div class="rgb-row">

          <span class="rgb-label">
            B:
          </span>

          <input
            type="number"
            inputmode="numeric"
            class="color-${colorNumber}-blue rgb-value"
            min="0"
            max="255"
            step="1"
            value="${color.blue ?? 0}"
          />

        </div>

      </div>

    </div>

  `;

}


/* ======================================================
   COMPONENT CREATION
====================================================== */

function createComponentRow(
  component = {}
) {

  const componentCard =
    document.createElement(
      "div"
    );

  componentCard.className =
    "component-card";


  componentCard.innerHTML = `

    <div class="component-card-header">

      <h3>
        Shoe Component
      </h3>

      <button
        type="button"
        class="remove-component-btn"
      >
        Remove
      </button>

    </div>


    <div class="component-main-grid">

      <div class="field-group">

        <label>
          Component Name
        </label>

        <input
          type="text"
          class="component-name"
          placeholder="Example: Base"
          value="${component.name || ""}"
        />

      </div>


      <div class="field-group">

        <label>
          Material
        </label>

        <select
          class="component-material"
        >

          ${getMaterialOptions(
            component.material ||
            "Default"
          )}

        </select>

      </div>


      ${createPatternPickerMarkup(
        component.patternId ||
        "pattern-01"
      )}

    </div>


    <div class="component-section">

      <div class="component-section-title">
        Pattern Colors
      </div>

      <div class="color-grid">

        ${createRGBGroup(
          1,
          component.color1
        )}

        ${createRGBGroup(
          2,
          component.color2
        )}

        ${createRGBGroup(
          3,
          component.color3
        )}

      </div>

    </div>


    <div class="component-section">

      <div class="component-section-title">
        Pattern Position
      </div>

      <div class="position-grid">

        <div class="field-group">

          <label>
            X — Scale
          </label>

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

          <label>
            Y — Rotation
          </label>

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

      <label>
        Notes
      </label>

      <input
        type="text"
        class="component-notes"
        placeholder="Optional notes"
        value="${component.notes || ""}"
      />

    </div>

  `;


  componentsContainer.appendChild(
    componentCard
  );


  wireComponentCard(
    componentCard
  );

}


/* ======================================================
   COMPONENT EVENTS
====================================================== */

function wireComponentCard(
  componentCard
) {

  const removeBtn =
    componentCard.querySelector(
      ".remove-component-btn"
    );

  const patternTrigger =
    componentCard.querySelector(
      ".pattern-picker-trigger"
    );

  const hiddenPatternInput =
    componentCard.querySelector(
      ".component-pattern-id"
    );

  const previewSwatch =
    componentCard.querySelector(
      ".pattern-trigger-preview"
    );

  const patternOptions =
    componentCard.querySelectorAll(
      ".pattern-option"
    );

  const rgbInputs =
    componentCard.querySelectorAll(
      ".rgb-value"
    );

  const scaleInput =
    componentCard.querySelector(
      ".component-x"
    );

  const rotationInput =
    componentCard.querySelector(
      ".component-y"
    );


 /* CLEAR DEFAULT VALUES ON FOCUS */

rgbInputs.forEach(
  input => {

    input.addEventListener(
      "focus",
      function () {

        if (
          input.value === "0"
        ) {
          input.value = "";
        }

      }
    );

  }
);


scaleInput.addEventListener(
  "focus",
  function () {

    if (
      scaleInput.value === "0.50"
    ) {
      scaleInput.value = "";
    }

  }
);


rotationInput.addEventListener(
  "focus",
  function () {

    if (
      rotationInput.value === "0.00"
    ) {
      rotationInput.value = "";
    }

  }
);

  /* RGB LIMITS */

  rgbInputs.forEach(
    input => {

      input.addEventListener(
        "input",
        function () {

          clampRGBInput(
            input
          );

        }
      );

    }
  );


  /* SCALE LIMITS */

  scaleInput.addEventListener(
    "change",
    function () {

      clampScaleInput(
        scaleInput
      );

    }
  );


  /* ROTATION LIMITS */

  rotationInput.addEventListener(
    "change",
    function () {

      clampRotationInput(
        rotationInput
      );

    }
  );


  /* REMOVE COMPONENT */

  removeBtn.addEventListener(
    "click",
    function () {

      componentCard.remove();

      trackEvent(
        "solelab_remove_component"
      );

    }
  );


  /* OPEN PATTERN PICKER */

  patternTrigger.addEventListener(
    "click",
    function () {

      const isOpen =
        componentCard.classList.contains(
          "pattern-picker-open"
        );

      closeAllPatternPickers(
        componentCard
      );

      componentCard.classList.toggle(
        "pattern-picker-open",
        !isOpen
      );

      trackEvent(
        "solelab_open_pattern_picker"
      );

    }
  );


  /* SELECT PATTERN */

  patternOptions.forEach(
    option => {

      option.addEventListener(
        "click",
        function () {

          const patternId =
            option.dataset.patternId;

          const selectedPattern =
            getPatternById(
              patternId
            );

          hiddenPatternInput.value =
            selectedPattern.id;

          previewSwatch.setAttribute(
            "style",
            getSwatchStyle(
              selectedPattern
            )
          );

          patternOptions.forEach(
            item => {

              item.classList.remove(
                "is-selected"
              );

            }
          );

          option.classList.add(
            "is-selected"
          );

          componentCard.classList.remove(
            "pattern-picker-open"
          );

          trackEvent(
            "solelab_select_pattern",
            {
              patternId:
                selectedPattern.id,

              page:
                selectedPattern.page
            }
          );

        }
      );

    }
  );

}


/* ======================================================
   RGB LIMITS
====================================================== */

function clampRGBInput(
  input
) {

  let value =
    Number(
      input.value
    );


  if (value < 0) {
    value = 0;
  }


  if (value > 255) {
    value = 255;
  }


  input.value =
    value;

}


/* ======================================================
   SCALE LIMITS
====================================================== */

function clampScaleInput(
  input
) {

  let value =
    Number(
      input.value
    );


  if (value < 0.50) {
    value = 0.50;
  }


  if (value > 12.00) {
    value = 12.00;
  }


  input.value =
    value.toFixed(2);

}


/* ======================================================
   ROTATION LIMITS
====================================================== */

function clampRotationInput(
  input
) {

  let value =
    Number(
      input.value
    );


  if (value < 0) {
    value = 0;
  }


  if (value > 6.28) {
    value = 6.28;
  }


  input.value =
    value.toFixed(2);

}


/* ======================================================
   RGB VALUES
====================================================== */

function getRGBValues(
  card,
  colorNumber
) {

  return {

    red:
      Number(
        card.querySelector(
          `.color-${colorNumber}-red`
        ).value
      ),

    green:
      Number(
        card.querySelector(
          `.color-${colorNumber}-green`
        ).value
      ),

    blue:
      Number(
        card.querySelector(
          `.color-${colorNumber}-blue`
        ).value
      )

  };

}


/* ======================================================
   READ COMPONENT VALUES
====================================================== */

function getComponentValues() {

  const componentCards =
    document.querySelectorAll(
      ".component-card"
    );


  return Array
    .from(
      componentCards
    )
    .map(
      card => {

        return {

          name:
            card.querySelector(
              ".component-name"
            ).value.trim(),

          material:
            card.querySelector(
              ".component-material"
            ).value,

          patternId:
            card.querySelector(
              ".component-pattern-id"
            ).value,

          color1:
            getRGBValues(
              card,
              1
            ),

          color2:
            getRGBValues(
              card,
              2
            ),

          color3:
            getRGBValues(
              card,
              3
            ),

          x:
            Number(
              card.querySelector(
                ".component-x"
              ).value
            ),

          y:
            Number(
              card.querySelector(
                ".component-y"
              ).value
            ),

          notes:
            card.querySelector(
              ".component-notes"
            ).value.trim()

        };

      }
    )
    .filter(
      component =>
        component.name
    );

}


/* ======================================================
   VALIDATE COMPONENTS
====================================================== */

function validateComponents(
  components
) {

  for (
    const component
    of components
  ) {

    if (
      component.x < 0.50 ||
      component.x > 12.00
    ) {

      alert(
        `${component.name}: X / Scale must be between 0.50 and 12.00.`
      );

      return false;

    }


    if (
      component.y < 0 ||
      component.y > 6.28
    ) {

      alert(
        `${component.name}: Y / Rotation must be between 0.00 and 6.28.`
      );

      return false;

    }


    const colors = [
      component.color1,
      component.color2,
      component.color3
    ];


    for (
      const color
      of colors
    ) {

      const values = [
        color.red,
        color.green,
        color.blue
      ];


      if (
        values.some(
          value =>
            value < 0 ||
            value > 255
        )
      ) {

        alert(
          `${component.name}: RGB values must be between 0 and 255.`
        );

        return false;

      }

    }

  }


  return true;

}




/* ======================================================
   RESET FORM
====================================================== */

function resetForm() {

  shoeNameInput.value =
    "";


  brandSelect.value =
    BRANDS_2K27[0];


  gameVersionSelect.value =
    "NBA 2K27";


  componentsContainer.innerHTML =
    "";


  createComponentRow();

}


/* ======================================================
   EVENT LISTENERS
====================================================== */

addComponentBtn.addEventListener(
  "click",
  function () {

    createComponentRow();

  }
);


clearFormBtn.addEventListener(
  "click",
  resetForm
);


/* CLOSE PATTERN PICKER WHEN CLICKING ELSEWHERE */

document.addEventListener(
  "click",
  function (event) {

    if (
      !event.target.closest(
        ".pattern-field-group"
      )
    ) {

      closeAllPatternPickers();

    }

  }
);


/* ======================================================
   JPEG EXPORT
====================================================== */

function loadImage(src) {

  return new Promise(
    (resolve, reject) => {

      const image =
        new Image();

      image.onload =
        () => resolve(image);

      image.onerror =
        () => reject(
          new Error(
            `Could not load image: ${src}`
          )
        );

      image.src =
        src;

    }
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


function drawRoundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {

  ctx.beginPath();

  ctx.roundRect(
    x,
    y,
    width,
    height,
    radius
  );

  ctx.fill();

}


function drawRGBColumn(
  ctx,
  title,
  color,
  x,
  y
) {

  ctx.fillStyle =
    "#9ba6b2";

  ctx.font =
    "22px Anton";

  ctx.fillText(
    title,
    x,
    y
  );


  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "26px Anton";

  ctx.fillText(
    `R:  ${color.red}`,
    x,
    y + 42
  );

  ctx.fillText(
    `G:  ${color.green}`,
    x,
    y + 80
  );

  ctx.fillText(
    `B:  ${color.blue}`,
    x,
    y + 118
  );

}


async function downloadRecipeJPEG() {

  const shoeName =
    shoeNameInput.value.trim();


  if (!shoeName) {

    alert(
      "Enter a shoe name before downloading."
    );

    return;

  }

await document.fonts.load(
  '34px "Anton"'
);

  const components =
    getComponentValues();


  if (
    components.length === 0
  ) {

    alert(
      "Add at least one shoe component before downloading."
    );

    return;

  }


  if (
    !validateComponents(
      components
    )
  ) {

    return;

  }


  const canvasWidth =
    1400;

  const headerHeight =
    300;

  const componentHeight =
    390;

  const footerHeight =
    100;

  const canvasHeight =
    headerHeight +
    (
      components.length *
      componentHeight
    ) +
    footerHeight;


  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    canvasWidth;

  canvas.height =
    canvasHeight;


  const ctx =
    canvas.getContext(
      "2d"
    );


  /* BACKGROUND */

  ctx.fillStyle =
    "#0e1117";

  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );


  /* SHOE NAME */

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "52px Anton";

  ctx.fillText(
    shoeName,
    80,
    155
  );


  /* BRAND / VERSION */

  ctx.fillStyle =
    "#9ba6b2";

  ctx.font =
    "26px Anton";

  ctx.fillText(
    `${brandSelect.value}  •  ${gameVersionSelect.value}`,
    80,
    205
  );


  /* DIVIDER */

  ctx.fillStyle =
    "#8ac73f";

  ctx.fillRect(
    80,
    245,
    1240,
    2
  );


  /* ======================================================
     COMPONENTS
  ====================================================== */

  for (
    let index = 0;
    index < components.length;
    index++
  ) {

    const component =
      components[index];

    const startY =
      headerHeight +
      (
        index *
        componentHeight
      );


    /* COMPONENT CARD */

    ctx.fillStyle =
      "#161b22";

    drawRoundedRect(
      ctx,
      80,
      startY,
      1240,
      340,
      18
    );


    /* COMPONENT NAME */

    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      "32px Anton";

    ctx.fillText(
      component.name,
      120,
      startY + 55
    );


    /* MATERIAL */

    ctx.fillStyle =
      "#9ba6b2";

    ctx.font =
      "21px Anton";

    ctx.fillText(
      `Material: ${component.material}`,
      120,
      startY + 95
    );


    /* PATTERN SWATCH */

    const pattern =
      getPatternById(
        component.patternId
      );


    try {

      const patternImage =
        await loadImage(
          pattern.image
        );


      ctx.drawImage(
        patternImage,
        1060,
        startY + 35,
        200,
        200
      );

    }

    catch (error) {

      console.warn(
        "Pattern image could not be loaded.",
        error
      );

    }


    /* COLORS */

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

    ctx.fillStyle =
      "#9ba6b2";

    ctx.font =
      "20px Anton";

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


    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      "28px Anton";

    ctx.fillText(
      Number(
        component.x
      ).toFixed(2),
      860,
      startY + 315
    );


    ctx.fillText(
      Number(
        component.y
      ).toFixed(2),
      1060,
      startY + 315
    );

  }

/* ======================================================
   WATERMARK
====================================================== */

ctx.save();

ctx.globalAlpha =
  0.25;

ctx.fillStyle =
  "#8ac73f";

ctx.textAlign =
  "center";

ctx.textBaseline =
  "middle";

ctx.font =
  "180px Anton";

ctx.fillText(
  "THE",
  canvasWidth / 2,
  canvasHeight / 2 - 180
);

ctx.fillText(
  "SOLE",
  canvasWidth / 2,
  canvasHeight / 2 + 10
);

ctx.fillText(
  "LAB",
  canvasWidth / 2,
  canvasHeight / 2 + 200
);

ctx.restore();
   

/* ======================================================
   FOOTER LOGO
====================================================== */

try {

  const footerLogo =
    await loadImage(
      SOLE_LAB_LOGO
    );

  ctx.drawImage(
    footerLogo,
    80,
    canvasHeight - 78,
    48,
    48
  );

}

catch (error) {

  console.warn(
    "Footer logo could not be loaded.",
    error
  );

}


  /* ======================================================
     DOWNLOAD
  ====================================================== */

  const fileName =
    slugifyFileName(
      shoeName
    );


  const fileNameWithExtension =
  `${fileName}-2k27.jpg`;


canvas.toBlob(
  async function (blob) {

    const file =
      new File(
        [blob],
        fileNameWithExtension,
        {
          type: "image/jpeg"
        }
      );


    const isMobile =
  /iPhone|iPad|iPod|Android/i.test(
    navigator.userAgent
  );


if (
  isMobile &&
  navigator.share &&
  navigator.canShare &&
  navigator.canShare({
    files: [file]
  })
) {

      try {

        await navigator.share({
          files: [file],
          title: "The Sole Lab",
          text: `${shoeName} - ${gameVersionSelect.value}`
        });

      }

      catch (error) {

        if (
          error.name !== "AbortError"
        ) {

          console.warn(
            "Share failed.",
            error
          );

        }

      }

    }

    else {

      const link =
        document.createElement(
          "a"
        );

      link.download =
        fileNameWithExtension;

      link.href =
        URL.createObjectURL(
          blob
        );

      link.click();


      URL.revokeObjectURL(
        link.href
      );

    }

  },
  "image/jpeg",
  0.92
);


  trackEvent(
    "solelab_download_jpeg",
    {
      brand:
        brandSelect.value,

      componentCount:
        components.length
    }
  );

}


/* ======================================================
   JPEG DOWNLOAD BUTTON
====================================================== */

const downloadRecipeBtn =
  document.getElementById(
    "downloadRecipeBtn"
  );


downloadRecipeBtn.addEventListener(
  "click",
  downloadRecipeJPEG
);


/* ======================================================
   INITIALIZE APP
====================================================== */

populateBrandOptions();

resetForm();
