# Claremont: front-end updates to port into the Wagtail build

Date: 2026-10-11
Source of truth: the static cutup repo, `static/claremont`
Baseline: commit `97891e4` ("Dispositions and policies cells fill on hover; column hairline gone"). Everything below is the difference between that commit and the current working copy.
Companion file: `wagtail-updates-2026-10-11.patch` (same folder) is the full `git diff` of `src/` for these updates, 18 files.

## Purpose

The Claremont site was converted to Wagtail from the static cutup. After that conversion, eight front-end updates were made in the static repo. This file tells you exactly what to change in the Wagtail project so it matches.

Nothing here changes Wagtail models, StreamField block definitions, images, fonts or npm dependencies. The work is: updated CSS and JS, plus six small template edits.

## Instructions for the agent doing the port

1. Treat the static repo as the reference. Replicate these changes; do not redesign or "improve" them. Several values were tuned by hand with the client.
2. The snippets below are the static HTML. In Wagtail the same markup lives in Django templates. Keep whatever template tags are already there (`{% static %}`, `{% url %}`, `{{ page.x }}`, block loops); only add, move or rename the parts called out.
3. Find the Wagtail counterpart of each static file by searching for the anchor string given with each edit. Do not assume file names match.
4. Do the work in this order: assets (section 1), template edits (section 2), then run the checks (section 6).
5. If a Wagtail copy of a file has local changes (most likely `search.js`), merge the change shown here into it. Do not overwrite the file.
6. If something in the Wagtail project does not match what this file describes, stop and report it rather than guessing.

## The eight updates

| # | Update | Static files changed (under `src/`) | Wagtail work |
| --- | --- | --- | --- |
| 1 | Mina Wylie photo slides in from the right with a zoom, instead of swinging in from the top | `sections/preparatory-program/mina-wylie.html`, `assets/scripts/anim.js`, `assets/styles/05-components/_split-feature.less` (comment only) | Template edit 6, JS |
| 2 | Search overlay: the page no longer shifts when it opens, the page is locked while it is open, the scrollbar fades with the overlay, and only the results list scrolls | `partials/search.html`, `assets/scripts/search.js`, `_search.less`, `_header.less`, `_base.less`, `_tokens.less`, `_animation.less` | Template edit 2, CSS, JS |
| 3 | Header search icon turns into a close icon while the search is open | `partials/header.html`, `_header.less` | Template edit 1, CSS |
| 4 | Page scrollbar is the browser default, only thinner | `_base.less` | CSS only |
| 5 | Contact form: the focus line grows from left to right | `_contact.less` | CSS only |
| 6 | Page transition: no blank strip down the right of the outgoing page | `partials/head.html`, `_page-transition.less` | Template edit 3, CSS |
| 7 | Download button: the arrow drops on hover | `partials/icons.html`, `policies.html`, `_buttons.less` | Template edits 4 and 5, CSS |
| 8 | Button press: only the button's background presses in, so the label and arrow no longer shift | `_buttons.less`, `_search.less`, `_article.less` | CSS only |

## 1. Assets: CSS and JS

Pick the option that matches how the Wagtail project gets its front-end assets.

**Option A: Wagtail serves the compiled files.** In the static repo run `npm run build`, then copy these two files over the ones Wagtail serves:

- `dist/assets/css/main.css`
- `dist/assets/js/main.js`

That covers every style and script change in this document. Skip to section 2.

**Option B: Wagtail builds from the LESS and JS sources.** Copy these files from the static repo's `src/assets/` over the Wagtail copies, then rebuild. If a Wagtail copy has local edits, apply the matching hunk from the `.patch` file instead of overwriting.

Styles (`src/assets/styles/`):

- `01-settings/_tokens.less`
- `03-base/_base.less`
- `04-layout/_header.less`
- `05-components/_article.less`
- `05-components/_buttons.less`
- `05-components/_contact.less`
- `05-components/_search.less`
- `05-components/_split-feature.less`
- `06-animation/_animation.less`
- `06-animation/_page-transition.less`

