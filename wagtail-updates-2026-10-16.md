# Claremont: front-end updates to port into the Wagtail build

Date: 2026-10-16
Source of truth: the static cutup repo, `static/claremont`
Baseline: commit `a0f5ff3`, the commit that issued `wagtail-updates-2026-10-12.md`. Everything below is the difference between that commit and commit `2dbafee`.
Companion file: `wagtail-updates-2026-10-16.patch` (same folder) is the full `git diff` of `src/` and `build.mjs` for these updates, 94 files. The 40 image files in it show only as "Binary files differ": take the images from the repo itself (section 2).

## Purpose

The 2026-10-12 updates are already in the Wagtail build. Since then the agency's October review of the staging site was worked through, page by page, against the Figma file. This file tells you exactly what to change in the Wagtail project so it matches the static repo again.

Unlike the last update, this one is not only CSS and JS. It also has:

- new and replaced photos (section 2);
- a few block changes: an optional phone photo on three blocks, the home "Where would you like to start?" rows becoming dropdowns, the contact map becoming a live embed, and two block swaps on the Extra Curricular and Preparatory pages (section 3);
- template edits (section 4);
- content to enter in the Wagtail admin: the home "Our approach" tabs, quotes and image alt text (section 5).

## Instructions for the agent doing the port

1. Treat the static repo as the reference. Replicate these changes; do not redesign or "improve" them. Many values were measured against Figma or tuned by hand with the client.
2. The snippets below are the static HTML. In Wagtail the same markup lives in Django templates. Keep whatever template tags are already there (`{% static %}`, `{% image %}`, `{{ page.x }}`, block loops); only add, move or rename the parts called out.
3. Find the Wagtail counterpart of each static file by searching for the anchor string given with each edit. Do not assume file names match.
4. Do the work in this order: assets (section 1), images (section 2), blocks (section 3), templates (section 4), content (section 5), then the checks (section 9).
5. A block field you add needs a migration. Make every new field optional, so existing pages keep working before their content is entered.
6. If a Wagtail copy of a file has local changes, merge the change shown here into it. Do not overwrite the file.
7. If something in the Wagtail project does not match what this file describes, stop and report it rather than guessing.

## The updates

| # | Update | Wagtail work |
| --- | --- | --- |
| 1 | **Home "Our approach" tabs** follow the Design 2 frames: new photos, real copy on every tab (six hotspots on the first, three on each of the others), new marker positions, and every card opens to the right of its marker (the script moves it only when it would leave the photo or cover the title). The four tabs and their arrows now fit a 992 screen | CSS, JS, template edit 1, content (section 5) |
| 2 | **Phone buttons stack full width**, 30 apart, as every 375 frame draws them: the footer pair, the CTA rows, intro buttons, the dropdown bands' button, banner buttons, the contact Submit, the article's Back to news and the home hero button. The phone footer centres its social icons | CSS only |
| 3 | **Policies report banner**: the Design 2 photo, washed white on the copy's side with Dark Green copy on desktop | Template edit 9, image |
| 4 | **Extra Curricular "Learning music"** is now the same full-width photo banner as K-6's music band, replacing the old photo-above-copy block (`media_intro`) | Block swap (section 3), template edit 13, images |
| 5 | **Search**: the search term is highlighted in each result's page label too | JS only |
| 6 | **Home hero title and copy** are set as Figma renders them: the title's letter-spacing and indent, the subtitle's minimum size, the copy's tracking | CSS only |
| 7 | **Laptops, 992 to 1200**: the header logo and links scale down a little further so the nav fits | CSS only |
| 8 | **Stacked banners on phones** (home faith banner, K-6 sport and music) show the phone frame's own square photo, and no longer drift (no phone parallax) | Images, template edit 3 |
| 9 | **Banner photos fade in** on scroll instead of zooming in | Template edits 3 and 4 |
| 10 | **Preparatory's second photo banner** gets its own phone square | Block field (section 3), template edit 4, image |
| 11 | **Quote sliders**: on phones each card follows its own Figma frame; home's hover quotes break line for line as Figma draws them; the first testimonial gets its own phone photo; the Maths and Reading quotes lose their quote marks (Figma has none); the educator card's arrow turns green only once the quote box reaches it | CSS, block field (section 3), template edit 6, content |
| 12 | **Preparatory "Our teaching approach" columns**: copy breaks as Figma draws them, "Kimochis®" with a small raised ®, the stacked accordion is kept up to 1200 wide (an iPad Pro in portrait), and on a touch screen one column is open at a time | CSS, JS, template edit 8 |
| 13 | **Preparatory photo band** is the shared photo carousel (the K-6 one) with Figma's eight slides, replacing the first photo banner | Block swap (section 3), images |
| 14 | **K-6 "The art of teaching" mosaic** on phones is the stacked deck, as the quote slider is, each photo with its own 750 × 600 phone crop | Block field (section 3), template edit 7, images |
| 15 | **News listing**: the arrow loads the next page's cards in place instead of opening a new page; the card photo zooms very slightly on hover | JS, CSS, template edit 10 |
| 16 | **News article**: phone layout from its 375 frame, and the entrance order is title, Back to news, photo, then the copy one paragraph at a time | CSS, template edit 11 |
| 17 | **Policies list on phones** follows its 375 frame | CSS only |
| 18 | **Phone section titles** rise line by line without the line breaks shifting at the end | JS only |
| 19 | **Extra Curricular activity cards**: the seam between cards is drawn as Figma renders it | CSS only |
| 20 | **Contact map** is the live Google map, greyscale, at the size and extent of the design's map | Template edit 12, block field (section 3) |
| 21 | **Home "Where would you like to start?"** rows are dropdowns again (Figma builds them from its "Drop down" component), sharing one block with the enrolment and policies dropdowns | Block change (section 3), template edit 2, content |
| 22 | **Dropdown hover** on every green band (home, enrolment, policies): the row fills Light Blue, the title and arrow turn Dark Green, the arrow turns down smoothly. The policies cells and the home approach rows turn their arrow on the same smooth curve | CSS only |
| 23 | **Scroll reveals**: anything on screen at load follows a fast scroll instead of waiting for the page entrance, and the reader's first scroll starts the rest of the entrance at once | JS only |
| 24 | **K-6 mosaic photos** no longer zoom on hover | CSS only |

