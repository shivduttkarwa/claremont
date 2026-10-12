# Claremont: front-end updates to port into the Wagtail build

Date: 2026-10-12 (first issued 2026-10-11; see "Revisions since the 2026-10-11 version" below)
Source of truth: the static cutup repo, `static/claremont`
Baseline: commit `97891e4` ("Dispositions and policies cells fill on hover; column hairline gone"). Everything below is the difference between that commit and the current working copy.
Companion file: `wagtail-updates-2026-10-12.patch` (same folder) is the full `git diff` of `src/` for these updates, 17 files.

## Purpose

The Claremont site was converted to Wagtail from the static cutup. After that conversion, twelve front-end updates were made in the static repo. This file tells you exactly what to change in the Wagtail project so it matches.

Nothing here changes Wagtail models, StreamField block definitions, images, fonts or npm dependencies. The work is: updated CSS and JS, plus six small template edits.

## Revisions since the 2026-10-11 version

Only for a port that already followed the 2026-10-11 issue of this file. Three things changed on 2026-10-12; the rest of this document is updated to match and needs no reconciling.

- **Mina Wylie photo (update 1).** The slide-and-zoom entry (`wave-in`) was dropped. The photo swings in from the top right again, as it did before, over a much shorter distance. If you applied the earlier edit 6 and changed `data-anim-type` to `wave-in`, change it back to `swing-in`. In `anim.js` the `WAVE` / `WAVE_FRAMES` block and the `"wave-in"` entry are gone; the `"swing-in"` entry now reads its start from a `SWING` object (section 3).
- **Contact form (update 5).** The focus line grows out from the middle of the field to both ends, not from the left. CSS only: take the current `_contact.less`.
- **Built files.** `dist/` is no longer committed in the static repo. Section 1 says where to get `main.css` and `main.js` now.

## Instructions for the agent doing the port

1. Treat the static repo as the reference. Replicate these changes; do not redesign or "improve" them. Several values were tuned by hand with the client.
2. The snippets below are the static HTML. In Wagtail the same markup lives in Django templates. Keep whatever template tags are already there (`{% static %}`, `{% url %}`, `{{ page.x }}`, block loops); only add, move or rename the parts called out.
3. Find the Wagtail counterpart of each static file by searching for the anchor string given with each edit. Do not assume file names match.
4. Do the work in this order: assets (section 1), template edits (section 2), then run the checks (section 6).
5. If a Wagtail copy of a file has local changes (most likely `search.js`), merge the change shown here into it. Do not overwrite the file.
6. If something in the Wagtail project does not match what this file describes, stop and report it rather than guessing.

## The twelve updates

| # | Update | Static files changed (under `src/`) | Wagtail work |
| --- | --- | --- | --- |
| 1 | Mina Wylie photo swings in from the top right over a short distance (it used to travel from off the page, turning a quarter turn) | `assets/scripts/anim.js` | JS only (template edit 6 is a check) |
| 2 | Search overlay: the page no longer shifts when it opens, the page is locked while it is open, the scrollbar fades with the overlay, and only the results list scrolls | `partials/search.html`, `assets/scripts/search.js`, `_search.less`, `_header.less`, `_base.less`, `_tokens.less`, `_animation.less` | Template edit 2, CSS, JS |
| 3 | Header search icon turns into a close icon while the search is open | `partials/header.html`, `_header.less` | Template edit 1, CSS |
| 4 | Page scrollbar is the browser default, only thinner | `_base.less` | CSS only |
| 5 | Contact form: the focus line grows out from the middle of the field to both ends | `_contact.less` | CSS only |
| 6 | Page transition: no blank strip down the right of the outgoing page | `partials/head.html`, `_page-transition.less` | Template edit 3, CSS |
| 7 | Download button: the arrow drops on hover | `partials/icons.html`, `policies.html`, `_buttons.less` | Template edits 4 and 5, CSS |
| 8 | Button press: only the button's background presses in, so the label and arrow no longer shift | `_buttons.less`, `_search.less`, `_article.less` | CSS only |
| 9 | Home page: the quick links (Book a tour, Apply to enrol, Contact us) enter 0.2s earlier on desktop | `sections/home-hero.html` | Template edit 7 |
| 10 | Copy that rises as it fades in no longer shivers: the rise lands early and moves in whole pixels | `assets/scripts/anim.js` | JS only |
| 11 | Inner pages: the quick links follow the hero title with no pause, by one rule in the entrance timeline | `assets/scripts/anim.js` | JS only |
| 12 | Phone search: the site's own header stays in place and its menu icon becomes the close | `assets/scripts/search.js`, `_header.less`, `_search.less` | CSS and JS only |