Scripts (`src/assets/scripts/`):

- `anim.js`
- `search.js`

## 2. Template edits

Six edits. Each lists the static file, a string to search for in the Wagtail templates, and the exact change.

### Edit 1. Header: add the close icon to the desktop search button

Static file: `src/partials/header.html`
Find in Wagtail: `site-header__tool` together with `data-search-open`

Add one `<svg>` after the existing search icon, inside the desktop header button only. The phone menu's search button (`site-menu__tool`) is unchanged.

Before:

```html
<button class="site-header__tool" type="button" aria-label="Search" data-search-open aria-haspopup="dialog" aria-controls="site-search" data-anim-item>
  <svg class="icon"><use href="#icon-search"></use></svg>
</button>
```

After:

```html
<button class="site-header__tool" type="button" aria-label="Search" data-search-open aria-haspopup="dialog" aria-controls="site-search" data-anim-item>
  <svg class="icon"><use href="#icon-search"></use></svg>
  <svg class="icon site-header__tool-close" aria-hidden="true"><use href="#icon-close"></use></svg>
</button>
```

The CSS swaps the two icons when the button has `aria-expanded="true"`, which `search.js` already sets. The symbol `icon-close` already exists in the sprite.

### Edit 2. Search overlay: move `data-lenis-prevent`

Static file: `src/partials/search.html`
Find in Wagtail: `id="site-search"` and `data-search-results`

Remove `data-lenis-prevent` from the outer overlay element and add it to the results container.

Before:

```html
<div class="search" id="site-search" role="dialog" aria-modal="true" aria-label="Search Claremont College" data-search data-lenis-prevent hidden>
  ...
  <div class="search__results" data-search-results hidden>
```

After:

```html
<div class="search" id="site-search" role="dialog" aria-modal="true" aria-label="Search Claremont College" data-search hidden>
  ...
  <div class="search__results" data-search-results data-lenis-prevent hidden>
```

Why it matters: the overlay itself no longer scrolls. `.search__results` is now the only scrolling element, so it is the only one the smooth-scroll library must leave alone. If the attribute stays on the outer element, the mouse wheel will scroll the page behind the overlay.

If Wagtail renders search results into the overlay, they must be placed inside `.search__results` (the existing `data-search-list` / `data-search-meta` children). Do not add a second scrolling wrapper.

### Edit 3. Base template `<head>`: two listeners in the inline script

Static file: `src/partials/head.html`
Find in Wagtail: `__pageArrival`

The `<head>` holds one inline `<script>` wrapped in `(function (d) { ... })(document.documentElement);`. Inside that function, directly before the existing `addEventListener("load", ...)` block, add:

```js
// the page left hands on its scrollbar's width, so the transition can crop the blank strip out of its snapshot
// (read on every reveal: a page brought back by the back button is not loaded again)
addEventListener("pageswap", function () {
  try { sessionStorage.setItem("page-scrollbar", Math.ceil(innerWidth - d.getBoundingClientRect().width) + "px"); } catch (e) {}
});
addEventListener("pagereveal", function () {
  try { d.style.setProperty("--page-scrollbar", sessionStorage.getItem("page-scrollbar") || "0px"); } catch (e) {}
});
```

`d` is the function's parameter (`document.documentElement`). Leave the existing `pagereveal` listener inside `window.__pageArrival` as it is; this is a second, separate listener.

### Edit 4. Icon sprite: the download icon becomes two symbols

Static file: `src/partials/icons.html`
Find in Wagtail: `id="icon-download"`

The single symbol `icon-download` (three `<path>` elements) is replaced by two symbols with the same `viewBox`. The path data is unchanged; it is only regrouped.

Before:

```html
<symbol id="icon-download" viewBox="10.39 -7.78 15.49 15.38" fill="none">
  <path ... />  <!-- 1: the vertical shaft -->
  <path ... />  <!-- 2: the arrow head -->
  <path ... />  <!-- 3: the tray line -->
</symbol>
```

After:

```html
<symbol id="icon-download-arrow" viewBox="10.39 -7.78 15.49 15.38" fill="none">
  <path ... />  <!-- 1: the vertical shaft -->
  <path ... />  <!-- 2: the arrow head -->
</symbol>
<symbol id="icon-download-tray" viewBox="10.39 -7.78 15.49 15.38" fill="none">
  <path ... />  <!-- 3: the tray line -->
</symbol>
```

Keep the three paths in their original order: the first two go into `icon-download-arrow`, the third into `icon-download-tray`. Copy the two finished symbols from the static file if that is easier. After this, `#icon-download` no longer exists, so edit 5 is required.

### Edit 5. Download button: two `<use>` elements

Static file: `src/policies.html` (the "School Annual Report" banner)
Find in Wagtail: `btn-icon` or `#icon-download`

Wherever Wagtail outputs a Download button, its icon `<svg>` must now reference the tray and the arrow separately, tray first.

Before:

```html
<a class="btn btn-primary btn-icon" href="...">Download<svg class="icon" aria-hidden="true"><use href="#icon-download"></use></svg></a>
```

After:

```html
<a class="btn btn-primary btn-icon" href="...">Download<svg class="icon" aria-hidden="true"><use href="#icon-download-tray"></use><use class="btn-icon__arrow" href="#icon-download-arrow"></use></svg></a>
```

The class `btn-icon__arrow` on the second `<use>` is what the hover animation targets. Search the whole Wagtail project for any other `#icon-download` reference and update it the same way; a leftover reference renders an empty icon.

### Edit 6. Mina Wylie section: animation name

Static file: `src/sections/preparatory-program/mina-wylie.html` (Wagtail block: `split_feature`)
Find in Wagtail: `split-feature__photo` or `swing-in`

On the photo `<figure>`, change one attribute value. Leave every other attribute as it is.

Before: `data-anim-type="swing-in"`
After: `data-anim-type="wave-in"`

The `swing-in` preset has been removed from `anim.js`. If the template keeps the old value, the photo silently falls back to a plain fade-up.

## 3. Script changes in detail

Only needed for Option B, or if the Wagtail copy of a script was modified. The `.patch` file has the same hunks with full context.

### `src/assets/scripts/anim.js`

Two changes:

1. A new settings object `WAVE` and a derived `WAVE_FRAMES`, placed directly above `const REVEAL = {`.
2. In `REVEAL`, the `"swing-in"` entry is replaced by `"wave-in"`.

```js
// Knobs for `wave-in` (the Mina Wylie photo). "% of the way in" is the share of its path already travelled.
const WAVE = {
  x: 120,               // start, % of its own width: + from the right, - from the left
  y: 0,                 // start, % of its own height: + from below, - from above
  scale: [1, 0.8, 1], // entering, smallest, at rest
  zoomOutAt: 12,        // % of the way in where it starts to shrink
  zoomInAt: 70,         // % of the way in where it is smallest and starts to grow
  fadeBy: 8,            // % of the way in by which it is fully visible
  ease: "power1.out",   // how the travel slows into place ("none" = even speed)
};
const WAVE_FRAMES = [[WAVE.fadeBy, { autoAlpha: 1 }], [WAVE.zoomOutAt, { scale: WAVE.scale[0] }], [WAVE.zoomInAt, { scale: WAVE.scale[1] }], [100, { scale: WAVE.scale[2] }]]
  .reduce((frames, [at, vars]) => ({ ...frames, [`${at}%`]: { ...frames[`${at}%`], ...vars } }), { easeEach: "sine.inOut" });
```

```js
// removed
"swing-in":   { from: { xPercent: 92, yPercent: -145, rotation: 90, autoAlpha: 0 }, to: { xPercent: 0, yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out" } },
// added in its place
"wave-in":    { from: { xPercent: WAVE.x, yPercent: WAVE.y, scale: WAVE.scale[0], autoAlpha: 0 }, to: { xPercent: 0, yPercent: 0, keyframes: WAVE_FRAMES, duration: 1.2, ease: WAVE.ease } },
```