## 1. Assets: CSS and JS

Pick the option that matches how the Wagtail project gets its front-end assets.

**Option A: Wagtail serves the compiled files.** Copy the two built files over the ones Wagtail serves. Get them one of two ways:

- Build them: in the static repo run `npm ci` and then `npm run build`, and take `dist/assets/css/main.css` and `dist/assets/js/main.js`.
- Download them from the GitHub Pages deploy, which rebuilds on every push to `main`: `https://shivduttkarwa.github.io/claremont/assets/css/main.css` and `https://shivduttkarwa.github.io/claremont/assets/js/main.js`. Pages caches files for ten minutes, so if a download looks stale, retry after that.

That covers every style and script change in this document. Skip to section 2.

**Option B: Wagtail builds from the LESS and JS sources.** Copy these files from the static repo's `src/assets/` over the Wagtail copies, then rebuild. If a Wagtail copy has local edits, apply the matching hunk from the `.patch` file instead.

Styles (`src/assets/styles/`):

- `main.less` (the `_media-intro.less` import is removed)
- `01-settings/_tokens.less`
- `02-tools/_mixins.less`
- `04-layout/_footer.less`
- `04-layout/_header.less`
- every changed file in `05-components/`: `_approach`, `_article-grid`, `_article`, `_contact`, `_cta-links`, `_cta-row`, `_feature-banner`, `_fold`, `_hero`, `_intro-split`, `_link-columns`, `_link-grid`, `_mosaic`, `_quote-slider`, `_scroller`
- `06-animation/_animation.less`
- delete `05-components/_media-intro.less`

Scripts (`src/assets/scripts/`):

- `anim.js`, `carousel.js`, `main.js`, `search.js`, `ui.js`
- `news.js` (new file; `main.js` imports it)

## 2. Images

All under `src/assets/images/`. Every file is WebP. Upload the new ones, replace the changed ones (same file name, new picture) and remove the deleted ones once nothing references them.

New:

| File | Size | Used by |
| --- | --- | --- |
| `extra-curricular/banner-music.webp` | 1840 × 1102 | Extra Curricular music banner (update 4) |
| `extra-curricular/banner-music-m.webp` | 750 × 750 | its phone square |
| `home/approach-teaching.webp` | 1840 × 768 | Home approach, first tab (replaces `teaching-approach.webp`) |
| `home/approach-teaching-m.webp` | 750 × 552 | its phone crop (replaces `teaching-approach-m.webp`) |
| `home/testimonial-1-m.webp` | 750 × 824 | First home testimonial on phones (update 11) |
| `k-6-primary/mosaic-1-m.webp` to `mosaic-5-m.webp` | 750 × 600 each | K-6 mosaic photos on phones (update 14) |
| `preparatory-program/banner-2-m.webp` | 750 × 750 | Preparatory second banner on phones (update 10) |
| `preparatory-program/carousel-1.webp` to `carousel-8.webp` | 1840 × 689 each | Preparatory photo carousel (update 13) |
| `preparatory-program/carousel-1-m.webp` to `carousel-8-m.webp` | 750 × 750 each | their phone squares |

Changed (same name, new picture):

