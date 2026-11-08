let nextCardId = 0;

/** Empty numeric fields must remain invalid, rather than becoming zero. */
export function readNumber(input) {
  return input.value.trim() === "" ? NaN : Number(input.value);
}

export function labelCardFields(card, prefix) {
  const cardId = `${prefix}-${++nextCardId}`;
  card.querySelectorAll('input:not([type="hidden"]), select').forEach((input, index) => {
    input.id = `${cardId}-field-${index}`;
    const group = input.closest(".rgb-row, .field-group");
    const label = group.querySelector("label, .rgb-label");
    if (label?.tagName === "LABEL") {
      label.htmlFor = input.id;
    } else if (label) {
      const accessibleLabel = document.createElement("label");
      accessibleLabel.className = label.className;
      accessibleLabel.textContent = label.textContent;
      accessibleLabel.htmlFor = input.id;
      label.replaceWith(accessibleLabel);
    }
    if (input.type === "number") {
      const color = input.closest(".color-card");
      const colorName = color?.querySelector(".color-card-title")?.textContent.trim();
      const title = label?.textContent.trim().replace(":", "");
      if (colorName) input.setAttribute("aria-label", `${colorName} ${title}`);
    }
  });
  const body = card.querySelector(".pattern-component-body");
  const toggle = card.querySelector(".pattern-collapse-toggle");
  if (body && toggle) {
    body.id = `${cardId}-body`;
    toggle.setAttribute("aria-controls", body.id);
  }
  const picker = card.querySelector(".pattern-picker");
  if (picker) {
    picker.id = `${cardId}-picker`;
    card.querySelector(".pattern-picker-trigger").setAttribute("aria-controls", picker.id);
  }
}

function reveal(input) {
  const card = input.closest(".component-card");
  if (card?.classList.contains("is-collapsed")) {
    card.querySelector(".pattern-collapse-toggle").click();
  }
  input.focus();
}

export function validateNumericFields(inputs) {
  for (const input of inputs) {
    const value = readNumber(input);
    if (!Number.isFinite(value) || !input.validity.valid) {
      alert(`${input.labels?.[0]?.textContent.trim() || "Color"}: enter a value from ${input.min} to ${input.max}${input.step === "1" ? " (whole numbers only)" : ""}.`);
      reveal(input);
      return false;
    }
  }
  return true;
}

export function validateCards(cards, nameSelector) {
  if (!cards.length) {
    alert("Add at least one entry before downloading.");
    return false;
  }
  for (const [index, card] of cards.entries()) {
    const name = card.querySelector(nameSelector);
    if (!name.value.trim()) {
      alert(`Entry ${index + 1} needs a name before downloading.`);
      reveal(name);
      return false;
    }
    if (!validateNumericFields([...card.querySelectorAll('input[type="number"]')])) return false;
  }
  return true;
}