The `WAVE` values were tuned by hand. Copy them exactly.

### `src/assets/scripts/search.js`

All changes are inside `initSearch()`. The search-ranking and result-rendering code is untouched apart from one added line.

**a. New state and two helpers**, added after `let hideTimer;`:

```js
let lockTimer;
const html = document.documentElement;

// Once the wash is up the page is locked: its scrollbar goes and the width it leaves is kept clear (_base.less)
const lock = () => {
  const width = html.getBoundingClientRect().width;
  html.classList.add("is-scroll-locked");
  html.style.setProperty("--scrollbar-size", `${html.getBoundingClientRect().width - width}px`);
};
const unlock = () => {
  clearTimeout(lockTimer);
  html.classList.remove("is-scroll-locked");
  html.style.removeProperty("--scrollbar-size");
};
```

**b. In `render()`**, after `results.hidden = false;` add:

```js
results.scrollTop = 0;
```

**c. In `open()`**, the old scrollbar measurement is removed and a delayed lock is added.

Before:

```js
// Stopping Lenis clips the page scrollbar; the header and bar pad by its width so they do not slide
const html = document.documentElement;
html.style.setProperty("--scrollbar-size", `${window.innerWidth - html.clientWidth}px`);
box.hidden = false;
html.classList.add("has-search-open");
setExpanded(true);
Anim.stop();
requestAnimationFrame(() => {
```

After:

```js
box.hidden = false;
html.classList.add("has-search-open");
setExpanded(true);
Anim.stop();
lockTimer = setTimeout(lock, 400);
requestAnimationFrame(() => {
```

**d. In `close()`**, the page unlocks first, and `has-search-open` and `Anim.start()` move to the end of the fade.

Before:

```js
box.classList.remove("is-open");
document.documentElement.classList.remove("has-search-open");
setExpanded(false);
Anim.start();
const done = () => {
  box.hidden = true;
  document.documentElement.style.removeProperty("--scrollbar-size");
  box.removeEventListener("transitionend", done);
};
```

After:

```js
box.classList.remove("is-open");
unlock();
setExpanded(false);
// Only the wash's own fade ends it: a button's colour change inside finishes sooner and would cut the fade short.
// The header stays above the wash until then (has-search-open), or the wash would cover it for the length of the fade
const done = (event) => {
  if (event && (event.target !== box || event.propertyName !== "opacity")) return;
  clearTimeout(hideTimer);
  box.removeEventListener("transitionend", done);
  box.hidden = true;
  html.classList.remove("has-search-open");
  Anim.start();
};
```

The two lines after it (`box.addEventListener("transitionend", done);` and `hideTimer = setTimeout(done, 400);`) are unchanged.

**e. A new handler on the results element**, added after the `list.addEventListener("click", ...)` block:

```js
// A list too short to scroll would hand the wheel or swipe on to the page behind
const hold = (event) => {
  if (results.scrollHeight <= results.clientHeight && event.cancelable) event.preventDefault();
};
results.addEventListener("wheel", hold, { passive: false });
results.addEventListener("touchmove", hold, { passive: false });
```

## 4. Style changes per file

Only needed for Option B. Copy the whole file unless the Wagtail copy has local edits.

