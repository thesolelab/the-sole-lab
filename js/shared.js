import { BRANDS_2K27, MATERIALS_2K27, PATTERNS_2K27 } from "./data.js";

export const $ = id => document.getElementById(id);

export function trackEvent(name, data = {}) {
  if (window.umami?.track) {
    try {
      window.umami.track(name, data);
    } catch (error) {
      console.warn("Analytics unavailable", error);
    }
  }
}

export function escapeHTML(value) {
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

export function slugifyFileName(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function populateBrands(select) {
  select.innerHTML = BRANDS_2K27
    .map(v => `
      <option value="${escapeHTML(v)}">
        ${escapeHTML(v)}
      </option>
    `)
    .join("");
}

export function materialOptions(selected = "Default") {
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

export function clamp(value, min, max, fallback = min) {
  const n = Number(value);

  return Number.isFinite(n)
    ? Math.min(max, Math.max(min, n))
    : fallback;
}

export function channel(value) {
  return Math.round(clamp(value, 0, 255));
}

export function patternById(id) {
  return PATTERNS_2K27.find(
    p => p.id === id
  ) || PATTERNS_2K27[0];
}

export function patternStyle(pattern) {
  return `
    background-image:url('${pattern.image}');
    background-size:cover;
    background-position:center;
    background-repeat:no-repeat;
  `;
}

export function rgbCSS(color) {
  return `rgb(${channel(color.red)},${channel(color.green)},${channel(color.blue)})`;
}
