import { patternById, rgbCSS } from "./shared.js";
import { loadImage } from "./files.js";

const styles = getComputedStyle(document.documentElement);
const palette = Object.fromEntries(["bg", "bg-elevated", "accent", "text", "text-muted", "border-strong"].map(name => [name, styles.getPropertyValue(`--${name}`).trim()]));

export function drawText(
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
    ctx.font = `700 ${s}px "Outfit", sans-serif`;

    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }

    s--;
  }

  ctx.font = `700 ${s}px "Outfit", sans-serif`;

  if (ctx.measureText(text).width > maxWidth) {
    const chars = Array.from(text);
    let low = 0;
    let high = chars.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (ctx.measureText(chars.slice(0, middle).join("") + "…").width <= maxWidth) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    text = chars.slice(0, low).join("") + "…";
  }

  ctx.fillText(text, x, y);
}

export async function loadExportFonts() {
  try {
    await document.fonts.load('700 32px "Outfit"');
    await document.fonts.ready;
  } catch (error) {
    console.warn("Export font unavailable; using system font.", error);
  }
}

function drawPatternColor(ctx, label, color, x, y) {
  ctx.fillStyle = palette["text-muted"];

  drawText(
    ctx, label, x, y, 175, 16
  );

  ctx.fillStyle = rgbCSS(color);
  ctx.fillRect(x, y + 10, 28, 28);

  ctx.strokeStyle = palette["border-strong"];
  ctx.strokeRect(x, y + 10, 28, 28);

  ctx.fillStyle = palette["text"];

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

export async function renderPatternPage(
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

  ctx.fillStyle = palette["bg"];
  ctx.fillRect(0, 0, 1080, 1350);

  /* HEADER */

  ctx.fillStyle = palette["accent"];
  ctx.fillRect(65, 58, 8, 87);

  ctx.fillStyle = palette["text"];

  drawText(
    ctx,
    "THE SOLE LAB",
    95,
    103,
    860,
    48
  );

  ctx.fillStyle = palette["accent"];

  drawText(
    ctx,
    "PATTERN MANAGER / SHOE SPECS",
    96,
    142,
    850,
    22
  );

  /* SHOE INFORMATION */

  ctx.fillStyle = palette["bg-elevated"];
  ctx.fillRect(65, 175, 950, 130);

  ctx.fillStyle = palette["text"];

  drawText(
    ctx,
    shoe,
    90,
    225,
    885,
    37,
    22
  );

  ctx.fillStyle = palette["text-muted"];

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

    ctx.fillStyle = palette["bg-elevated"];
    ctx.fillRect(65, y, 950, 170);

    /* COMPONENT NUMBER */

    ctx.fillStyle = palette["accent"];

    drawText(
      ctx,
      String(page * 5 + i + 1).padStart(2, "0"),
      82,
      y + 31,
      38,
      23
    );

    /* COMPONENT NAME */

    ctx.fillStyle = palette["text"];

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

    ctx.fillStyle = palette["text-muted"];

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
      ctx.fillStyle = palette["border-strong"];

      ctx.fillRect(
        84,
        y + 54,
        88,
        88
      );
    }

    ctx.fillStyle = palette["text-muted"];

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

    ctx.fillStyle = palette["text-muted"];

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

  ctx.fillStyle = palette["border-strong"];
  ctx.fillRect(65, 1259, 950, 2);

  ctx.fillStyle = palette["text-muted"];

  drawText(
    ctx,
    "NBA 2K Shoe Creator Pattern Manager",
    65,
    1300,
    670,
    18
  );

  ctx.fillStyle = palette["accent"];

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

export function drawSpecCard(
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

  ctx.fillStyle = palette["bg"];
  ctx.fillRect(0, 0, 1080, 1350);

  /* HEADER */

  ctx.fillStyle = palette["accent"];
  ctx.fillRect(65, 67, 8, 85);

  ctx.fillStyle = palette["text"];

  drawText(
    ctx,
    "THE SOLE LAB",
    98,
    114,
    870,
    56
  );

  ctx.fillStyle = palette["accent"];

  drawText(
    ctx,
    "QUICK SHARE / SHOE SPECS",
    99,
    151,
    830,
    24
  );

  /* SHOE INFORMATION */

  ctx.fillStyle = palette["bg-elevated"];
  ctx.fillRect(65, 185, 950, 174);

  ctx.fillStyle = palette["text"];

  drawText(
    ctx,
    shoe,
    96,
    246,
    865,
    41,
    22
  );

  ctx.fillStyle = palette["text-muted"];

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

  ctx.fillStyle = palette["accent"];
  ctx.fillRect(65, 386, 950, 3);

  ctx.fillStyle = palette["text-muted"];

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
        ? palette["bg-elevated"]
        : palette["bg-elevated"];

    ctx.fillRect(65, y, 950, 72);

    ctx.fillStyle = palette["accent"];

    drawText(
      ctx,
      String(page * 10 + i + 1).padStart(2, "0"),
      84,
      y + 44,
      43,
      21
    );

    /* LAYER */

    ctx.fillStyle = palette["text"];

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

    ctx.fillStyle = palette["text-muted"];

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

    ctx.strokeStyle = palette["border-strong"];
    ctx.strokeRect(790, y + 21, 30, 30);

    /* RGB NUMBERS */

    ctx.fillStyle = palette["text"];

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

  ctx.fillStyle = palette["border-strong"];
  ctx.fillRect(65, 1254, 950, 2);

  ctx.fillStyle = palette["text-muted"];

  drawText(
    ctx,
    "NBA 2K Shoe Creator • RGB values 0–255",
    65,
    1299,
    750,
    20
  );

  ctx.fillStyle = palette["accent"];

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