| File | Size | Why |
| --- | --- | --- |
| `home/approach-future.webp`, `approach-wellbeing.webp`, `approach-community.webp` | 1840 × 768 (were 1640 × 684) | Design 2 photos for tabs 2 to 4 |
| `home/faith-m.webp` | 750 × 750 | Cut from the phone frame, so both children show |
| `k-6-primary/banner-sport-m.webp`, `banner-music-m.webp` | 750 × 750 | Cut from the phone frame's own squares |
| `policies/banner.webp` | 1840 × 1102 | The Design 2 photo |

Deleted: `contact/map.webp`, `extra-curricular/feature.webp`, `extra-curricular/feature-m.webp`, `home/teaching-approach.webp`, `home/teaching-approach-m.webp`, `preparatory-program/banner-1.webp` (that photo is now `carousel-1.webp`).

## 3. Block changes

1. **`image_banner`: optional phone photo.** Add an optional image field (`image_m`, a 750 × 750 square). Template edit 4 uses it. Only Preparatory's second banner has one so far.
2. **`quote_slider` slides: optional phone photo.** Add an optional image field to each slide (`image_m`). Template edit 6 uses it, with that rendition's width and height. Only the first home testimonial has one (750 × 824).
3. **K-6 mosaic photo tiles: optional phone crop.** Each photo tile in the "art of teaching" mosaic gets an optional image (`image_m`, 750 × 600). Template edit 7.
4. **Home `cta_links`: rows become dropdowns.** The home block's rows were links (label + page). They are now the same as the enrolment and policies dropdown blocks: a title, rows of `label` (text) + `body` (rich text), and an optional button (`text` + `url`). If Wagtail already has a dropdown variant for enrolment and policies, use it on the home page and retire the link-row variant. One template now serves all three (template edit 2).
5. **Contact map.** The map image block becomes an embed: an `embed_url` field (URL) for Google Maps' "Share > Embed a map" link, or hard-code the URL in edit 12.
6. **Extra Curricular: swap `media_intro` for `feature_banner`.** Remove the "Learning music" `media_intro` block from the page and add a `feature_banner` in the same place (content in edit 13). The `media_intro` template and styles can go.
7. **Preparatory: swap the first `image_banner` for an `image_carousel`.** The banner straight after "Our teaching approach" becomes the photo carousel K-6 already uses, with eight slides (section 5). The second banner stays an `image_banner`.

## 4. Template edits

Thirteen edits. Each lists the static file, a string to search for in the Wagtail templates, and the exact change.

### Edit 1. Home approach tabs

Static file: `src/sections/teaching-approach.html`
Find in Wagtail: `data-hotspots` or `hotspot__marker`

- Remove `hotspot--flip` from every hotspot. All cards open to the right of their marker now. `ui.js` moves a card left or up only when it would leave the photo or cover the title. If the block has a "flip" field, leave it off everywhere.
- The marker positions and copy change (section 5). In Wagtail the positions are inline `--x` / `--y` custom properties on each `li.hotspot`, which take precedence over the static build's per-tab classes, so only the values change.
- The static markup also gives each pane a class, `approach__pane--teaching`, `--future`, `--wellbeing` or `--community`. It is only needed where positions come from classes rather than inline values; adding it is harmless.
- The first tab's photo is now `approach-teaching.webp` (1840 × 768) with `approach-teaching-m.webp` (750 × 552) as its phone source. The other three photos are 1840 × 768. Update the `width` and `height` attributes.

### Edit 2. The shared dropdown band (`cta_links`)

Static file: `src/sections/cta-links.html`, used by `index.html`, `enrolment.html` and `policies.html`
Find in Wagtail: `cta-links__aside`

Enrolment and policies already output this markup; only the home block changes. It must render as follows, with `modifier` empty on home, `cta-links--roomy` on policies and `cta-links--roomy cta-links--with-actions` on enrolment:

```html
<section class="cta-links {modifier}" aria-labelledby="{id}">
  <div class="container">
    <div class="row g-4 row-split">
      <div class="col-lg-6">
        <h2 id="{id}" data-anim="split" data-anim-type="chars-soft" data-anim-type-mobile="lines">{title}</h2>
      </div>
      <div class="col-lg-6">
        <div class="cta-links__aside">
        <ul class="fold" data-fold>
          <!-- for each item -->
          <li class="fold__item" data-anim="reveal" data-anim-type="fade">
            <button class="fold__row" type="button" aria-expanded="false" aria-controls="{item id}">{label}<svg class="icon" aria-hidden="true"><use href="#icon-arrow-diagonal"></use></svg></button>
            <div class="fold__panel" id="{item id}">
              <div class="fold__body">{body rich text}</div>
            </div>
          </li>
        </ul>
        <!-- only when the block has a button -->
        <div class="cta-links__actions" data-anim="reveal" data-anim-type="fade-up">
          <a class="btn btn-primary" href="{url}">{text}</a>
        </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

The home rows are Preparatory Program, K-6 Primary and Book a tour. Each `aria-controls` / `id` pair must be unique on the page.

### Edit 3. `feature_banner`: photo layer and entrance

Static file: `src/sections/feature-banner.html`
Find in Wagtail: `feature-banner__layer`

Two attribute changes; the rest of the block is unchanged.

Before:

```html
<div class="feature-banner__layer" data-anim="parallax" data-anim-centered data-anim-speed="18.75" data-anim-scrub-mobile="0.3">
  ...
  <img ... data-anim="reveal" data-anim-type="scale">