## 1. Assets: CSS and JS

Pick the option that matches how the Wagtail project gets its front-end assets.

**Option A: Wagtail serves the compiled files.** Take the two built files and copy them over the ones Wagtail serves. `dist/` is not committed in the static repo, so get them one of two ways:

- Build them: in the static repo run `npm ci` and then `npm run build`, and take `dist/assets/css/main.css` and `dist/assets/js/main.js`.
- Download them from the GitHub Pages deploy, which rebuilds from source on every push to `main` and is live about a minute after the push: `https://shivduttkarwa.github.io/claremont/assets/css/main.css` and `https://shivduttkarwa.github.io/claremont/assets/js/main.js`. Pages caches files for ten minutes, so if a download looks stale, retry after that.

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
- `06-animation/_animation.less`
- `06-animation/_page-transition.less`

Scripts (`src/assets/scripts/`):

- `anim.js`
- `search.js`

## 2. Template edits

Seven edits. Each lists the static file, a string to search for in the Wagtail templates, and the exact change.

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

### Edit 6. Mina Wylie section: check the animation name

Static file: `src/sections/preparatory-program/mina-wylie.html` (Wagtail block: `split_feature`)
Find in Wagtail: `split-feature__photo`

No change is needed: the photo `<figure>` keeps `data-anim-type="swing-in"`, as it had before these updates. Check that it still says so. The 2026-10-11 issue of this file asked for `wave-in` here; that preset no longer exists in `anim.js`, and a template that names it gets a plain fade-up instead of the swing.

### Edit 7. Home hero: the quick links enter earlier on desktop

Static file: `src/sections/home-hero.html` (the home hero block)
Find in Wagtail: `hero__subnav`

Add one attribute, `data-anim-lead="0.6"`, to the wrapper around the quick links. Leave the other attributes as they are, including `data-anim-lead-mobile`.

Before:

```html
<div class="hero__subnav" data-anim="sequence" data-anim-type="enter-right" data-anim-type-mobile="rise-soft" data-anim-tier="hero" data-anim-order="5" data-anim-order-mobile="2" data-anim-stagger="0.08" data-anim-stagger-mobile="0.08" data-anim-lead-mobile="0.7">
```

After:

```html
<div class="hero__subnav" data-anim="sequence" data-anim-type="enter-right" data-anim-type-mobile="rise-soft" data-anim-tier="hero" data-anim-order="5" data-anim-order-mobile="2" data-anim-stagger="0.08" data-anim-stagger-mobile="0.08" data-anim-lead="0.6" data-anim-lead-mobile="0.7">
```

This is the home page only. The inner page hero (`page-hero__subnav`) needs no template change: its timing now comes from a rule in `anim.js` (update 11).

## 3. Script changes in detail

Only needed for Option B, or if the Wagtail copy of a script was modified. The `.patch` file has the same hunks with full context.

### `src/assets/scripts/anim.js`

Two changes for the Mina Wylie photo:

1. A new settings object `SWING`, placed directly above `const REVEAL = {`.
2. In `REVEAL`, the `"swing-in"` entry reads its start position and turn from `SWING` instead of carrying the old literal values.

```js
// `swing-in` (the Mina Wylie photo) swings down from the top right: start as % of its own width / height, and the turn in degrees
const SWING = { x: 20, y: -25, rotation: 18, ease: "power3.out" };
```

```js
// before
"swing-in":   { from: { xPercent: 92, yPercent: -145, rotation: 90, autoAlpha: 0 }, to: { xPercent: 0, yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out" } },
// after
"swing-in":   { from: { xPercent: SWING.x, yPercent: SWING.y, rotation: SWING.rotation, autoAlpha: 0 }, to: { xPercent: 0, yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.2, ease: SWING.ease } },
```

The `SWING` values were tuned by hand with the client. Copy them exactly. There is no `WAVE`, `WAVE_FRAMES` or `"wave-in"` in the file; if a copy of `anim.js` from the 2026-10-11 issue has them, remove them.

Three further changes in the same file (updates 10 and 11):

3. In `DEFAULTS`, one new entry after `entranceLead`:

```js
titleLead: 0.6, // the step after a hero title: its last letters read as landed this long before they stop fading, so no pause
```

4. Above `const REVEAL = {`, a constant and a helper, and the `fade-up` preset rewritten to use them:

```js
// Copy is drawn on whole pixels, so a lift eased as slowly as the fade arrives as separate 1px hops after the copy looks
// still, and stacked paragraphs take them at different moments. The lift therefore lands early, under the fade, and
// moves in whole pixels so every line steps on the same frame
const LIFT = 15;
const whole = (ease, distance) => {
  const curve = gsap.parseEase(ease);
  return (progress) => Math.round(curve(progress) * distance) / distance;
};
```

