# Claremont College — static cutup

Figma → HTML build of the Claremont College website: all ten designed pages. Plain HTML pages, Bootstrap 5.3 themed through CSS variables, LESS (ITCSS + BEM) compiled to one stylesheet, and a small bundled JS (`anim` scroll system + Bootstrap offcanvas/tabs + a few UI helpers).

## Run

```bash
npm install     # first time
npm run dev     # watch + live reload → http://localhost:3000
npm run build   # production → dist/
```

Preview the **built** pages (`dist/` or the dev server). The files in `src/` are templates: their `<include>` tags only resolve at build time.

## Pages

| Page | Source | Figma frame |
|---|---|---|
| Home | `src/index.html` | 2238:4790 |
| Preparatory Program | `src/preparatory-program.html` | 2238:4885 |
| K-6 Primary | `src/k-6-primary.html` | 2238:5016 |
| Welcome from Claremont | `src/welcome.html` | 2238:5315 |
| Extra Curricular | `src/extra-curricular.html` | 2238:5221 |
| Enrolment | `src/enrolment.html` | 2238:6149 |
| Policies | `src/policies.html` | 2238:5187 |
| News | `src/news.html` | 2238:5364 |
| News article | `src/news-article.html` | 2238:5426 |
| Contact us | `src/contact-us.html` | 2238:6241 |

## Structure

```
src/
  *.html                   pages — compose partials + sections with <include src="…" locals='{…}'>
  partials/                head, icons (SVG sprite), header + offcanvas menu, subnav, footer
  sections/                one file per block, each with a @wagtail-block contract
    page-hero.html         inner-page hero (locals: title, image, aside)      page-hero-plain.html  article hero
    intro-split.html       display statement + copy, optional buttons, dark/light theme
    feature-banner.html    full-bleed photo + callout, optional button        image-banner.html     photo only
    cta-row.html           green closing band: heading, copy, two buttons
    home-hero / teaching-approach / pillars / testimonials / cta-links        homepage blocks
    <page>/…               page content that is a list (timeline steps, link grids, staff, articles, form…)
  assets/
    styles/                LESS, ITCSS layers 01→07 (main.less is the manifest)
      01-settings/_tokens.less         ← every design token as a :root variable
      01-settings/_bootstrap-vars.less ← Bootstrap re-themed via --bs-*
      05-components/                   ← one BEM block per file
    scripts/               anim.js (data-anim-* engine), ui.js (hotspots, scrollers, tab arrows, current nav), main.js
    images/<page>/         WebP exports            fonts/  self-hosted woff2
.qa/                       git-ignored tooling: Figma REST helpers, asset converters, screenshot script
```

### Reusable blocks

`page-hero` · `intro-split` · `link-columns` (tall link columns, optional photo column) · `timeline` (zigzag steps with icon markers) · `split-feature` (copy + tilted archival photo) · `feature-banner` / `image-banner` · `cta-links` (ruled link list; light + roomy variants) · `cta-row` · `link-grid` (ruled three-column links) · `mosaic` (4×4 photos + cards) · `scroller` (edge-to-edge carousel: link cards or photos) · `staff-grid` · `media-intro` · `article-grid` + `article` · `contact` + `map-banner`.

## Design system

- **Colours:** Green `#0d4749`, Dark Green `#053333`, Blue `#c2e1ff`, Light Blue `#f4faff`, Yellow `#ffec60`, Near Black `#2b2b2b`, Grey `#a3a3a3`.
- **Type:** Instrument Sans (body, outline buttons, subheadings), Inter (nav, footer, labels, primary buttons), Argent CF Thin for display (see note below). Sizes are fluid `clamp()` tokens and everything is in rem — there is not a single `px` in the stylesheets.
- **Root size:** set per breakpoint at the top of `03-base/_base.less` — the only px in the stylesheets, since every rem resolves against it. It is 16px from phones through the 1640 design width (where the Figma match, the 44px tap targets and the 16px form controls are all verified), then steps up — 18px at 1920, 21px at 2200, 24px at 2560 — so a large monitor shows the design at its proportions instead of a small island. Adjust the numbers in that block; values at or below 1640 should stay 16.
- **Spacing:** 8px system, `--space-1` (0.5rem) … `--space-26` (13rem), used for the mobile and tablet rhythm. At the design width each component carries the exact Figma value in rem, with the px figure in a trailing comment, because Figma is not on an 8px grid (hand-placed values such as 85, 99, 115, 237).
- **Buttons:** square, 48px tall. `.btn-primary` (blue), `.btn-outline-primary` (green outline), `.btn-outline-light` (white outline), `.btn-sm` (footer), `.btn-icon` (label + icon).