| File (under `src/assets/styles/`) | What changed | Update |
| --- | --- | --- |
| `01-settings/_tokens.less` | Two new tokens in `:root`: `--scrollbar-thumb: #8b8b8b` and `--scrollbar-track: #fcfcfc`. They are only the end colours of the search overlay's scrollbar fade; the scrollbar is not coloured at rest | 2 |
| `03-base/_base.less` | `scrollbar-width: thin` on `html`; `@property` registrations for the two scrollbar colours and a transition on them; new `html.is-scroll-locked` rule (`overflow: clip`, and `margin-right: var(--scrollbar-size)` on `body`) | 2, 4 |
| `04-layout/_header.less` | Search and close icon swap on `.site-header__tool`, driven by `[aria-expanded="true"]`; `padding-right: var(--scrollbar-size)` on the header while `.is-scroll-locked` (from the `lg` breakpoint) | 2, 3 |
| `05-components/_search.less` | The overlay no longer scrolls: `.search__body` is a flex column and `.search__results` is the scroller, with a top fade mask. New rules `html.has-search-open` and `html:has(.search.is-open)` fade the scrollbar. The overlay background is a gradient that deepens at its right edge. Matching changes in the phone block. The submit button sets `--btn-plate` | 2, 8 |
| `06-animation/_animation.less` | One rule removed: `.lenis.lenis-stopped { overflow: clip; }` | 2 |
| `05-components/_contact.less` | The field rule and the focus line are drawn as two background layers so the line can grow from the left; new local property `--contact-line` | 5 |
| `06-animation/_page-transition.less` | New mixin `.page-snapshot-crop()`, applied to `::view-transition-old(root)` and, for a back navigation, to `::view-transition-new(root)` | 6 |
| `05-components/_buttons.less` | New mixin `.press-plate()` used by `.btn` and `.arrow-btn`: the fill and outline are drawn on `::after` and the click press acts on that only. New press timing. New `btn-icon-drop` keyframes for the Download arrow | 7, 8 |
| `05-components/_article.less` | The arrow button override sets `--btn-plate` instead of `background` | 8 |
| `05-components/_split-feature.less` | Comment wording only | 1 |

## 5. Things that break if missed

- **Button fills.** A button's fill is now the custom property `--btn-plate`, drawn on `::after`. `.btn` itself has `background-color: transparent !important`. Any Wagtail-side CSS that sets `background` or `background-color` directly on `.btn` or `.arrow-btn` will stop showing; change it to set `--btn-plate`. Theming through Bootstrap's `--bs-btn-*` variables still works unchanged.
- **`#icon-download`.** The symbol is gone. Every reference must become the two-`<use>` markup in edit 5.
- **`data-lenis-prevent`.** It must be on `.search__results` and not on `.search` (edit 2).
- **`swing-in`.** The preset is gone; the template must say `wave-in` (edit 6).
- **CSS and JS must ship together.** The new `search.js` relies on the new `html.is-scroll-locked`, `has-search-open` and `--scrollbar-size` rules. Deploying one without the other brings back a visible shift when the search opens.
- **Head script and CSS must ship together.** The page-transition crop reads `--page-scrollbar`, which only the new inline script sets. Without the script the crop is simply zero (the old strip shows); nothing errors.

## 6. Checks after porting

Use a desktop browser with a visible scrollbar. Chrome on Windows shows the most.

- [ ] **Mina Wylie photo** (Preparatory Program page): scrolling to the section, the photo comes in from the right, shrinks slightly, then grows to full size and lands in place.
- [ ] **Search opens without a shift:** clicking the header search icon moves nothing on the page, and the scrollbar fades out with the overlay.
- [ ] **Search locks the page:** while it is open, the mouse wheel does not scroll the page and nothing appears at the right edge to drag.
- [ ] **Search results:** after a search, the list scrolls under the search bar while the header and the bar stay still. Check on a phone as well.
- [ ] **Search closes cleanly:** the header does not blink and the scrollbar fades back in.
- [ ] **Search icon:** it becomes a close icon while the search is open, and back.
- [ ] **Scrollbar:** the page scrollbar is the browser's default look, thinner than before.
- [ ] **Contact form:** focusing each field draws a green line from left to right, the same weight on all four fields.
- [ ] **Page transition:** moving between pages, and using the browser back button, the outgoing page shows no pale strip down its right edge.
- [ ] **Download button** (Policies page): on hover the arrow drops through the line and returns from the top.
- [ ] **Button press:** clicking any button or slider arrow presses its background in gently; the label and arrow do not move.
- [ ] **No empty icons:** a project-wide search for `icon-download"` (with the closing quote) finds nothing; only `icon-download-arrow` and `icon-download-tray` remain.