```js
// before
"fade-up":    { from: { y: 15, autoAlpha: 0 },                to: { y: 0, autoAlpha: 1 } },
// after
"fade-up":    { from: { y: LIFT, autoAlpha: 0 },              to: { autoAlpha: 1, keyframes: { "57%": { y: 0, ease: whole("power1.out", LIFT) }, ease: "none" } } },
```

5. The entrance timeline picks the lead itself where the markup names none. `leadOf` returns `null` in that case, and `playEntrance` uses `titleLead` for the step after a hero title and `entranceLead` otherwise:

```js
// before
const leadOf = (el) => number(el, variant(el, "data-anim-lead"), DEFAULTS.entranceLead);
// after
const leadOf = (el) => {
  const name = variant(el, "data-anim-lead");
  return el.hasAttribute(name) ? number(el, name, DEFAULTS.entranceLead) : null;
};
```

```js
// in playEntrance, before
.forEach((order, i) => {
  const group = steps.filter((step) => step.order === order);
  const lead = Math.max(...group.map((step) => step.lead));
// after
.forEach((order, i, orders) => {
  const group = steps.filter((step) => step.order === order);
  // whatever follows a hero title starts as the title finishes, on every page; a lead in the markup still wins
  const afterTitle = i > 0 && steps.some((step) => step.order === orders[i - 1] && step.deferred);
  const usual = afterTitle ? DEFAULTS.titleLead : DEFAULTS.entranceLead;
  const lead = Math.max(...group.map((step) => step.lead ?? usual));
```

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

**f. The header's menu button becomes the close while the search is open** (update 12; the button only shows below the `lg` breakpoint).

A new reference next to `menuPanel`:

```js
const burger = root.querySelector(".site-header__toggle");
```

A new helper after `setExpanded`:

```js
// Below lg the site's bar stays above the panel and its burger, folded to an X, closes the search. It stops being the
// menu's toggle meanwhile: Bootstrap answers that attribute on the document, ahead of any listener on the button
const setBurger = (on) => {
  if (!burger) return;
  burger.classList.toggle("is-close", on);
  burger.setAttribute("aria-label", on ? "Close search" : "Menu");
  if (on) burger.removeAttribute("data-bs-toggle");
  else burger.setAttribute("data-bs-toggle", "offcanvas");
};
```

It is called as `setBurger(true);` in `open()` right after `setExpanded(true);`, and as `setBurger(false);` in `close()` right after `setExpanded(false);`. A click listener is added after the `closers.forEach(...)` line:

```js
if (burger) {
  burger.addEventListener("click", () => {
    if (burger.classList.contains("is-close")) close();
  });
}
```

In `close()`, the focus fallback now uses the same reference: `[...openers, burger].find(visible)`.

## 4. Style changes per file

Only needed for Option B. Copy the whole file unless the Wagtail copy has local edits.

