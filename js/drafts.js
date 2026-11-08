import { $, trackEvent } from "./shared.js";
import { BRANDS_2K27, MATERIALS_2K27, PATTERNS_2K27 } from "./data.js";
import { componentValues, createComponentRow, resetForm } from "./pattern-editor.js";
import { addSpecLayer, readSpecLayer, resetSpecForm } from "./spec-editor.js";
import { downloadFile } from "./files.js";

const storageKey = "sole-lab-workspace-v1";
const MAX_ENTRIES = 500;
let saveTimer;
let restored = false;

// Retain raw strings, including incomplete numeric edits, in editable drafts.
function rawFields(card) {
  return Object.fromEntries([...card.querySelectorAll('input:not([type="hidden"]), select')].map(input => [input.classList[0], input.value]));
}

export function captureWorkspace() {
  return {
    format: "sole-lab-workspace",
    version: 1,
    activeTool: $("specTool").hidden ? "pattern" : "spec",
    pattern: {
      shoe: $("shoeName").value,
      brand: $("brand").value,
      gameVersion: $("gameVersion").value,
      entries: [...$("componentsContainer").children].map(card => ({
        ...componentValues(card),
        collapsed: card.classList.contains("is-collapsed"),
        fields: rawFields(card)
      }))
    },
    spec: {
      shoe: $("specShoeName").value,
      brand: $("specBrand").value,
      gameVersion: $("specGameVersion").value,
      entries: [...$("specLayersContainer").children].map(card => ({ ...readSpecLayer(card), fields: rawFields(card) }))
    }
  };
}

function text(value, limit) {
  if (typeof value !== "string" || value.length > limit) throw new Error("Invalid text field");
}

function number(value, min, max) {
  // null is how JSON represents a temporarily empty/invalid numeric edit.
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)) {
    throw new Error("Invalid numeric field");
  }
}

export function validateWorkspace(data) {
  if (!data || data.format !== "sole-lab-workspace" || data.version !== 1 || !["pattern", "spec"].includes(data.activeTool)) {
    throw new Error("Unsupported workspace format");
  }
  for (const tool of ["pattern", "spec"]) {
    const form = data[tool];
    if (!form || !Array.isArray(form.entries) || form.entries.length > MAX_ENTRIES) throw new Error("Invalid entries");
    text(form.shoe, 100);
    if (!BRANDS_2K27.includes(form.brand) || form.gameVersion !== "NBA 2K27") throw new Error("Unknown game or brand");
    for (const entry of form.entries) {
      if (!entry || typeof entry !== "object") throw new Error("Invalid entry");
      text(entry.name, tool === "pattern" ? 100 : 70);
      if (!MATERIALS_2K27.includes(entry.material)) throw new Error("Unknown material");
      if (tool === "pattern") {
        if (!PATTERNS_2K27.some(pattern => pattern.id === entry.patternId)) throw new Error("Unknown pattern");
        text(entry.notes, 300);
        for (const color of [entry.color1, entry.color2, entry.color3]) {
          if (!color) throw new Error("Missing color");
          for (const key of ["red", "green", "blue"]) number(color[key], -1e9, 1e9);
        }
        number(entry.x, -1e9, 1e9);
        number(entry.y, -1e9, 1e9);
      } else {
        for (const key of ["red", "green", "blue"]) number(entry[key], -1e9, 1e9);
      }
      if (entry.fields !== undefined) {
        if (!entry.fields || typeof entry.fields !== "object" || Array.isArray(entry.fields)) throw new Error("Invalid raw fields");
        for (const [key, value] of Object.entries(entry.fields)) {
          if (!/^(component-(name|material|x|y|notes)|color-[123]-(red|green|blue)|spec-(layer-name|layer-material|red|green|blue))$/.test(key)) throw new Error("Unknown field");
          text(value, key.endsWith("notes") ? 300 : 100);
          if (key.endsWith("material") && !MATERIALS_2K27.includes(value)) throw new Error("Unknown material");
          if (key === "spec-layer-name") text(value, 70);
        }
      }
    }
  }
  return data;
}

export function restoreWorkspace(data, switchTool) {
  // Validate the entire document before replacing any current work.
  validateWorkspace(data);
  resetForm();
  resetSpecForm();
  $("componentsContainer").replaceChildren();
  $("specLayersContainer").replaceChildren();
  for (const tool of ["pattern", "spec"]) {
    const form = data[tool];
    $(tool === "pattern" ? "shoeName" : "specShoeName").value = form.shoe;
    $(tool === "pattern" ? "brand" : "specBrand").value = form.brand;
    $(tool === "pattern" ? "gameVersion" : "specGameVersion").value = form.gameVersion;
    for (const entry of form.entries) {
      const card = tool === "pattern" ? createComponentRow(entry) : addSpecLayer(entry);
      if (entry.fields) {
        for (const input of card.querySelectorAll('input:not([type="hidden"]), select')) {
          const value = entry.fields[input.classList[0]];
          if (value !== undefined) input.value = value;
        }
        card.querySelector('input[type="number"]')?.dispatchEvent(new Event("input"));
        card.querySelector('input[type="text"]')?.dispatchEvent(new Event("input"));
      }
      if (entry.collapsed && tool === "pattern") card.querySelector(".pattern-collapse-toggle").click();
    }
  }
  switchTool(data.activeTool);
}

export function saveWorkspace() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(storageKey, JSON.stringify(captureWorkspace()));
    $("draftStatus").textContent = restored ? "Draft restored. Changes save on this device." : "Draft saved on this device.";
  } catch {
    $("draftStatus").textContent = "Automatic saving unavailable. Save an editable JSON copy.";
  }
}

export function initializeDrafts(switchTool) {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      restoreWorkspace(JSON.parse(saved), switchTool);
      restored = true;
      $("draftStatus").textContent = "Draft restored. Changes save on this device.";
    }
  } catch {
    $("draftStatus").textContent = "Could not restore the draft. You can open an editable JSON copy.";
  }
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveWorkspace, 300);
  };
  for (const event of ["input", "change", "click"]) document.querySelector("main").addEventListener(event, scheduleSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveWorkspace();
  });
  window.addEventListener("pagehide", saveWorkspace);
  $("exportDraftBtn").addEventListener("click", () => {
    const file = new File([JSON.stringify(captureWorkspace(), null, 2)], "sole-lab-workspace.json", { type: "application/json" });
    downloadFile(file);
    saveWorkspace();
  });
  $("importDraftBtn").addEventListener("click", () => $("importDraftInput").click());
  $("importDraftInput").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("File too large");
      const data = validateWorkspace(JSON.parse(await file.text()));
      if (!confirm("Open this workspace and replace the current entries? Save an editable JSON copy first if you need them.")) return;
      restoreWorkspace(data, switchTool);
      restored = false;
      saveWorkspace();
      trackEvent("solelab_open_workspace");
    } catch (error) {
      console.warn("Workspace import failed", error);
      alert("Could not open that file. Choose a Sole Lab workspace JSON file (up to 2 MB). Your current work is unchanged.");
    } finally {
      event.target.value = "";
    }
  });
}