## Figma match

Desktop is verified by measurement, not by eye. `bash .qa/audit.sh summary` builds the site, loads every page at 1640 wide, and compares it with the Figma node data: each section's offset and height, every text run's position, size, line height, weight, colour and family, and every photo's box. At the last run all ten pages were within 0 to 2px of Figma's total height, every section and photo box matched, and no text run was more than 3.5px from its Figma position.

Known, deliberate differences:

- **Argent CF** is installed (Thin + Thin Italic, licensed webfonts), so display headings now use the designed face. The audit still reports `weight 400 vs 100` on three of them: Figma records the Thin face as weight 100/250, while the CSS asks for 400 and the `@font-face` weight range maps that onto Thin. The rendered face is correct; only the metadata differs.
- Figma places a few items by hand with 2 to 4px of scatter that does not repeat between pages (link-column headings at 34 / 35 / 38 / 41 inside their columns, one list label 21 instead of 18 below its rule, one form label in `#000` beside three in `#2b2b2b`). Those are normalised to one value.
- Hand-placed Figma values that are consistent are kept, through modifiers: `page-hero--low-title` (Welcome), `timeline__item--tight`, `feature-banner--y168` / `--y237`, `btn-primary--sans` (the homepage hero button is the only primary not set in Inter), `btn-primary--ink` / `--deep` (label colour).

The `.qa/` folder (scripts, Figma JSON, access token) is git-ignored and local to the machine that ran the audit.

## Phone and tablet

Figma has no mobile or tablet frames, so these layouts follow common practice and are checked by `node .qa/mobile-audit.mjs` at 360, 390, 768, 820, 1024 and 1280 on every page. At the last run it reported nothing: no horizontal overflow, no touch target under 44px, no text under 12px, no form control under 16px.

- One fluid gutter for every block (20px phone, 32px tablet, 40px small laptop), which also respects the notch in landscape.
- Touch targets are at least 44px: header icons, menu links and close button, footer buttons, links and social icons, contact links, form fields, hotspot dots. Where the Figma size is smaller it only applies at desktop width with a mouse.
- Form fields use 16px type on touch so iOS does not zoom the page on focus. Body copy is 16px on phones and the designed 15px from tablet up.
- The footer keeps its exact Figma columns from 1400px; between 1200 and 1399 it uses proportional columns, because the fixed ones need about 1440px.
- The mobile menu shows the logo at a fixed size with a 44px close button.
- Loading: the hero photo is fetched first, all other images are lazy and decode off the main thread, the logo file is sized to twice its largest slot, and production CSS is minified. A page weighs 180 to 490 KB of images, 42 KB of CSS and 64 KB of JS gzipped.

## Assumptions / to confirm with the client

1. **Argent CF** was supplied by the client and is installed as `argent-cf-thin.woff2` / `argent-cf-thin-italic.woff2`. Only those two styles are used anywhere in the design. The supplied archive (desktop `.otf`, `.eot`, `.svg`, `.ttf` and the other eleven weights) is kept in the git-ignored `fonts-source/` and is deliberately **not** in `src/assets/fonts/`, because `build.mjs` copies that folder verbatim into `dist/` and desktop font files must not be published.
2. Figma only designs desktop (1640px). Tablet and mobile behaviour is a mobile-first interpretation using Bootstrap breakpoints.
3. Homepage: teaching-approach tabs 2–4 reuse the first tab's image, and hotspots 2–6 carry placeholder copy — only the first tab and hotspot have designed content. That source image is 1376px wide in Figma; request a higher-resolution original.
4. Figma itself uses one placeholder photo of two students across most slots, one placeholder staff portrait, lorem ipsum bios and "Article headline written here" cards. Those are reproduced as designed.
5. Policies: Figma underlines some policy titles and not others (linked vs unlinked text layers); all are plain links here. One label reads "Child Safe Policy  Policy" in Figma; the repeated word is dropped.
6. Contact: the map is the designed static greyscale image linking out to Google Maps; swap for an embed if wanted. The form posts nowhere yet.
7. Link-column and carousel hover states, the active nav underline and all motion are additions; Figma has no hover or motion specs.
8. Social links, search behaviour and document URLs are placeholders.

## Wagtail conversion

Each section's `@wagtail-block` comment lists its fields and block types; the markup maps 1:1 to a block template. `data-anim-*` attributes pass through untouched; loops use `data-anim-group` on the parent so the stagger survives conversion. Optional slots passed as HTML locals here (`aside`, `actions`) become `ListBlock`s in Wagtail.
