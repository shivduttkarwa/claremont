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
- **Type:** Instrument Sans (body, buttons, subheadings), Inter (nav, footer, labels), Argent CF Thin for display (see note below). Sizes are fluid `clamp()` tokens; 1rem = 16px; everything in rem.
- **Spacing:** 8px system, `--space-1` (0.5rem) … `--space-26` (13rem).
- **Buttons:** square, 48px tall. `.btn-primary` (blue), `.btn-outline-primary` (green outline), `.btn-outline-light` (white outline), `.btn-sm` (footer), `.btn-icon` (label + icon).

## Assumptions / to confirm with the client

1. **Argent CF** is a licensed font and was not supplied. `Instrument Serif` stands in, so display headings are narrower than in Figma and some wrap differently. Drop `ArgentCF-Thin.woff2` / `ArgentCF-ThinItalic.woff2` into `src/assets/fonts/` and uncomment the two `@font-face` rules in `03-base/_fonts.less`; the `--font-display` stack already lists it first.
2. Figma only designs desktop (1640px). Tablet and mobile behaviour is a mobile-first interpretation using Bootstrap breakpoints.
3. Homepage: teaching-approach tabs 2–4 reuse the first tab's image, and hotspots 2–6 carry placeholder copy — only the first tab and hotspot have designed content. That source image is 1376px wide in Figma; request a higher-resolution original.
4. Figma itself uses one placeholder photo of two students across most slots, one placeholder staff portrait, lorem ipsum bios and "Article headline written here" cards. Those are reproduced as designed.
5. Policies: Figma underlines some policy titles and not others (linked vs unlinked text layers); all are plain links here. One label reads "Child Safe Policy  Policy" in Figma; the repeated word is dropped.
6. Contact: the map is the designed static greyscale image linking out to Google Maps; swap for an embed if wanted. The form posts nowhere yet.
7. Link-column and carousel hover states, the active nav underline and all motion are additions; Figma has no hover or motion specs.
8. Social links, search behaviour and document URLs are placeholders.

## Wagtail conversion

Each section's `@wagtail-block` comment lists its fields and block types; the markup maps 1:1 to a block template. `data-anim-*` attributes pass through untouched; loops use `data-anim-group` on the parent so the stagger survives conversion. Optional slots passed as HTML locals here (`aside`, `actions`) become `ListBlock`s in Wagtail.