| File (under `src/assets/styles/`) | What changed | Update |
| --- | --- | --- |
| `01-settings/_tokens.less` | Two new tokens in `:root`: `--scrollbar-thumb: #8b8b8b` and `--scrollbar-track: #fcfcfc`. They are only the end colours of the search overlay's scrollbar fade; the scrollbar is not coloured at rest | 2 |
| `03-base/_base.less` | `scrollbar-width: thin` on `html`; `@property` registrations for the two scrollbar colours and a transition on them; new `html.is-scroll-locked` rule (`overflow: clip`, and `margin-right: var(--scrollbar-size)` on `body`) | 2, 4 |
| `04-layout/_header.less` | Search and close icon swap on `.site-header__tool`, driven by `[aria-expanded="true"]`; `padding-right: var(--scrollbar-size)` on the header while `.is-scroll-locked` (from the `lg` breakpoint). While `.has-search-open`, the header's `z-index` is above the overlay at every width (it was desktop only), with no shadow below `lg`; the menu button also folds to an X when it has the class `is-close` | 2, 3, 12 |
| `05-components/_search.less` | The overlay no longer scrolls: `.search__body` is a flex column and `.search__results` is the scroller, with a top fade mask. New rules `html.has-search-open` and `html:has(.search.is-open)` fade the scrollbar. The overlay background is a gradient that deepens at its right edge. Matching changes in the phone block, where `.search__top` (the panel's own logo and close row) is now `visibility: hidden` and only keeps its room. The submit button sets `--btn-plate` | 2, 8, 12 |
| `06-animation/_animation.less` | One rule removed: `.lenis.lenis-stopped { overflow: clip; }` | 2 |
| `05-components/_contact.less` | The field rule and the focus line are drawn as background layers: the line is centred and grows out to both ends, and the rule is two halves that give way to the edges ahead of it; new local property `--contact-line` | 5 |
| `06-animation/_page-transition.less` | New mixin `.page-snapshot-crop()`, applied to `::view-transition-old(root)` and, for a back navigation, to `::view-transition-new(root)` | 6 |
| `05-components/_buttons.less` | New mixin `.press-plate()` used by `.btn` and `.arrow-btn`: the fill and outline are drawn on `::after` and the click press acts on that only. New press timing. New `btn-icon-drop` keyframes for the Download arrow | 7, 8 |
| `05-components/_article.less` | The arrow button override sets `--btn-plate` instead of `background` | 8 |

## 5. Things that break if missed

- **Button fills.** A button's fill is now the custom property `--btn-plate`, drawn on `::after`. `.btn` itself has `background-color: transparent !important`. Any Wagtail-side CSS that sets `background` or `background-color` directly on `.btn` or `.arrow-btn` will stop showing; change it to set `--btn-plate`. Theming through Bootstrap's `--bs-btn-*` variables still works unchanged.
- **`#icon-download`.** The symbol is gone. Every reference must become the two-`<use>` markup in edit 5.
- **`data-lenis-prevent`.** It must be on `.search__results` and not on `.search` (edit 2).
- **`swing-in`.** The Mina Wylie photo's template must keep `data-anim-type="swing-in"`. `wave-in` does not exist in `anim.js` and would fall back to a plain fade-up (edit 6).
- **Phone header markup.** The menu button must keep the class `site-header__toggle` and `data-bs-toggle="offcanvas"` in the template; `search.js` removes and restores that attribute while the search is open. The overlay's `.search__top` row stays in the markup: CSS hides it on phones and it still reserves the space under the header.
- **Inner page quick links.** Do not add a `data-anim-lead` to `page-hero__subnav`; the timeline rule in `anim.js` sets it. A value in the template would override the rule.
- **CSS and JS must ship together.** The new `search.js` relies on the new `html.is-scroll-locked`, `has-search-open` and `--scrollbar-size` rules. Deploying one without the other brings back a visible shift when the search opens.
- **Head script and CSS must ship together.** The page-transition crop reads `--page-scrollbar`, which only the new inline script sets. Without the script the crop is simply zero (the old strip shows); nothing errors.

## 6. Checks after porting

Use a desktop browser with a visible scrollbar. Chrome on Windows shows the most.

- [ ] **Mina Wylie photo** (Preparatory Program page): scrolling to the section, the photo swings down into place from a little above and to the right, straightening as it settles. It starts inside the band, not from off the page.
- [ ] **Search opens without a shift:** clicking the header search icon moves nothing on the page, and the scrollbar fades out with the overlay.
- [ ] **Search locks the page:** while it is open, the mouse wheel does not scroll the page and nothing appears at the right edge to drag.
- [ ] **Search results:** after a search, the list scrolls under the search bar while the header and the bar stay still. Check on a phone as well.
- [ ] **Search closes cleanly:** the header does not blink and the scrollbar fades back in.
- [ ] **Search icon:** it becomes a close icon while the search is open, and back.
- [ ] **Scrollbar:** the page scrollbar is the browser's default look, thinner than before.
- [ ] **Contact form:** focusing each field draws a green line that grows out from the middle of the field to both ends, the same weight on all four fields.
- [ ] **Page transition:** moving between pages, and using the browser back button, the outgoing page shows no pale strip down its right edge.
- [ ] **Download button** (Policies page): on hover the arrow drops through the line and returns from the top.
- [ ] **Button press:** clicking any button or slider arrow presses its background in gently; the label and arrow do not move.
- [ ] **Home quick links:** on the home page at desktop width, the three quick links start sliding in just after the hero button starts to appear.
- [ ] **Copy entrance:** on the home page, the line "Where progress is personal." and the paragraphs under it rise and fade in cleanly, with no slow one-pixel shiver at the end.
- [ ] **Inner page quick links:** on any inner page at desktop width, the quick links slide in as the hero title finishes, with no pause and not while the title is still clearly animating. The timing is the same on every inner page.
- [ ] **Phone search:** on a phone, open the menu, then the search. The header does not change (same logo, same size); only the menu icon is an X. Tapping the X closes the search and does not open the menu.
- [ ] **No empty icons:** a project-wide search for `icon-download"` (with the closing quote) finds nothing; only `icon-download-arrow` and `icon-download-tray` remain.
