# Claremont: sharper hero photos, to port into the Wagtail build

Date: 2026-10-28
Source of truth: the static cutup repo, `static/claremont`
Baseline: commit `1ef9910`, which already holds everything in `wagtail-updates-2026-10-28.md`. This is a second, separate update for the same day.
Companion file: `wagtail-updates-2026-10-28-hero-photos.patch` (same folder) is the `git diff` of the static templates for this update, 11 files, all text. The photos themselves are in `wagtail-uploads/heroes/`.

## Purpose

The client says the hero photos look slightly blurred. They were served at one size, 1840px wide, and on a Retina laptop, a 2560 monitor or a 3× phone the browser stretched them 1.4 to 2.5 times. Each hero now comes in a second, larger size and the browser picks the one the screen needs: 1× screens keep the same light file as before, and dense or wide screens get the sharp one.

No CSS, no JS, no block fields and no copy change. It is new photos plus one attribute on two templates.

## Instructions for the agent doing the port

1. Treat the static repo as the reference. Replicate these changes; do not redesign or "improve" them.
2. The snippets below are the static HTML. In Wagtail the same markup lives in Django templates. Keep whatever template tags are already there; only add the parts called out.
3. Find the Wagtail counterpart of each static file by searching for the anchor string given with each edit. Do not assume file names match.
4. If something in the Wagtail project does not match what this file describes, stop and report it rather than guessing.

## 1. Photos to upload

All in `wagtail-uploads/heroes/`, WebP. Each replaces the image the page's hero uses now (same photo, same crop, only larger). `<page>.webp` is the desktop photo, `<page>-m.webp` is the phone crop.

| Page | Desktop photo | Phone crop |
| --- | --- | --- |
| Home | `home.webp` 3280 × 2524 | `home-m.webp` 1125 × 1542 |
| Welcome | `welcome.webp` 3280 × 1943 | `welcome-m.webp` 1125 × 1125 |
| Preparatory Program | `preparatory-program.webp` 3280 × 1943 | `preparatory-program-m.webp` 1125 × 1125 |
| K-6 Primary | `k-6-primary.webp` 3280 × 1943 | `k-6-primary-m.webp` 1125 × 1125 |
| Extra Curricular | `extra-curricular.webp` 3280 × 1943 | `extra-curricular-m.webp` 1125 × 1125 |
| Enrolment | `enrolment.webp` 3280 × 1943 | `enrolment-m.webp` 1125 × 1125 |
| News (the listing, every page of it) | `news.webp` 3280 × 1943 | `news-m.webp` 1125 × 1125 |
| Policies | `policies.webp` 3280 × 1943 | `policies-m.webp` 1125 × 1125 |
| Contact us | `contact-us.webp` 3280 × 1943 | `contact-us-m.webp` 1125 × 1125 |

Upload them over the current images (or upload and re-select them on each page), so every hero uses the large file as its source. Wagtail then cuts the smaller sizes from it (section 2).

## 2. Template edits

### Edit 1. Inner-page hero

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

In Django terms (use the project's own field names):

```html
{% image page.hero_image width-1840 as hero_1x %}
{% image page.hero_image width-3280 as hero_2x %}
{% image page.hero_image_m width-750 as hero_m %}
{% image page.hero_image_m width-1125 as hero_m_3x %}
<source media="(min-width: 576px)" srcset="{{ hero_1x.url }} 1840w, {{ hero_2x.url }} 3280w" sizes="100vw" width="{{ hero_1x.width }}" height="{{ hero_1x.height }}">
<img class="page-hero__img" fetchpriority="high" decoding="async" src="{{ hero_m.url }}" srcset="{{ hero_m.url }} 750w, {{ hero_m_3x.url }} 1125w" sizes="100vw" alt="" width="{{ hero_m.width }}" height="{{ hero_m.height }}" ...>
```

### Edit 2. Home hero

Static file: `src/sections/home-hero.html`
Find in Wagtail: `hero__img`

The same change with the home photo's sizes: the desktop `srcset` is `1842w` and `3280w`, the phone `srcset` is `750w` and `1125w`, both with `sizes="100vw"`; the `width` / `height` attributes stay 1842 × 1417 and 750 × 1028. In Django terms, `width-1842` and `width-3280` on the desktop photo, `width-750` and `width-1125` on the phone crop.

## 3. Things that break if missed

- **The `w` numbers must be the files' real widths.** The browser picks a file from them. If the template writes `3280w` but the rendition comes out smaller (the uploaded source was the old 1840 file), the photo is just as soft as before. Check the uploads went in first.
- **Rendition quality.** Wagtail re-encodes every rendition. The project's WebP quality (`WAGTAILIMAGES_WEBP_QUALITY`) should be 80 or higher; lower softens the photos again.
- **Keep `sizes="100vw"`.** Without `sizes` on a `w` list the browser still assumes 100vw, but writing it keeps the intent clear and stops a later edit giving it a smaller value, which would send the small file to large screens.
- **If the Wagtail templates serve the original upload** (`{{ image.file.url }}`) rather than renditions, stop and report it: the 3280 file would then go to every screen, phones included.

## 4. Checks after porting

- [ ] **DevTools → Network → Img, 1366 × 768 at 100%:** an inner page's hero loads the 1840 rendition.
- [ ] **A Retina Mac, or DevTools' device toolbar at DPR 2, 1440 wide:** the hero loads the 3280 rendition, and the photo is as crisp as the static build on GitHub Pages.
- [ ] **Phone at DPR 3 (iPhone in the device toolbar):** the hero loads the 1125 phone crop.
- [ ] **All nine pages:** the hero shows the same photo and crop as before, only sharper.