```

After:

```html
<div class="feature-banner__layer" data-anim="parallax" data-anim-centered data-anim-speed="18.75" data-anim-disable-mobile>
  ...
  <img ... data-anim="reveal" data-anim-type="fade">
```

### Edit 4. `image_banner`: optional phone square and entrance

Static file: `src/sections/image-banner.html`
Find in Wagtail: `feature-banner--media-only`

Without a phone photo the banner stays as it was, except that `data-anim-type="scale"` becomes `data-anim-type="fade"`. With one, it gets the class `feature-banner--square-m` and a `<picture>`:

```html
<figure class="feature-banner feature-banner--media-only feature-banner--square-m" data-anim-parallax-trigger>
  <div class="feature-banner__media">
    <div class="feature-banner__layer" data-anim="parallax" data-anim-centered data-anim-speed="18.75" data-anim-disable-mobile>
      <picture>
        <source media="(min-width: 576px)" srcset="{image}" width="{width}" height="{height}">
        <img src="{image_m}" alt="{alt}" width="750" height="750" loading="lazy" decoding="async" data-anim="reveal" data-anim-type="fade">
      </picture>
    </div>
  </div>
</figure>
```

Without a phone photo:

```html
<figure class="feature-banner feature-banner--media-only" data-anim-parallax-trigger>
  <div class="feature-banner__media">
    <div class="feature-banner__layer" data-anim="parallax" data-anim-centered data-anim-speed="18.75" data-anim-scrub-mobile="0.3">
      <img src="{image}" alt="{alt}" width="{width}" height="{height}" loading="lazy" decoding="async" data-anim="reveal" data-anim-type="fade">
    </div>
  </div>
</figure>
```

### Edit 5. `image_carousel`: nothing to change

Static file: `src/sections/image-carousel.html` (now one shared partial for K-6 and Preparatory)
Find in Wagtail: `data-image-carousel`

The markup is unchanged. One note: the slides after the first no longer need `aria-hidden="true"` in the template, because `carousel.js` now sets it when the page loads. Leaving it in is harmless. Section 5 lists Preparatory's eight slides.

### Edit 6. `quote_slider`: optional phone photo per slide

Static file: `src/sections/quote-slider.html`
Find in Wagtail: `deck__shot`

Inside each slide's `<span class="deck__shot">` (in both branches, with and without a link), output a `<picture>` when the slide has a phone photo, else the plain `<img>` as before:

```html
<span class="deck__shot">
  <picture>
    <source media="(min-width: 768px)" srcset="{image}" width="{width}" height="{height}">
    <img src="{image_m}" alt="{alt}" width="{width_m}" height="{height_m}" loading="lazy" decoding="async">
  </picture>
</span>
```

The breakpoint is 768 here, not 576: the phone layout of this block ends at md.

### Edit 7. K-6 mosaic: the phone deck

Static file: `src/sections/k-6-primary/art-of-teaching.html`
Find in Wagtail: `mosaic__slider`

1. Add `data-slider-deck` to the slider: `<div class="mosaic__slider swiper" data-slider-per-view="1" data-slider-per-view-md="2" data-slider-deck>`.
2. Each photo cell gets the class `deck__frame`, and its image is wrapped in `<span class="deck__shot">` with a `<picture>` that serves the phone crop below 992:

```html
<div class="mosaic__cell mosaic__cell--media deck__frame">
  <span class="deck__shot"><picture><source media="(min-width: 992px)" srcset="{image}" width="{width}" height="{height}"><img src="{image_m}" alt="{alt}" width="750" height="600" loading="lazy" decoding="async"></picture></span>
