# The Sole Lab

A browser-only workspace for recording NBA 2K27 Shoe Creator settings and sharing them as image cards. There is no backend, account, or production build step.

## Run locally

Serve the repository over HTTP (JavaScript modules do not work reliably when opening `index.html` directly):

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Any static hosting service can serve the same files. Deploy `index.html`, `css/`, `js/`, and `assets/` together, preserving their paths and serving `.js` files as JavaScript. No Node dependencies are needed to run or deploy the application.

## Use the tools

- **Pattern Manager:** Record named components, materials, one of 29 pattern swatches, three RGB colors, scale (0.50–12.00), rotation (0.00–6.28), and notes. Use Move Up/Move Down to reorder components; duplicate, remove, or collapse them and copy colors between them. Drafts and image exports follow the displayed order.
- **Quick Share:** Record named layers in game order, materials, and RGB colors. Duplicate or remove layers and copy colors between them.
- **Image cards:** Export 1080 × 1350 JPEGs (five components per card) or PNGs (ten layers per card). All rows must have names and valid numbers; invalid entries are focused for correction. RGB values must be whole numbers from 0 to 255. Scale and rotation use hundredths. The selected swatch is a reference image, not a simulated shoe texture.
- **Sharing:** Compatible browsers can open a native share sheet. If sharing is unavailable or fails, a single image downloads directly; multiple images download in one ZIP. Cancelling sharing does not start a download. Native sharing requires HTTPS or localhost and may fall back to a download if the browser expires the user gesture during image preparation.
- **Drafts:** Both editors save together in local browser storage after edits and restore on return. Drafts stay on the current browser/device. Clearing an editor updates that saved draft. Browser storage can be disabled or cleared; use **Save editable JSON** for a portable copy, then **Open JSON** to restore it. Opening a file asks before replacing the workspace. JSON files support up to 500 entries per editor and 2 MB; incomplete numeric fields are retained so they can be finished later.

Drafts and exported files are not uploaded to a server. The site uses Umami for page views and action counts; event payloads include brand and entry/card counts, not shoe names, notes, or RGB values. Google Fonts provides Outfit and the existing wordmark typeface, with local system fallbacks.

## Code layout

| File | Purpose |
| --- | --- |
| `index.html` | Semantic page structure, tabs, and workspace controls |
| `css/style.css` | Design tokens, shared controls, editor layouts, and responsive rules |
| `js/app.js` | Startup, tab navigation, and top-level event wiring |
| `js/data.js` | Game brands, materials, and pattern catalog |
| `js/shared.js` | Formatting, option generation, safe HTML, and analytics |
| `js/color-controls.js` | Shared RGB markup, color clipboard, and exact field duplication |
| `js/validation.js` | Raw numeric reading, validation, and dynamic field labels |
| `js/pattern-editor.js` | Pattern component editing and lazy swatch picker |
| `js/spec-editor.js` | Quick Share layer editing |
| `js/renderers.js` | Canvas layout and text fitting for image cards |
| `js/exports.js` | Snapshot validation, pagination, and export orchestration |
| `js/files.js` | Cached images, encoding, native sharing, downloads, and ZIP packaging |
| `js/drafts.js` | Local drafts and validated JSON import/export |
| `tests/` | Browser regression coverage |

UI chrome and canvas artwork use the CSS palette tokens. User colors and swatch images retain their actual colors. Follow the contributor instructions and attached Minimal Gaming HUD design system in `AGENTS.md`.

## Check changes

Install Node.js 22+ and the test dependency:

```sh
npm ci
npx playwright install chromium
npm test
```

The tests start their own local static server and exercise both editors, numeric validation, keyboard navigation, accessible labels, responsive widths, drafts/JSON round trips, image formats, ZIP pagination, export snapshots, and share cancellation. External font and analytics requests are blocked in tests. To use an existing compatible Chromium installation:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

Also inspect both tabs on desktop and mobile with real fonts and pattern assets. Actual mobile operating-system share dialogs need a manual device check; mocked browser tests cover the app's success, cancellation, and fallback paths.
