import { $, populateBrands, trackEvent } from "./shared.js";
import { closeAllPatternPickers, createComponentRow, resetForm } from "./pattern-editor.js";
import { addSpecLayer, resetSpecForm } from "./spec-editor.js";
import { exportCards } from "./exports.js";
import { initializeDrafts, saveWorkspace } from "./drafts.js";

function switchTool(name) {
  const spec = name === "spec";
  for (const [id, selected] of [["pattern", !spec], ["spec", spec]]) {
    const panel = $(`${id}Tool`);
    const tab = $(`${id}ToolBtn`);
    panel.hidden = !selected;
    panel.classList.toggle("active", selected);
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  closeAllPatternPickers();
}

for (const name of ["pattern", "spec"]) {
  $(`${name}ToolBtn`).addEventListener("click", () => {
    switchTool(name);
    trackEvent(name === "pattern" ? "solelab_pattern_tool" : "solelab_spec_tool");
  });
}

document.querySelector('[role="tablist"]').addEventListener("keydown", event => {
  const tabs = [$("patternToolBtn"), $("specToolBtn")];
  const current = tabs.indexOf(document.activeElement);
  if (current < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const index = event.key === "Home" ? 0 : event.key === "End" ? 1 : (current + 1) % 2;
  tabs[index].focus();
  tabs[index].click();
});

$("addComponentBtn").addEventListener("click", () => {
  createComponentRow().querySelector(".component-name").focus();
  trackEvent("solelab_add_component");
});
$("addSpecLayerBtn").addEventListener("click", () => {
  addSpecLayer().querySelector(".spec-layer-name").focus();
  trackEvent("solelab_add_spec_layer");
});
$("clearFormBtn").addEventListener("click", () => { resetForm(); saveWorkspace(); });
$("clearSpecFormBtn").addEventListener("click", () => { resetSpecForm(); saveWorkspace(); });
$("downloadRecipeBtn").addEventListener("click", () => exportCards("pattern"));
$("downloadSpecCardBtn").addEventListener("click", () => exportCards("spec"));
document.addEventListener("click", event => {
  if (!event.target.closest(".pattern-field-group")) closeAllPatternPickers();
});

populateBrands($("brand"));
populateBrands($("specBrand"));
resetForm();
resetSpecForm();
switchTool("pattern");
initializeDrafts(switchTool);
