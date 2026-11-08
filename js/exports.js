import { $, patternById, slugifyFileName, trackEvent } from "./shared.js";
import { validPatternItems } from "./pattern-editor.js";
import { validSpecLayers } from "./spec-editor.js";
import { drawSpecCard, loadExportFonts, renderPatternPage } from "./renderers.js";
import { canvasToBlob, loadImage, shareOrDownload } from "./files.js";

/** Snapshot every field before awaiting fonts, images, or encoding. */
export async function exportCards(tool) {
  const pattern = tool === "pattern";
  const nameInput = $(pattern ? "shoeName" : "specShoeName");
  const shoe = nameInput.value.trim();
  if (!shoe) {
    alert("Enter a shoe name before downloading.");
    nameInput.focus();
    return;
  }
  const items = pattern ? validPatternItems() : validSpecLayers();
  if (!items) return;
  const brand = $(pattern ? "brand" : "specBrand").value;
  const version = $(pattern ? "gameVersion" : "specGameVersion").value;
  const button = $(pattern ? "downloadRecipeBtn" : "downloadSpecCardBtn");
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Preparing cards…";
  const perPage = pattern ? 5 : 10;
  const total = Math.ceil(items.length / perPage);
  try {
    await loadExportFonts();
    if (pattern) {
      await Promise.allSettled([...new Set(items.map(item => patternById(item.patternId).image))].map(loadImage));
    }
    const files = [];
    for (let page = 0; page < total; page++) {
      const pageItems = items.slice(page * perPage, (page + 1) * perPage);
      const canvas = pattern
        ? await renderPatternPage(shoe, brand, version, pageItems, page, total)
        : drawSpecCard(shoe, brand, version, pageItems, page, total);
      const type = pattern ? "image/jpeg" : "image/png";
      const blob = await canvasToBlob(canvas, type);
      files.push(new File([blob], `${slugifyFileName(shoe) || "shoe"}-${pattern ? "pattern" : "spec-card"}-${page + 1}.${pattern ? "jpg" : "png"}`, { type }));
    }
    const result = await shareOrDownload(files, `The Sole Lab — ${pattern ? "Pattern" : "Shoe"} Specs`, `${shoe} - ${version}`);
    if (result !== "cancelled") {
      trackEvent(pattern ? "solelab_download_jpeg" : "solelab_download_spec_card", {
        brand,
        [pattern ? "componentCount" : "layerCount"]: items.length,
        cardCount: total
      });
    }
  } catch (error) {
    console.error("Card export failed", error);
    alert("Could not create your cards. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}
