# Claremont College cutup — rules (read by Claude + the Figma MCP)

Stack: plain **HTML** pages · Bootstrap 5.3 (CSS-variable themed) · **LESS** (ITCSS + BEM) · the `anim` system · build-time HTML partial includes (posthtml-include). Output in `dist/` is plain HTML + one CSS + one JS.

## Figma
- File `IOcoW0YV5Habv7cMDDqs9b` (the client original; `NM56T29qdCtdZaFwfcRdjB` is an earlier copy, verified identical across all 2,362 nodes on 2026-09-21), page "02 - Design Round 3 For Presentation" (canvas `2238:4789`). Desktop frames only, 1640 wide, 200px side margins → 1240 content width.
- **Never build a page from guesses.** If Figma cannot be read, stop on that page and say so. The user expects exact design and content.
- Figma MCP on this Starter plan allows **20 tool calls per month**. Prefer the REST helpers in `.qa/` (token in the git-ignored `.qa/.figma-token`):
  - `python .qa/figma.py nodes <ids> <out.json>` — full node data (copy, type styles, fills, geometry). Still open when image renders are capped. Add `&geometry=paths` for vector paths.
  - `python .qa/extract.py <page-id>` — readable dump of a cached page (`.qa/figma/pages.json` holds all ten pages).
  - `python .qa/figma.py render …` — PNG/SVG renders. **Capped hard on Starter** (a 429 with Retry-After of days after about ten calls). Do not depend on it.
  - `python .qa/fills-crop.py` — reproduces any image slot exactly from the original fill + the node's `imageTransform` (validated to <1/255 against a Figma render). Nodes reported with rotation = π are **horizontal mirrors**.
  - `python .qa/icons-from-geometry.py` — rebuilds icon SVGs from node geometry; `sprite-add.py` puts them in the sprite.
- Compare against the true renders in `.qa/figma/renders/` at 1640 wide.

## Tokens + units
- Every design value lives in `src/assets/styles/01-settings/_tokens.less` as a `:root` custom property. Custom CSS uses `var(--…)` only; **no px anywhere** (rem, em, %, vw). The 8px scale (`--space-*`) drives mobile and tablet rhythm; at the design width components use the exact Figma value in rem with the px figure in a trailing comment (`5.3125rem; // 85`). Component-specific Figma measures are declared as local custom properties at the top of the block, with the px value in a trailing comment.
- Bootstrap is themed only through `--bs-*` in `_bootstrap-vars.less`; buttons through `--bs-btn-*` in `05-components/_buttons.less`.
- **The root font-size is a px table per breakpoint**, in `html` in `03-base/_base.less` — the one place px is allowed, because every rem resolves against it. Nothing else in the project may use px. 16 holds from 0 to the 1640 design width and is load-bearing there: the Figma audit at 1640, the 44 tap targets (`2.75rem`), the 16 form controls and the 12 text floor are all rem and verified at 16, so changing any value up to 1640 breaks them. Above it the whole design steps up together (18 at 1920, 21 at 2200, 24 at 2560) so a wide screen is not a small island. A px root ignores the reader's own browser font setting (browser zoom still works); switching the table to `%` — `100%` for 16, `112.5%` for 18, `131.25%` for 21, `150%` for 24 — renders identically and restores that. After any change here, re-run the Figma audit and `mobile-audit.mjs`: both must be unchanged, because both only ever see 16.
- **Escape fluid maths from LESS**: `~"clamp(1rem, 0.5rem + 2vw, 3rem)"`, `~"max(…)"`, `~"min(…)"`. Unescaped, LESS adds rem + vw into a wrong constant.
- Breakpoints are the LESS vars `@bp-sm … @bp-xxl` (em), mobile-first `min-width` queries.
- Headings wrap naturally (no `text-wrap: balance`): Figma's line breaks are greedy.

