# Claremont College cutup — rules (read by Claude + the Figma MCP)

Stack: plain **HTML** pages · Bootstrap 5.3 (CSS-variable themed) · **LESS** (ITCSS + BEM) · the `anim` system · build-time HTML partial includes (posthtml-include). Output in `dist/` is plain HTML + one CSS + one JS.

## Figma
- File `NM56T29qdCtdZaFwfcRdjB`, page "02 - Design Round 3 For Presentation" (canvas `2238:4789`). Desktop frames only, 1640 wide, 200px side margins → 1240 content width.
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
- **Escape fluid maths from LESS**: `~"clamp(1rem, 0.5rem + 2vw, 3rem)"`, `~"max(…)"`, `~"min(…)"`. Unescaped, LESS adds rem + vw into a wrong constant.
- Breakpoints are the LESS vars `@bp-sm … @bp-xxl` (em), mobile-first `min-width` queries.
- Headings wrap naturally (no `text-wrap: balance`): Figma's line breaks are greedy.

## Markup
- `h1`–`h6` carry **no classes**; style through the parent block (`.pillars h3`, `.site-footer h2`).
- One section = one partial in `src/sections/` with a `@wagtail-block` comment. Shared, parametrised blocks take `locals='{…}'` (JSON in a single-quoted attribute: use typographic apostrophes, escape inner double quotes). Every local a partial reads must be passed, even as `""`. Page-specific list content lives in `src/sections/<page>/`.
- Icons are `<symbol>`s in `partials/icons.html`, used via `<svg class="icon"><use href="#icon-name">`, coloured by `currentColor`. The diagonal arrow symbol is 32 wide; list arrows carry `margin-right: -0.375rem` to land where Figma's 26 frame does.
- Images: WebP under `src/assets/images/<page>/`, always with `width`/`height` attributes and alt text.
- Animation only via `data-anim-*` (loops use `data-anim-group` on the parent). Reveal animations leave an inline `opacity` on the element, so state styles that touch opacity go on a child. Banner photos use `.parallax-media(@travel)`; the inner hero uses the spare image Figma has below the frame (exact at rest).
- No inline styles. Data-driven positions (hotspots) use modifier classes that set `--x` / `--y`.

## QA
- **Never build a section from a guess.** Read its Figma nodes first (`python .qa/find.py <page-id> "<text>"` shows a text's box, style and parent frames; `.qa/extract.py <page-id>` dumps a page).
- `bash .qa/audit.sh summary|full [page …]` builds, measures each page at 1640 (`measure.mjs`) and compares with Figma (`compare.py` for sections + text runs, `compare-img.py` for photo boxes). A change is done when the page shows no `<<<` section flags and no text run off by more than ~3px. Expected noise: the two logos (Figma frame is wider than the artwork), `weight 400 vs 100` (Argent CF stand-in), the hero subtitle `dy +5` (mixed line heights), labels joined by `<br>`.
- Figma rounds text boxes up to whole pixels and draws strokes inside the box: buttons are exactly label + 48 wide, so the border comes off the padding.
- `npm run build`, then compare at 1640 with plain headless Chrome (`--window-size=1640,<tall> --screenshot`), and at phone/tablet widths with `node .qa/shot.mjs <file-url> <width> <height> <out.png> 1 [wait-ms]` (real device emulation; plain headless clamps to a minimum window width). `python .qa/slice.py` cuts tall shots into strips.
- In a very tall test viewport every reveal fires in one batch, so late elements can still be mid-animation at capture time. That is a test artefact; raise the wait.

## Never
- No CDNs, no Tailwind, no editing Bootstrap Sass, no IDs for styling, no hardcoded colours or px.