</div>
```

The wide photo (`mosaic__cell--wide`) keeps that class too.
3. Each card (`mosaic__card`) gets the class `deck__copy`.

### Edit 8. Preparatory "Our teaching approach" columns

Static file: `src/sections/preparatory-program/teaching-approach.html`
Find in Wagtail: `prep-approach-title`

- On the `<section>`, the class `link-columns--reveal` becomes `link-columns--reveal-xl`. This applies to the Preparatory block only: K-6's teaching teams keep `link-columns--reveal`.
- On the list (`link-columns__grid fold fold--hover`), add `data-fold-from="1200"`.
- In the Wellbeing copy, the registered mark is a superscript: `Kimochis<sup>®</sup>`. If the rich-text editor cannot make a superscript, enable Wagtail's `superscript` feature on that field.

### Edit 9. Policies report banner: the white wash

Static file: `src/policies.html`
Find in Wagtail: `School Annual Report`

Add `feature-banner--wash` to the banner's modifier classes, so they read `feature-banner--y237 feature-banner--stacked feature-banner--stacked-cta feature-banner--wash`.

### Edit 10. News listing: the arrow loads more in place

Static file: `src/sections/news/article-grid.html`
Find in Wagtail: `article-grid__pager`

The pager links to the next listing page (`?page=N` in Wagtail) and carries `data-load-more`. It is left out entirely on the last page.

Before:

```html
<nav class="article-grid__pager" aria-label="News pages" data-anim="reveal" data-anim-type="fade">
  <a class="arrow-btn arrow-btn--next" href="news.html?page=2" aria-label="Next page"><svg class="icon"><use href="#icon-arrow-right"></use></svg></a>
</nav>
```

After, only when there is a next page:

```html
<nav class="article-grid__pager" aria-label="More news" data-anim="reveal" data-anim-type="fade">
  <a class="arrow-btn arrow-btn--next" href="{next page url}" aria-label="Load more news" data-load-more><svg class="icon"><use href="#icon-arrow-right"></use></svg></a>
</nav>
```

`news.js` fetches that URL and takes the cards from `.article-grid__grid > li`, then points the arrow at the next `[data-load-more]` it finds, or removes the pager when there is none. So every listing page must render the same grid and pager markup. Without the script, the link still opens the page.

If Wagtail builds the site-search index from rendered pages, leave out listing pages after the first. The static build marks them with `data-search-skip` on `<main>`. With Wagtail's own search this does not apply.

### Edit 11. News article: entrance order

Static file: `src/sections/news/article-body.html`
Find in Wagtail: `article__media`

- The photo's `<figure class="article__media" data-anim="reveal" data-anim-type="fade">` gets `data-anim-order="2"`.
- The body `<div class="article__body rich-text" data-anim="reveal">` becomes `<div class="article__body rich-text" data-anim-group="fade-up">`, so each paragraph reveals on its own.

### Edit 12. Contact map: the live embed

Static file: `src/contact-us.html`
Find in Wagtail: `map-banner`

Before:

```html
<a class="map-banner" href="https://www.google.com/maps/search/?api=1&query=30+Coogee+Bay+Rd+Randwick+NSW+2031" target="_blank" rel="noopener" aria-label="Open 30 Coogee Bay Rd, Randwick in Google Maps">
  <img src="assets/images/contact/map.webp" alt="Map showing Claremont College at 30 Coogee Bay Rd, Randwick" width="2460" height="650" loading="lazy" decoding="async">
</a>
```

After:

```html
<div class="map-banner">
  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d25232!2d151.2445794!3d-33.918254!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12b2180f7b0cf1%3A0x7ddd745ce26630de!2s30%20Coogee%20Bay%20Rd%2C%20Randwick%20NSW%202031!5e0!3m2!1sen!2sau!4v1760000000000!5m2!1sen!2sau" title="Map showing Claremont College at 30 Coogee Bay Rd, Randwick" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
