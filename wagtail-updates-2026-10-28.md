# Claremont: front-end updates to port into the Wagtail build

Date: 2026-10-28
Source of truth: the static cutup repo, `static/claremont`
Baseline: commit `aa6c057`, the last commit covered by `wagtail-updates-2026-10-21.md`. Everything below is the difference between that commit and commit `71d8132`.
Companion file: `wagtail-updates-2026-10-28.patch` (same folder) is the full `git diff` of `src/` for these updates, 22 files, all text. `git apply wagtail-updates-2026-10-28.patch` applies cleanly to the baseline. `build.mjs` did not change.

## Purpose

The 2026-10-21 updates should already be in the Wagtail build. Since then the client asked for the yellow quick links (Book a tour, Apply to enrol, Contact us) to stay on screen as the page scrolls, on every page. They now do on desktop (update 1) and on phones and tablets (update 2). The client also found the hero photos slightly blurred: on a Retina laptop, a large monitor or a 3× phone the one 1840px file was stretched up to 2.5 times, so every hero now offers the browser a second, larger size (update 4). This file tells you exactly what to change in the Wagtail project so it matches the static repo again.

This one is CSS and JS, plus three template edits: the news article page and the two hero templates. There are no block changes and no content to enter.

The static news listing was also rebuilt to generate its cards from data instead of eight hand-written copies. What it renders is unchanged, so there is nothing to port for the listing.

## Instructions for the agent doing the port

1. Treat the static repo as the reference. Replicate these changes; do not redesign or "improve" them.
2. The snippets below are the static HTML. In Wagtail the same markup lives in Django templates. Keep whatever template tags are already there (`{% static %}`, `{% image %}`, `{{ page.x }}`, block loops); only add, move or rename the parts called out.
3. Find the Wagtail counterpart of each static file by searching for the anchor string given with each edit. Do not assume file names match.
4. Do the work in this order: assets (section 1), the template edits (section 2), then the checks (section 6).
5. Deploy the CSS and the JS together. The quick links need both (section 5).
6. If a Wagtail copy of a file has local changes, merge the change shown here into it. Do not overwrite the file.
7. If something in the Wagtail project does not match what this file describes, stop and report it rather than guessing.

## The updates

| # | Update | Wagtail work |
| --- | --- | --- |
| 1 | **Quick links stay in view on desktop** (the client, 28 October). From 992 wide, the yellow strip at the right edge of every hero (home and inner pages) is fixed to the screen, so it follows the page as it scrolls and stays above every section. At 1640 and wider it stays whole all the way down, because it fits in the margin beside the 1240 content column. Below 1640 the full 188px strip would cover the copy, so once the hero's bottom edge rises past the strip, each chip slides right until only its yellow icon tab shows at the screen edge (52px, 45.5px on laptops). Hovering or keyboard-focusing a tab glides its label back out over 0.6s with no bounce, and it glides back when the pointer leaves. Scrolling back up to the hero brings the full strip back | CSS, JS |
| 2 | **Quick links stay in view on phones and tablets** (below 992). The row stays where it was, on the hero photo's bottom edge, and scrolls with the page. Once it has scrolled off the top of the screen, a copy of it slides up from the bottom and sits 14px above the screen's bottom edge, 15px in from each side on phones, as Figma's scrolled phone frame draws it (`2101:13039`). It slides away when the footer comes into view (the footer has its own buttons) and when the row is back on screen. On an iPhone it also clears the home bar. Tablets show the long labels, as the hero row does. The script builds the copy, so there is no new markup | CSS, JS |
| 3 | **News article: optional standfirst and previous / next.** An article without a standfirst shows only Back to news in the left column. The newest article has no Previous link and the oldest no Next; a lone Next link stays in the right-hand column. A picture inserted in the article body gets 24px above and below | CSS, template edit 1 |
| 4 | **Sharper hero photos.** Every hero (home and inner pages) offers the browser two sizes of its photo, 1840 and 3280 wide, and two of its phone crop, 750 and 1125 wide, and the browser downloads only the one the screen needs: an ordinary laptop at 100% gets the same 1840 file as before, a Retina Mac, a large monitor, a scaled Windows laptop or a 3× phone the larger one. The crop, the position, the parallax and the entrance do not change | template edits 2 and 3 |

## 1. Assets: CSS and JS

Pick the option that matches how the Wagtail project gets its front-end assets.

**Option A: Wagtail serves the compiled files.** Copy the two built files over the ones Wagtail serves. Get them one of two ways:

- Build them: in the static repo run `npm ci` and then `npm run build`, and take `dist/assets/css/main.css` and `dist/assets/js/main.js`.
- Download them from the GitHub Pages deploy, which rebuilds on every push to `main`: `https://shivduttkarwa.github.io/claremont/assets/css/main.css` and `https://shivduttkarwa.github.io/claremont/assets/js/main.js`. Pages caches files for ten minutes, so if a download looks stale, retry after that.

That covers every style and script change in this document. Skip to section 2.

**Option B: Wagtail builds from the LESS and JS sources.** Copy these files from the static repo's `src/assets/` over the Wagtail copies, then rebuild. If a Wagtail copy has local edits, apply the matching hunk from the `.patch` file instead.

Styles (`src/assets/styles/`):

- `01-settings/_tokens.less`
- `02-tools/_mixins.less`
- `05-components/_hero.less`, `05-components/_page-hero.less`, `05-components/_subnav.less`, `05-components/_article.less`

Scripts (`src/assets/scripts/`):

- `main.js`, `ui.js`

Copy `_tokens.less` first: `_hero`, `_page-hero` and `_subnav` use its new `--z-sticky` property and `@upto-design` breakpoint, and `_subnav.less` does not compile without the breakpoint.

## 2. Template edits

### Edit 1. News article: optional standfirst and previous / next

Static file: `src/sections/news/article-body.html`
Find in Wagtail: `article__nav`

Three conditions, nothing else in the markup changes:

- The standfirst `h2` renders only when the article has one.
- The Previous link renders only when there is an older article, and the Next link only when there is a newer one.

