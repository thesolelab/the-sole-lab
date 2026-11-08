import { channel, trackEvent } from "./shared.js";
import { validateNumericFields } from "./validation.js";

export function rgbInputMarkup(prefix, color = {}, compact = false) {
  return [["red", "R"], ["green", "G"], ["blue", "B"]].map(([key, label]) => `
    <div class="${compact ? "rgb-row" : "field-group"}">
      <label class="${compact ? "rgb-label" : ""}">${label}${compact ? ":" : ""}</label>
      <input type="number" inputmode="numeric" min="0" max="255" step="1"
        class="${prefix}-${key}${compact ? " rgb-value" : ""}"
        value="${channel(color[key] ?? 0)}">
    </div>
  `).join("");
}

function feedback(button, message, original) {
  button.textContent = message;
  setTimeout(() => { if (button.isConnected) button.textContent = original; }, 1200);
}

/** Each editor gets an independent clipboard with identical validation/feedback. */
export function createColorClipboard(container, pasteSelector) {
  let color = null;
  return {
    reset() { color = null; },
    bind({ copy, paste, inputs, read, write, copyEvent, pasteEvent }) {
      paste.disabled = !color;
      const copyLabel = copy.textContent;
      const pasteLabel = paste.textContent;
      copy.addEventListener("click", () => {
        if (!validateNumericFields(inputs)) return;
        color = { ...read() };
        container.querySelectorAll(pasteSelector).forEach(button => { button.disabled = false; });
        feedback(copy, "Copied!", copyLabel);
        trackEvent(copyEvent);
      });
      paste.addEventListener("click", () => {
        if (!color) return;
        write({ ...color });
        feedback(paste, "Pasted!", pasteLabel);
        trackEvent(pasteEvent);
      });
    }
  };
}

/** Duplicate all visible fields exactly, including unfinished numeric edits. */
export function copyCardFields(source, target) {
  const original = [...source.querySelectorAll('input:not([type="hidden"]), select')];
  target.querySelectorAll('input:not([type="hidden"]), select').forEach((input, index) => {
    input.value = original[index].value;
  });
  target.querySelector('input[type="number"]')?.dispatchEvent(new Event("input"));
  target.querySelector('input[type="text"]')?.dispatchEvent(new Event("input"));
}
