# Instructions for Codex

These instructions apply throughout this repository.

## Branches and pull requests

- Start each new task on a separate branch based on the latest `main`. Use a descriptive name such as `fix/login-error` or `feature/player-search`.
- If the current session already has a branch dedicated to this task, continue on it. Do not discard uncommitted work or overwrite another person's changes.
- Never commit or push directly to `main`. Do not force-push.
- Keep each branch and pull request focused on one task.
- Run relevant checks, review the diff, then open a pull request targeting `main` when the changes are ready.
- Do not merge pull requests unless the repository owner explicitly asks.
- If repository access or permissions prevent this workflow, explain the blocker instead of changing `main`.

## Making and checking changes

- Read the README and any applicable directory instructions before editing.
- Follow the existing project structure and coding conventions. Keep changes limited to the requested task.
- Use the project's documented checks when available. For behavior changes, verify the affected functionality; for visual changes, check the page in a browser when possible.
- Do not invent test commands or claim checks passed when they were not run. Explain any checks that could not be completed.
- For documentation-only changes, review the text and diff; application tests are not required.
- Never commit passwords, API keys, tokens, or private user data.

## Explaining the work

- Use beginner-friendly language and explain unfamiliar Git or coding terms when needed.
- In the pull request, describe what changed, why it changed, and how it was checked. Mention any remaining limitations.
- Share the pull request link and explain the next step for the owner.


# Design System: The Sole Lab, Minimal Gaming HUD

Restyle the existing site visually only. Do NOT change functionality:
pattern creation, component add/duplicate/remove/collapse, RGB inputs,
copy/paste, swatch selection, tab switching, saving, and sharing must
all work exactly as before. Keep it responsive and accessible.

## Palette rule
Black, grays, white, and ONE accent: the site's existing green.
No other hues in the UI chrome. Two functional exceptions:
1. Color swatches, pattern previews, and any user-entered color
   values must always display their true colors.
2. The "Remove" action keeps a red destructive color (use a
   --danger token), used only for that action.

## Step 1: Tokens
Define in :root and use ONLY these variables (no hard-coded colors
in components). Set --accent to the green already used on the site
(logo, active tab, section underline). Do not invent a new green.

:root {
  --bg: #090a09;
  --bg-elevated: #0f110f;
  --surface: rgba(255, 255, 255, 0.03);
  --surface-inset: #000000;
  --border: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.20);

  --accent: /* existing site green */;
  --accent-hover: /* slightly lighter accent */;
  --accent-tint: /* accent at ~8% opacity */;
  --accent-glow: /* accent at ~24% opacity for visible corner glows */;
  --on-accent: #090a09;

  --danger: #ef4444;

  --text: #f2f2f2;
  --text-muted: rgba(242, 242, 242, 0.55);

  --radius: 2px;
  --font-body: "Outfit", system-ui, sans-serif;
}

## Step 2: Global look
- Page background: var(--bg) with a very subtle repeating "+" grid
  pattern (~3-5% opacity) and four visible, soft radial glows (--accent-glow),
  one in each viewport corner. Keep them fixed behind the content while scrolling. They must be clearly visible
  without tinting color swatches or obscuring text. Let the header reveal the top glows.
- Font: load Outfit from Google Fonts, used site-wide.
- Small labels (field labels like "Shoe Name", "Brand", "Material",
  "R/G/B", "PATTERN COLORS", the tagline): 11-13px, uppercase, bold,
  letter-spacing 0.08em, muted.
- Section titles ("Create a Shoe Pattern", "Shoe Components"): bold,
  tight tracking. Replace the short underline with a 3px accent bar
  to the left of the title.
- Numeric inputs: bold, font-variant-numeric: tabular-nums.
- Border radius: var(--radius) everywhere. Remove large rounded
  corners from cards, inputs, and buttons.

## Step 3: Components (mapped to this site)

Header (logo bar)
- Keep the logo as is. Background var(--bg-elevated) with a 1px
  var(--border) bottom line plus a short accent segment on the
  left end of that line. Tagline "NBA 2K Shoe Creator Tools":
  uppercase, muted, letter-spaced.

Tabs ("Pattern Manager", "Quick Share")
- Rectangular, no rounded corners, uppercase bold, letter-spaced.
- Active: var(--accent) background, text var(--on-accent), one
  clipped corner: clip-path: polygon(0 0, 100% 0, 100% 70%,
  92% 100%, 0 100%).
- Inactive: transparent, 1px var(--border), muted text.
  Hover: border and text become var(--accent).

Panels ("Create a Shoe Pattern", "Shoe Components")
- background var(--surface), 1px var(--border), radius var(--radius).
- Add a small 8px corner bracket detail in var(--border-strong)
  on the top-left (pseudo-element) for the HUD feel.

Component cards ("01 · Shoe Component")
- Nested panel: var(--surface-inset) background, 1px var(--border).
- Header row: number in var(--accent), title bold, 1px bottom
  divider.
- Buttons: "Collapse" and "Duplicate" are secondary buttons.
  "Remove" is a text button using var(--danger), with a faint
  danger border on hover.

Inputs, selects, dropdowns (Shoe Name, Brand, Game Version,
Component Name, Material)
- Dark inset fields (var(--surface-inset)), 1px var(--border-strong),
  square corners.
- Placeholder text muted. Focus: 1px var(--accent) border.
- Keep native select behavior; restyle the closed state only.

Primary button ("+ Add Component")
- Background var(--accent), text var(--on-accent), bold uppercase,
  letter-spacing 0.06em, radius 0, same clipped corner as the
  active tab. Hover: var(--accent-hover). Active: 1px translate down.

Secondary buttons (Collapse, Duplicate, Copy, Paste)
- Transparent or var(--surface), 1px var(--border-strong), small
  uppercase text. Hover: border and text become var(--accent).

Selected Swatch box (Pattern)
- Dark inset panel, 1px var(--border). The swatch preview keeps its
  real image, with a 1px var(--border-strong) square frame.
  "Click to change" in muted small caps. Hover: border var(--accent).

Pattern colors rows (Color 1, Color 2, ...)
- Rows: var(--surface-inset), 1px var(--border), square corners.
- "R:", "G:", "B:" labels muted and uppercase. Number inputs are
  dark inset fields, centered, bold, tabular-nums.
- The color preview square keeps its true color, with a 1px
  var(--border-strong) frame and square corners.
- "PATTERN COLORS" subheader: uppercase label with a 2px accent
  bar on its left.

## Step 4: Rules
- Green (var(--accent)) is the ONLY highlight color. Use it for
  primary actions, active tab, focus, hover states, and small
  structural accents. Never for body text or large backgrounds.
- Avoid: pill shapes, large shadows, surface gradients,
  glassmorphism blur, neon text glow, emoji icons, extra colors.
- Maintain WCAG AA contrast (dark text on green, muted text on
  dark).
- Add hover and focus-visible states to every interactive element.
- Below ~768px, collapse multi-column form rows to a single column
  and keep R/G/B inputs usable.

## Workflow
1. Add tokens and global styles (background, grid, font).
2. Restyle shared components (buttons, tabs, inputs, panels).
3. Apply to the component cards and color rows.
4. Final polish: spacing, alignment, hover/focus states.
5. Verify all functionality still works unchanged.