In Django terms (use the project's own field and variable names):

```html
<div class="col-lg-5">
  {% if standfirst %}
  <h2 data-anim="split" data-anim-type="chars-soft" data-anim-type-mobile="lines">{{ standfirst }}</h2>
  {% endif %}
  <a class="btn btn-primary article__back" href="{news index url}" data-anim="reveal" data-anim-order="1">Back to news</a>
</div>
```

```html
<nav class="article__nav" aria-label="More articles">
  {% if previous %}
  <a class="article__nav-link" href="{{ previous.url }}">
    <span class="arrow-btn arrow-btn--prev" aria-hidden="true"><svg class="icon"><use href="#icon-arrow-right"></use></svg></span>
    <span class="article__nav-label"><span>Previous</span><span>{{ previous.title }}</span></span>
  </a>
  {% endif %}
  {% if next %}
  <a class="article__nav-link article__nav-link--next" href="{{ next.url }}">
    <span class="article__nav-label"><span>Next</span><span>{{ next.title }}</span></span>
    <span class="arrow-btn arrow-btn--next" aria-hidden="true"><svg class="icon"><use href="#icon-arrow-right"></use></svg></span>
  </a>
  {% endif %}
</nav>
```

If the Wagtail template already has these conditions, there is nothing to do here; the CSS in `_article.less` keeps a lone Next link on the right.

The quick links need **no** template change: the script and styles find them through the classes the templates already have (`.hero` or `.page-hero`, and `.subnav` inside them).

### Edit 2. Inner-page hero: two sizes of the photo

Static file: `src/sections/page-hero.html`
Find in Wagtail: `page-hero__img`

Before:

```html
<source media="(min-width: 576px)" srcset="{image}" width="1840" height="1090">
<img class="page-hero__img" fetchpriority="high" decoding="async" src="{image_m}" alt="" width="750" height="750" ...>
```

After:

```html
<source media="(min-width: 576px)" srcset="{image at 1840} 1840w, {image at 3280} 3280w" sizes="100vw" width="1840" height="1090">
<img class="page-hero__img" fetchpriority="high" decoding="async" src="{image_m at 750}" srcset="{image_m at 750} 750w, {image_m at 1125} 1125w" sizes="100vw" alt="" width="750" height="750" ...>
```

Everything after `height="750"` (the `data-anim-*` attributes) stays as it is.

In Django terms (use the project's own field names). Take each `w` number from the rendition, not as a fixed figure, so the list always states the files' real widths:

```html
{% image page.hero_image width-1840 as hero_1x %}
{% image page.hero_image width-3280 as hero_2x %}
{% image page.hero_image_m width-750 as hero_m %}
{% image page.hero_image_m width-1125 as hero_m_3x %}
<source media="(min-width: 576px)" srcset="{{ hero_1x.url }} {{ hero_1x.width }}w, {{ hero_2x.url }} {{ hero_2x.width }}w" sizes="100vw" width="{{ hero_1x.width }}" height="{{ hero_1x.height }}">
<img class="page-hero__img" fetchpriority="high" decoding="async" src="{{ hero_m.url }}" srcset="{{ hero_m.url }} {{ hero_m.width }}w, {{ hero_m_3x.url }} {{ hero_m_3x.width }}w" sizes="100vw" alt="" width="{{ hero_m.width }}" height="{{ hero_m.height }}" ...>
```

### Edit 3. Home hero: two sizes of the photo

Static file: `src/sections/home-hero.html`
Find in Wagtail: `hero__img`

The same change with the home photo's sizes: the desktop `srcset` is `1842w` and `3280w`, the phone `srcset` is `750w` and `1125w`, both with `sizes="100vw"`; the `width` / `height` attributes stay 1842 × 1417 and 750 × 1028. In Django terms, `width-1842` and `width-3280` on the desktop photo, `width-750` and `width-1125` on the phone crop, with the `w` numbers taken from the renditions as in edit 2.

## 3. Script changes in detail

Only needed for Option B, or if the Wagtail copy of a script was modified. The `.patch` file has every hunk with full context.

| File | What changed | Update |
| --- | --- | --- |
| `ui.js` | New `initSubnavTuck()`: finds the `.subnav` inside the page's `.hero` or `.page-hero` (returns if there is none). On scroll and resize, at most once per frame, it toggles `is-tucked` on that `.subnav`: on when the hero's bottom edge is above the strip's bottom edge, off otherwise. It runs at every width; the CSS only acts on the class from 992 to 1639 | 1 |
| `ui.js` | New `initSubnavBar()`: finds the same `.subnav` (returns if there is none), deep-clones it, strips every `style` and `data-anim-item` attribute from the copy (the hero entrance may be mid-way when it runs), gives the copy's links `tabindex="-1"`, wraps it in `<div class="subnav-bar" aria-hidden="true">` and appends that to `<body>`. Screen-reader and keyboard users keep the hero's own row. On scroll and resize, at most once per frame, it toggles `is-shown` on the bar: on when the hero row's bottom edge is above the top of the screen and the `.site-footer` has not yet come into view, off otherwise. It runs at every width; the CSS hides the bar from 992 | 2 |
| `main.js` | Imports `initSubnavTuck` and `initSubnavBar` from `ui.js` and calls them, in that order, straight after `initStickyHeader()` | 1, 2 |

## 4. Style changes per file

Only needed for Option B. Copy the whole file unless the Wagtail copy has local edits.

| File (under `src/assets/styles/`) | What changed | Update |
| --- | --- | --- |
| `01-settings/_tokens.less` | New `--z-sticky: 1020` (between the page's own layers, 3 at most, and the header's 1050; the desktop heroes and the phone bar use it) and a new breakpoint `@upto-design: ~"(max-width: 1639.98px)"` | 1, 2 |
| `02-tools/_mixins.less` | `.subnav-dock()` (the quick-link strip from 992): `position: fixed` instead of `absolute`; while the search overlay locks the page (`.is-scroll-locked`) its `right` is `var(--scrollbar-size, 0)`, so the strip holds still when the scrollbar goes | 1 |
| `05-components/_hero.less` | `.hero` takes `z-index: var(--z-sticky)` inside its existing `min-width: 992px` block | 1 |
| `05-components/_page-hero.less` | `.page-hero` takes `z-index: var(--z-sticky)` in its `min-width: 992px` rule | 1 |
| `05-components/_subnav.less` | New `--subnav-tab: 3.25rem` (52). From 992 to 1639, `.subnav.is-tucked .subnav__link` transitions `transform` over `--duration-slow` on `--ease-out`, is moved `translateX(calc(100% - var(--subnav-tab)))` when not hovered or focused, and `transform: none` when hovered or keyboard-focused. New `.subnav-bar`: `position: fixed`, `inset: auto var(--subnav-bar-inset) var(--subnav-bar-bottom)` (15 in at phones, the gutter less 5; 14 above the screen's foot plus `env(safe-area-inset-bottom)`), `z-index: var(--z-sticky)`; hidden below the screen's edge (`translateY(calc(100% + var(--subnav-bar-bottom)))`, `visibility: hidden`) until `.is-shown`, sliding over `--duration-base` on `--ease-out`; `display: none` from 992 | 1, 2 |
| `05-components/_article.less` | `.article__body figure { margin: var(--space-3) 0; }`; `.article__nav-link--next { grid-column: 2; }` | 3 |

## 5. Things that break if missed

- **The hero's `z-index` is what lifts the strip over the page.** The hero has `isolation: isolate`, so without the new `z-index` the fixed strip is trapped in the hero's layer and later sections scroll over it. Port the `_hero.less` and `_page-hero.less` lines with the mixin change.
- **The quick links must stay inside the hero section element** (`<section class="hero">` or `<section class="page-hero">`). The script finds them there, and the hero's layer is what carries them. A page whose hero uses another class gets a strip that is fixed but never tucks and stays under later sections, and no phone bar. If the Wagtail build has such a page type, stop and report it.
- **CSS and JS together.** With the CSS alone the strip follows the scroll but never tucks, so between 992 and 1639 it covers the right edge of the copy, and phones get no bar. With the JS alone the desktop strip still scrolls away, and the phone bar's copy renders unstyled at the bottom of the page.
- **The footer's class.** The bar hides when `.site-footer` comes into view. If the Wagtail footer has another class, the bar stays over the footer: stop and report it.
- **Do not add the bar to the templates.** The script builds it. A hand-written copy would show two bars.
- **Anything that must sit above the strip** needs a `z-index` above 1020 at the top level of the page. Bootstrap's modals (1055) and the site's header (1050) and search overlay (1080) are already above it. A dropdown or tooltip at Bootstrap's 1000 inside a later section would show under the strip where the two meet.
- **Hero photos: rendition quality.** Wagtail re-encodes every rendition. The project's WebP quality (`WAGTAILIMAGES_WEBP_QUALITY`, and `WAGTAILIMAGES_JPEG_QUALITY` if the heroes are JPEG) should be 80 or higher, and the hero `{% image %}` tags should carry no `webpquality-` / `jpegquality-` below 80; lower softens the photos again.
- **Hero photos: keep `sizes="100vw"`.** A smaller value would send the small file to large screens.
- **Hero photos: renditions, not the original file.** If a hero template serves the original image file (`{{ image.file.url }}` or `original`), switch it to the renditions in edits 2 and 3; otherwise the largest file goes to every screen.
- **Cached assets.** If Wagtail serves `main.css` and `main.js` with a long cache and no version in the URL, bump the version, or returning visitors get the new CSS with the old JS (or the reverse) until their cache expires.

## 6. Checks after porting

- [ ] **1280 × 800, an inner page (K-6 Primary):** the strip sits at the top right of the hero as before. Scroll down: once the hero's bottom passes the strip, the three chips slide right and leave three yellow icon tabs at the screen edge, clear of the copy. Hover a tab: its label glides out with no bounce, and glides back when the pointer leaves. Scroll back up to the hero: the full strip returns.
- [ ] **1280 × 800, the home page:** the same, with the strip level with the top of the hero title.
- [ ] **1640 × 1000 or wider:** the full strip follows the page all the way down and never tucks; it sits in the margin beside the content column, above every section, photos and colour bands included.
- [ ] **Keyboard, below 1640:** scroll past the hero and Tab to a tucked tab: its label slides out while it has the focus.
- [ ] **Search:** open the search from a scrolled page. The overlay covers the strip, and nothing jumps at the right edge as it opens or closes.
- [ ] **Phone, 375 wide, the home page:** at the top, the Tour / Enrol / Contact row sits on the hero photo's bottom edge, as before. Scroll down: once the row has gone off the top of the screen, the same three chips slide up from the bottom and sit just above the bottom edge. Keep scrolling to the footer: the bar slides away. Scroll back up to the top: the bar slides away and the row is in its place on the photo. On an iPhone the bar sits clear of the home bar.
- [ ] **Phone, an inner page (K-6 Primary):** the same, with the row on the hero's bottom edge.
- [ ] **Phone menu and search:** open either from a scrolled page; it covers the bar.
- [ ] **Tablet, 820 wide:** the bar shows the long labels (Book a tour, Apply to enrol, Contact us). At 992 and wider there is no bar.
- [ ] **News article:** the newest article shows only Next, on the right; the oldest shows only Previous. An article without a standfirst shows only the Back to news button in the left column. A picture in the body has space above and below it.
- [ ] **Hero photos, DevTools → Network → Img, 1366 × 768 at 100%:** an inner page's hero loads the 1840 rendition.
- [ ] **Hero photos, a Retina Mac or DevTools' device toolbar at DPR 2, 1440 wide:** the hero loads the 3280 rendition, and the photo is as crisp as the static build on GitHub Pages.
- [ ] **Hero photos, phone at DPR 3 (iPhone in the device toolbar):** the hero loads the 1125 phone crop.
- [ ] **Hero photos, all nine pages:** each hero shows the same photo, crop and position as before, only sharper.