## Markup
- `h1`–`h6` carry **no classes**; style through the parent block (`.pillars h3`, `.site-footer h2`).
- One section = one partial in `src/sections/` with a `@wagtail-block` comment. Shared, parametrised blocks take `locals='{…}'` (JSON in a single-quoted attribute: use typographic apostrophes, escape inner double quotes). Every local a partial reads must be passed, even as `""`. Page-specific list content lives in `src/sections/<page>/`.
- Icons are `<symbol>`s in `partials/icons.html`, used via `<svg class="icon"><use href="#icon-name">`, coloured by `currentColor`. The diagonal arrow symbol is 32 wide; list arrows carry `margin-right: -0.375rem` to land where Figma's 26 frame does.
- Images: WebP under `src/assets/images/<page>/`, always with `width`/`height` attributes and alt text.
- Animation only via `data-anim-*` (loops use `data-anim-group` on the parent). Reveal animations leave an inline `opacity` on the element, so state styles that touch opacity go on a child. `data-anim="sequence"` plays one staggered timeline over its `data-anim-item` descendants (the header drop, the hero quick links, the approach tabs and hotspots) and clears their inline styles when done, so those items keep their own hover transitions; an item may name its own preset (`data-anim-item="wipe-right"` on the open hotspot card). Scroll reveals play once the element's top reaches 85% of the viewport; `data-anim-start` overrides that in ScrollTrigger syntax for tall blocks whose pieces sit low (the hotspots use `top 45%`). `data-anim-tier="hero"` is the page entrance: one timeline on load, stepping through `data-anim-order` (header 0, title 1, then the rest), each step starting 0.4s before the previous one ends unless `data-anim-lead` says otherwise. Hero titles are `data-anim="split" data-anim-type="chars"` (the reference: characters rise 50px, 0.3s each, 30ms apart) and section titles are `chars-soft` (14px, 0.25s, 20ms apart, the whole run capped at 0.5s); both revert to the original markup when done, so kerning is exact at rest. The build-time search index gives headings without an `id` a slug, so a result can deep-link to its section. Banner photos use `.parallax-media(@travel)`; the inner hero uses the spare image Figma has below the frame (exact at rest).
- No inline styles. Data-driven positions (hotspots) use modifier classes that set `--x` / `--y`.

## Phone + tablet
- Figma only designs 1640. Everything below is mobile-first interpretation, checked with `node .qa/mobile-audit.mjs <widths> [page …]` (overflow, tap targets under 44, text under 12, inputs under 16, oversized images). It must print no findings from 360 to 1366.
- **One gutter everywhere**: `.container` is fluid up to the 1240 content width and every full-bleed block pads with `--container-gutter` (20 phone, 32 from md, 40 from lg, notch-aware through `env(safe-area-inset-*)`). Never reintroduce Bootstrap's fixed container widths.
- **Touch targets are 44 (`--tap-size`)**. Base styles are the touch size; the compact Figma size goes inside `@media @fine-lg` / `@fine-xl` (desktop width + a real mouse). Where the layout must not move, `.tap-area()` adds an invisible 44 hit area through `::before`; never on stacked links closer than 44 apart, and not on elements that already use `::before`.
- Form controls are 16px on touch (iOS zooms the page below that); body copy is 16 on phones, 15 from md.
- Hover styling on controls that stay on screen (carousel arrows) sits inside `@media (hover: hover)`.
- Desktop-only measures (`max-width` for the zigzag timeline, fixed footer columns) start at the breakpoint that needs them, not before.
- Hero images carry `fetchpriority="high"`; everything below the fold is `loading="lazy" decoding="async"`. Production CSS is minified by esbuild in `build.mjs`.

## QA
- **Never build a section from a guess.** Read its Figma nodes first (`python .qa/find.py <page-id> "<text>"` shows a text's box, style and parent frames; `.qa/extract.py <page-id>` dumps a page).
- `bash .qa/audit.sh summary|full [page …]` builds, measures each page at 1640 (`measure.mjs`) and compares with Figma (`compare.py` for sections + text runs, `compare-img.py` for photo boxes). A change is done when the page shows no `<<<` section flags and no text run off by more than ~3px. Expected noise: the two logos (Figma frame is wider than the artwork), `weight 400 vs 100` (Figma records the Argent CF Thin face as 100/250; the CSS asks for 400 and the `@font-face` range maps it onto Thin — the rendered face is correct), labels joined by `<br>`, and runs where Figma's own boxes disagree — the hero's x values (h1 198 / subtitle 201 / body 200) and the preparatory 4-up label row whose gaps are 406/416/406 against an even 410. `compare.py` matches a Figma text node to the widest measured run, so a node split across a wrapper and an inner span (enrolment's "Direct line") reports the wrapper's font — check the span before treating it as a defect.
- Figma rounds text boxes up to whole pixels and draws strokes inside the box: buttons are exactly label + 48 wide, so the border comes off the padding.
- `npm run build`, then compare at 1640 with plain headless Chrome (`--window-size=1640,<tall> --screenshot`), and at phone/tablet widths with `node .qa/shot.mjs <file-url> <width> <height> <out.png> 1 [wait-ms]` (real device emulation; plain headless clamps to a minimum window width). `python .qa/slice.py` cuts tall shots into strips.
- In a very tall test viewport every reveal fires in one batch, so late elements can still be mid-animation at capture time. That is a test artefact; raise the wait.

## Never
- No CDNs, no Tailwind, no editing Bootstrap Sass, no IDs for styling, no hardcoded colours or px — the single exception is the root font-size table in `03-base/_base.less` (see Tokens + units).