</div>
```

Use this exact URL. Its `!1d25232` (the view distance in metres) shows the same area as the design's map, between Google's zoom levels 13 and 14. A URL from the plain `?q=…&z=13` form shows a different area, and scaling the iframe with CSS blurs it. No API key is needed. The CSS turns the map grey.

### Edit 13. Extra Curricular: the music banner

Static file: `src/extra-curricular.html`
Find in Wagtail: `music-title` (the old `media_intro` section)

Replace the `media_intro` section with a `feature_banner` block rendered with these values:

| Field | Value |
| --- | --- |
| align | `left` |
| shade | off |
| id | `music-title` |
| modifier | `feature-banner--y209 feature-banner--stacked` |
| title | `Learning <em>music</em>` (the italic word is part of the design) |
| text | the same paragraph as before, starting "Learning to love music (not only as a listener, but as a practitioner)…" |
| image | `extra-curricular/banner-music.webp`, 1840 × 1102 |
| phone image | `extra-curricular/banner-music-m.webp` |
| actions | none |

## 5. Content to enter in the Wagtail admin

### Home "Our approach" tabs

Photos and alt text:

| Tab | Photo | Alt text |
| --- | --- | --- |
| Our teaching approach | `approach-teaching.webp` (phone: `approach-teaching-m.webp`) | Students at work around tables in a bright classroom with green walls, a teacher among them |
| Future-ready children | `approach-future.webp` | A student wearing a VR headset in the blue-lit technology room while a classmate tries another |
| Wellbeing is priority | `approach-wellbeing.webp` | A teacher and a young student posting a letter at the green door of the counsellor’s office |
| Community minded | `approach-community.webp` | Two students in hats and backpacks looking back over their shoulders on the way into school |

Hotspots: x and y are percentages of the photo. The first hotspot on each tab is the one open at rest. The first tab keeps its six titles and copy, and only the positions change. Tabs 2 to 4 now have three hotspots each, with the real copy; their placeholder hotspots go.

| Tab | # | x | y | Title | Copy |
| --- | --- | --- | --- | --- | --- |
| Our teaching approach | 1 | 12.29% | 46.71% | Research informed practices | (unchanged) |
| | 2 | 32.77% | 29.17% | Teacher collaboration, learning acceleration | (unchanged) |
| | 3 | 58.99% | 22.15% | Learning by ability, not grade | (unchanged) |
| | 4 | 60.58% | 42.62% | Specialised teachers, specialised learning | (unchanged) |
| | 5 | 44.30% | 66.30% | More teachers, fewer children | (unchanged) |
| | 6 | 73.69% | 67.47% | Recognising and rewarding academic excellence | (unchanged) |
| Future-ready children | 1 | 12.29% | 37.79% | School readiness program | Our 4 to 5 year old school readiness program, Wylie Cottage, offers a purposeful, research-informed, and play-based program inspired by Reggio Emilia practices. With early access to Library, Sport and Music, children build confidence, curiosity and a lifelong love of learning. |
| | 2 | 44.79% | 28.87% | Stepping up to high school | Our High School Study Program gives children and parents the reassurance of a seamless transition to high school. We instil in children a set of dispositions including collaboration, compassion and innovative thinking to prepare them for their next step. |
| | 3 | 67.71% | 51.83% | Every child leaves ready for the future | We are committed to developing knowledgeable, confident and critical thinkers, equipped with the future-ready skills and dispositions they will need to thrive throughout their lives. |
| Wellbeing is priority | 1 | 20.40% | 61.18% | Protecting health and happiness | Physical, mental and emotional well-being is prioritised daily with a registered nurse and school counsellor on school grounds all week. |
| | 2 | 58.51% | 25.37% | Social and emotional learning | Our Open Parachute program ensures children’s wellbeing, resilience and interpersonal skills are nurtured. Additionally, our PBIS (Positive Behaviour Interventions and Supports) framework reinforces positive behaviours to help children develop into successful members of the community. |
| | 3 | 69.85% | 69.52% | Children with voice and choice | Every child has a voice in shaping their learning experience, from learning spaces to playgrounds. This helps build confidence and a sense of agency in all our students. |
| Community minded | 1 | 14.30% | 53.87% | “Our and we”, not “us and you” | We foster a collective and collaborative environment for children, teachers, parents and our community. We’re in this together. |
| | 2 | 38.75% | 38.82% | Fulfilment is contagious | Our teachers love to teach and see it as a privilege. This infectious enthusiasm for teaching breeds enthusiasm for learning. |
| | 3 | 72.59% | 57.53% | Christian values | Our faith is a key foundation of our approach to education. We inspire learning, nurture connection and shape the lives of children by grounding these in ethical and relational experiences based on Christian values. |

### Other content

- **Home testimonials.** Slide 1 gets its phone photo, `testimonial-1-m.webp`. Slides 6 (the Year 6 Maths quote) and 7 (the reading quote) lose their opening and closing quote marks; the other five keep theirs.
- **Home "Where would you like to start?"** The three dropdowns are Preparatory Program, K-6 Primary and Book a tour. Figma has no copy for them, so the static build carries placeholder text until the client supplies it. The rows no longer link to their pages.
- **Preparatory photo carousel.** Label: "Life in the Preparatory Program at Claremont". Slides, in this order, each with its phone square (`carousel-N-m.webp`):
  1. `carousel-1.webp`: A Preparatory teacher leading a music session with coloured boomwhackers
  2. `carousel-2.webp`: A teacher reading a picture book with a Preparatory boy beside the classroom shelves
  3. `carousel-3.webp`: A Preparatory student arranging leaves and toy animals on a nature table
  4. `carousel-4.webp`: A Preparatory classroom with soft seats, a round wooden table and stools
  5. `carousel-5.webp`: A Preparatory student blowing bubbles
  6. `carousel-6.webp`: A Preparatory classroom with low wooden shelves, a round rug and a reading corner
  7. `carousel-7.webp`: A Preparatory student smiling down at a wooden toy in her hands
  8. `carousel-8.webp`: A Preparatory student holding a leaf out towards the camera
- **Preparatory second banner.** Phone photo `banner-2-m.webp`.
- **K-6 mosaic.** Phone crops `mosaic-1-m.webp` to `mosaic-5-m.webp` on the five photo tiles, in order.
- **Policies report banner.** The new `banner.webp`.
- **Contact map.** The embed URL from edit 12, if it became a field.

## 6. Script changes in detail

Only needed for Option B, or if the Wagtail copy of a script was modified. The `.patch` file has every hunk with full context.

| File | What changed | Update |
| --- | --- | --- |
| `anim.js` | **Scroll steps:** a step's scroll range is measured from its start as clamped by the top of the page (`end: "max"`, with the reach worked out in `onUpdate`), so one already on screen at load follows the scroll instead of waiting for the entrance. A step waiting for the entrance keeps its trigger while it plays, and the scroll can still hurry it along. **Entrance:** new `hurryOnScroll`: the reader's first scroll during the entrance starts every step still to come at once, in order, 0.1s apart. **Titles:** phone titles are split by word and letter with their lines held, then rise line by line as words (no SplitText lines). `titleHold` gives copy on screen with its title the title's whole run | 16, 18, 23 |
| `carousel.js` | `show(current)` runs once at start, so the hidden slides get `aria-hidden` from the script | 13 |
| `main.js` | Imports `initLoadMore` from `news.js` and calls it after `initImageCarousels()` | 15 |
| `news.js` | New. `initLoadMore()` on `[data-load-more]` (edit 10) | 15 |
| `search.js` | The page label in each result goes through `highlight()` instead of `escapeHtml()` | 5 |
| `ui.js` | `placeHotspot`: a card opens to the right of its disc and only moves when it would leave the photo or cover the title; covering another disc no longer moves it. `initFolds` reads `data-fold-from` (default 992) for the width the hover behaviour starts at; on a touch screen at that width a tap opens a column and the last one tapped stays open | 1, 12 |

`build.mjs` (the static build's search index) skips any page whose `<main>` has `data-search-skip`. It only matters if Wagtail reuses that build step.

## 7. Style changes per file

Only needed for Option B. Copy the whole file unless the Wagtail copy has local edits.

| File (under `src/assets/styles/`) | What changed | Update |
| --- | --- | --- |
| `main.less` | `_media-intro.less` import removed | 4 |
| `01-settings/_tokens.less` | `--quote-card-m` and `--quote-panel-m` removed; the quote slider now has its own `--qs-*` properties | 11 |
| `02-tools/_mixins.less` | New mixins `.stack-buttons()` (a button row stacked full width, 30 apart) and `.visually-hidden()` | 2, 16 |
| `04-layout/_footer.less` | Phone button pair stacks; social row centred on phones | 2 |
| `04-layout/_header.less` | Logo 176 → 272 and links 14 → 16 between 992 and 1200 | 7 |
| `05-components/_approach.less` | Tab bar gaps and tab padding scale down to fit 992; cards sit 20 past their disc; marker positions per tab (`.approach__pane--*`); the phone row arrow turns on `--ease-settle` | 1, 22 |
| `05-components/_article-grid.less` | Card hover zoom 1.03 on mouse only, the same on keyboard focus | 15 |
| `05-components/_article.less` | Phone block (60 of padding, 35 title, every gap 30, Previous / Next on one row with only those words); Back to news full width on phones | 2, 16 |
| `05-components/_contact.less` | Map box holds an `iframe`, a 375 square on phones and 1640 × 433 from md, greyscale; Submit stacks on phones | 2, 20 |
| `05-components/_cta-links.less` | Dropdown hover fill and colour on the green bands; fill bleed on the roomy rows; button row stacks on phones | 2, 21, 22 |
| `05-components/_cta-row.less` | Button row stacks on phones | 2 |
| `05-components/_feature-banner.less` | New modifiers `--y209`, `--wash` (white wash and Dark Green copy from lg) and `--square-m` (a phone square that holds still); stacked banners' layer holds still below lg; buttons stack on phones | 2, 3, 4, 8, 10 |
| `05-components/_fold.less` | New `--fold-fill-bleed-end`; a dropdown row's arrow turns over `--duration-fold` on `--ease-settle`; the rule that showed every panel on touch screens is gone | 12, 22 |
| `05-components/_hero.less` | Title letter-spacing, kerning and indent; subtitle minimum size; copy tracking; the button stacks on phones | 2, 6 |
| `05-components/_intro-split.less` | Intro buttons stack on phones | 2 |
| `05-components/_link-columns.less` | The column reveal is a mixin, `.reveal-columns(@from)`: `--reveal` at 992 (K-6), new `--reveal-xl` at 1200 (Preparatory); the ® superscript; Preparatory's measures | 12 |
| `05-components/_link-grid.less` | Policies phone block; arrow turn on `--ease-settle` | 17, 22 |
| `05-components/_mosaic.less` | Hover zoom removed; phone deck (one Light Blue row under every card's copy) | 14, 24 |
| `05-components/_quote-slider.less` | Per-layout `--qs-*` measures for the hover box and the phone card; photos anchored to the top on short screens; the educator arrow's colour waits for the box | 11 |
| `05-components/_scroller.less` | Activity card seam: one 1-wide white line at the card's right edge | 19 |
| `06-animation/_animation.less` | `.anim-line` rules removed (titles no longer use SplitText lines) | 18 |
| `05-components/_media-intro.less` | Deleted | 4 |

## 8. Things that break if missed

- **Images and markup together.** The home approach, mosaic, quote slider, carousel and banner templates now point at new files. Upload the images (section 2) before deploying the templates, or those slots render empty.
- **`hotspot--flip`.** The class still exists in the CSS and still opens a card to the left. Leave it on a hotspot and that card opens the wrong way.
- **The dropdown band.** The home rows must be `<button class="fold__row" aria-expanded="false" aria-controls="…">` over a `.fold__panel` with a matching `id`, inside `ul.fold[data-fold]`. Link rows (`<a class="fold__row">`) do not open, and their arrow nudges on hover instead of turning down.
- **`data-fold-from="1200"`** belongs on the Preparatory columns only. On K-6's teaching teams it would keep them stacked up to 1200.
- **`link-columns--reveal-xl`** is Preparatory's class; K-6 keeps `link-columns--reveal`.
- **`data-load-more`** must be on the listing's next-page link, and the last listing page must render no pager; otherwise the arrow keeps loading the same cards.
- **The map URL.** Use the URL in edit 12 as given. The `?q=…&z=13` form shows another area, and a CSS scale makes it blurry.
- **CSS and JS ship together.** The new `ui.js` reads `data-fold-from` and the new `_fold.less` dropped the touch-screen rule; deploying only one changes how the Preparatory columns open on tablets.
- **`media_intro`.** Its styles are gone from `main.css`. Any page still rendering that block shows it unstyled.

## 9. Checks after porting

Desktop checks at 1640 wide unless stated; phone checks at 375.

- [ ] **Home approach tabs:** each tab shows its new photo. Tab 1 has six markers and tabs 2 to 4 have three each, placed as in the table, with the real copy. Every card opens to the right of its marker. At 992 wide the four tabs and both arrows fit on one line.
- [ ] **Home "Where would you like to start?":** the three rows open and shut on click, one at a time. On hover a row fills Light Blue, its title and arrow turn Dark Green, and the arrow turns down smoothly, with no snap. Enrolment and policies dropdowns hover the same way.
- [ ] **Phone buttons:** on a phone every button row is full width, one under the other. The footer's social icons are centred.
- [ ] **Policies:** the report banner shows the new photo with a white wash behind Dark Green copy on desktop; on a phone the panel stays green. The policies list on a phone matches its 375 frame.
- [ ] **Extra Curricular:** "Learning music" is a full-width photo banner like K-6's, with "music" in italics.
- [ ] **Preparatory:** the band after "Our teaching approach" is a photo carousel with eight slides and arrows. "Kimochis®" shows a small raised ®. On an iPad in portrait (1024) the columns are a stacked accordion; from 1200 they are four columns. The second banner shows its own square on a phone.
- [ ] **K-6 mosaic on a phone:** one card at a time; the next photo rises over the last and the copy fades between them. No photo zooms on hover on desktop.
- [ ] **Banners:** photos fade in, without zooming. On a phone the stacked banners (home faith, K-6 sport and music) show the phone square and do not drift as you scroll.
- [ ] **Testimonials:** on a phone the first card shows its own photo. The Maths and Reading quotes have no quote marks.
- [ ] **News listing:** the arrow under the cards adds the next page's cards below with the usual fade-up, and disappears on the last page. Card photos zoom very slightly on hover.
- [ ] **News article:** the title comes first, then Back to news, then the photo, then the paragraphs one by one. Scrolling down quickly right after the page loads, nothing near the top is left blank while the paragraphs below appear.
- [ ] **Home on a phone:** swiping down during the page entrance, "Where progress is personal." appears before the paragraphs under it.
- [ ] **Search:** searching a word that is in a page's name highlights it in the result's page label.
- [ ] **Contact map:** a live, grey Google map showing Randwick and the coast, sharp, in the same box as before.
- [ ] **Laptop header (1024 to 1199):** the logo, nav links and tools fit on one line.
