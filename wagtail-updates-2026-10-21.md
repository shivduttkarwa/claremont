# Claremont: front-end updates to port into the Wagtail build

Date: 2026-10-21
Source of truth: the static cutup repo, `static/claremont`
Baseline: commit `2dbafee`, the last commit covered by `wagtail-updates-2026-10-16.md`. Everything below is the difference between that commit and commit `d66f014`.
Companion file: `wagtail-updates-2026-10-21.patch` (same folder) is the full `git diff` of `src/` for these updates, 38 files. The two image files in it show only as "Binary files differ": take them from the repo itself (section 2). `build.mjs` did not change.

## Purpose

The 2026-10-16 updates are already in the Wagtail build. Since then the agency's review comments (the 30 comments on their October deck, which were hidden from us until this week) were worked through, the site was audited at 18 screen sizes, and the client's Design 2 copy for the Welcome page and the Languages card came in. This file tells you exactly what to change in the Wagtail project so it matches the static repo again.

This one is mostly CSS and JS, plus:

- two replaced photos (section 2);
- one new script and one new icon for the contact form (section 4, edits 3 and 4);
- template edits to the header, footer, search panel, home hero, contact form and pillars (section 4);
- content to enter in the Wagtail admin: the executives' roles and bios, the educators' roles and quotes, the Languages card and the order of the core values (section 5).

## Instructions for the agent doing the port

1. Treat the static repo as the reference. Replicate these changes; do not redesign or "improve" them. Every value was measured against Figma or settled with the client by eye on the exact screen size they named.
2. The snippets below are the static HTML. In Wagtail the same markup lives in Django templates. Keep whatever template tags are already there (`{% static %}`, `{% image %}`, `{{ page.x }}`, block loops); only add, move or rename the parts called out.
3. Find the Wagtail counterpart of each static file by searching for the anchor string given with each edit. Do not assume file names match.
4. Do the work in this order: assets (section 1), images (section 2), block changes (section 3), templates (section 4), content (section 5), then the checks (section 9).
5. Deploy the CSS and the JS together. Several changes are split between the two (section 8).
6. If a Wagtail copy of a file has local changes, merge the change shown here into it. Do not overwrite the file.
7. Two files in the static repo are test pages, not part of the site: `src/quote-length-test.html` and `src/quote-scroll-lab.html`. Ignore them. They are left out of the `.patch`.
8. If something in the Wagtail project does not match what this file describes, stop and report it rather than guessing.

## The updates

| # | Update | Wagtail work |
| --- | --- | --- |
| 1 | **Wide screens: 1640 is the maximum scale.** Above 1640 the copy, nav, buttons and logo stay at their 1640 size and the 1240 content column centres (the root font size no longer grows with the screen). Full-width photos and colour bands keep filling the screen at their 1640 proportions, and the header, footer and the rows of text columns keep the 1640 frame, centred. The home testimonial and educator rows grow their cards just enough that the loop covers very wide screens; the activity cards share the spare width | CSS, JS |
| 2 | **Small laptops, 992 to 1199** (the agency checked 992 × 600): the laptop size (0.875 of the design) now starts at 992 instead of 1200. The header there takes the 1200 bar's measures (logo 238, links 14) with only the gap between the links closing at 992 so the bar fits, and the home hero title is a tenth smaller. Nothing changes from 1200 up | CSS, template edit 1 |
| 3 | **Home hero photo** is the Design 2 photo (the girl and boy in blazers), desktop and phone | Images, template edit 2 |
| 4 | **Letter-spacing**: the home hero copy is Figma's -3% at every width (it was +1% on phones), the policy titles are -3% (they inherited the body's smaller value), and every 15px copy block on phones now declares -3% at its own size | CSS only |
| 5 | **Search results**: no Light Blue. The result count is soft white, the page labels white, a hovered result Yellow; matches stay Yellow | CSS only |
| 6 | **Phone pillars** ("What matters to us"): the Light Blue rule under the arrows, from the 375 frame | CSS only |
| 7 | **Preparatory "Our teaching approach" and K-6 teaching-team columns**: the copy under the titles is Near Black, as every Figma frame draws it | CSS only |
| 8 | **Contact form validation** is drawn by the page: the browser's own bubble is replaced by a Dark Green tip with the Yellow warning sign under the first empty or malformed field, which also gets the focus. It goes as the field is typed in, on blur, on Escape or after six seconds. Also: the field rule no longer shows a pale pixel at its middle on odd widths | JS (new `form.js`), CSS, template edits 3 and 4, block note (section 3) |
| 9 | **News listing** between 576 and 767: the green strip behind the first cards stops at their photos' foot instead of running under the captions | CSS only |
| 10 | **Educator quotes** (Welcome): the client's real quotes run to 340 characters, so a quote longer than its box keeps Figma's 40px type and scrolls inside the box, with a fade at the edges. It glides to its end on its own once the card is open (hover on desktop, the active card on phones); a wheel, swipe or key takes over | CSS, JS, content |
| 11 | **Design 2 copy**: the six executives' roles and bios, the educators' names, roles and quotes, the Languages activity card, and the core values in the order Collaboration, Innovation, Compassion | Content (section 5), template edit 5 |

## 1. Assets: CSS and JS

Pick the option that matches how the Wagtail project gets its front-end assets.

**Option A: Wagtail serves the compiled files.** Copy the two built files over the ones Wagtail serves. Get them one of two ways:

- Build them: in the static repo run `npm ci` and then `npm run build`, and take `dist/assets/css/main.css` and `dist/assets/js/main.js`.
- Download them from the GitHub Pages deploy, which rebuilds on every push to `main`: `https://shivduttkarwa.github.io/claremont/assets/css/main.css` and `https://shivduttkarwa.github.io/claremont/assets/js/main.js`. Pages caches files for ten minutes, so if a download looks stale, retry after that.

That covers every style and script change in this document. Skip to section 2.

**Option B: Wagtail builds from the LESS and JS sources.** Copy these files from the static repo's `src/assets/` over the Wagtail copies, then rebuild. If a Wagtail copy has local edits, apply the matching hunk from the `.patch` file instead.

Styles (`src/assets/styles/`):

- `01-settings/_bootstrap-vars.less`, `01-settings/_tokens.less`
- `02-tools/_mixins.less`
- `03-base/_base.less`
- `04-layout/_header.less`
- every changed file in `05-components/`: `_article-grid`, `_contact`, `_cta-links`, `_feature-banner`, `_hero`, `_link-columns`, `_link-grid`, `_mosaic`, `_page-hero`, `_pillars`, `_quote-slider`, `_scroller`, `_search`, `_split-feature`, `_staff-grid`, `_timeline`

Scripts (`src/assets/scripts/`):

- `main.js`, `pan.js`, `ui.js`
- `form.js` (new file; `main.js` imports it)

Copy `_tokens.less` and `_mixins.less` first: `_feature-banner`, `_split-feature`, `_bootstrap-vars`, `_pillars` and `_link-columns` use the new `--du` property and `.design-frame()` mixin and will not compile, or will mis-size, without them (section 8).

## 2. Images

Both under `src/assets/images/home/`, WebP, same file names as before with a new picture. Replace them.

| File | Size | Why |
| --- | --- | --- |
| `home/hero.webp` | 1842 × 1417 (was 1842 × 1650) | The Design 2 home hero photo (girl and boy in blazers). The file has 80px of spare photo below the frame for the parallax, instead of the old 323 |
| `home/hero-m.webp` | 750 × 1028 (unchanged size) | Its phone crop, centred on the two children |

Nothing is added or deleted.

## 3. Block changes

1. **Contact form: field messages.** Each field now carries its own message for the validation tip: `data-error` (the message when the field is empty) and, on the email field, `data-error-format` (the message when a value is typed but malformed). Either hard-code the four messages in the template (edit 3) or add an optional "error message" text to each form field and output it there; the script falls back to "Please fill in this field." when the attribute is missing.
2. **Contact form: server-side errors.** The script only checks before submit. When Django returns the form with errors, render each error as the same tip markup straight after its field, with `is-shown` already on it, and `aria-invalid="true"` on the field, so it reads the same as the script's:

```html
<input class="form-control" id="contact-email" ... aria-invalid="true" aria-describedby="contact-email-tip">
<div class="form-tip is-shown" id="contact-email-tip" role="alert"><svg class="icon" aria-hidden="true"><use href="#icon-warning"></use></svg><span>{error text}</span></div>
```

3. **Nothing else changes shape.** The quote slider, staff grid and scroller blocks keep their fields; update 10 is CSS and JS, and update 11 is content.

## 4. Template edits

Five edits. Each lists the static file, a string to search for in the Wagtail templates, and the exact change.

### Edit 1. Logo `sizes` in the header, the search panel and the footer

Static files: `src/partials/header.html`, `src/partials/search.html`, `src/partials/footer.html`
Find in Wagtail: `logo-321.webp`

The logo no longer grows past 1640, so the `sizes` attribute on the three logo images loses its wide-screen entries. The `srcset` is unchanged.

Header and search panel, before:

```html
sizes="(min-width: 2560px) 482px, (min-width: 2200px) 422px, (min-width: 1920px) 361px, (min-width: 1400px) 321px, (min-width: 1200px) 238px, (min-width: 992px) calc(38.4615vw - 189.5px), 213px"
```

After:

```html
sizes="(min-width: 1400px) 321px, (min-width: 992px) 238px, 213px"
```

Footer, before:

```html
sizes="(min-width: 2560px) 561px, (min-width: 2200px) 491px, (min-width: 1920px) 421px, (min-width: 992px) 374px, 322px"
```

After:

```html
sizes="(min-width: 992px) 374px, 322px"
```

### Edit 2. Home hero photo

Static file: `src/sections/home-hero.html`
Find in Wagtail: `hero__img`

Two attribute changes, for the new photo's proportions and its shorter parallax travel:

Before:

```html
<source media="(min-width: 576px)" srcset="{hero.webp}" width="1842" height="1650">
<img class="hero__img" ... data-anim="parallax" data-anim-axis="y" data-anim-speed="12" data-anim-reverse data-anim-start="top top" data-anim-disable-mobile>
```

After:

```html
<source media="(min-width: 576px)" srcset="{hero.webp}" width="1842" height="1417">
<img class="hero__img" ... data-anim="parallax" data-anim-axis="y" data-anim-speed="6.34" data-anim-reverse data-anim-start="top top" data-anim-disable-mobile>
```

If Wagtail renders the `width` and `height` from the image, they come out right on their own once the new file is uploaded.

### Edit 3. Contact form markup

Static file: `src/sections/contact/details-form.html`
Find in Wagtail: `contact__form`

- The `<form>` gets `data-form-validate`. The script adds `novalidate` itself, so the browser bubble still works if the script fails to load.
- Every field wrapper gets the class `contact__field` (the two wide ones keep `contact__field--wide` as well). The tip is positioned from this wrapper.
- Each control gets its message:

```html
<form class="contact__form" action="#" method="post" data-form-validate>
  <div class="contact__field">
    <label class="form-label" for="contact-first-name">First Name</label>
    <input class="form-control" id="contact-first-name" name="first_name" type="text" placeholder="Jane" autocomplete="given-name" required data-error="Please enter your first name.">
  </div>
  <div class="contact__field">
    <label class="form-label" for="contact-last-name">Last Name</label>
    <input class="form-control" id="contact-last-name" name="last_name" type="text" placeholder="Doe" autocomplete="family-name" required data-error="Please enter your last name.">
  </div>
  <div class="contact__field contact__field--wide">
    <label class="form-label" for="contact-email">Email</label>
    <input class="form-control" id="contact-email" name="email" type="email" placeholder="jane.doe@gmail.com" autocomplete="email" required data-error="Please enter your email address." data-error-format="Please enter an email address like jane.doe@gmail.com">
  </div>
  <div class="contact__field contact__field--wide">
    <label class="form-label" for="contact-message">Message</label>
    <textarea class="form-control" id="contact-message" name="message" placeholder="Write your message" rows="4" required data-error="Please write your message."></textarea>
  </div>
  <div class="contact__actions">
    <button class="btn btn-primary" type="submit">Submit</button>
  </div>
</form>
```

Every control must have an `id`: the script names the tip `{id}-tip` and links it with `aria-describedby`.

### Edit 4. The warning icon

Static file: `src/partials/icons.html`
Find in Wagtail: `icon-close` (the last symbol in the sprite)

Add one symbol to the SVG sprite, after `icon-close`. The disc takes the icon's colour (Yellow in the tip); the mark is Dark Green through the site's `--color-primary` property, which reaches inside a `<use>`:

```html
<symbol id="icon-warning" viewBox="0 0 20 20">
  <circle cx="10" cy="10" r="10" fill="currentColor"/>
  <path d="M10 5.25v6" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round"/>
  <circle cx="10" cy="14.6" r="1.15" fill="var(--color-primary)"/>
</symbol>
```

### Edit 5. Core values order

Static file: `src/sections/pillars.html`
Find in Wagtail: `pillars__statement`

The third pillar's statement reads `Collaboration<br>Innovation<br>Compassion` (it was Innovation, Collaboration, Compassion). If the statement is a field, change its content instead (section 5).

## 5. Content to enter in the Wagtail admin

### Welcome: executives (`staff_grid`)

Roles and bios from Figma 1732:12487. The `|` in three roles is part of the text (escaped as `\|` in this table); "Stage Leader" is written with a non-breaking space in the static build so it never splits across lines.

| Name | Role | Bio |
| --- | --- | --- |
| Alana Koch | Principal | I teach because there is a deep joy in witnessing a child understand something for the first time, achieve what they never thought possible, and discover their potential to make a positive impact on the world. |
| Janelle Ford | Deputy Principal | With a deep passion for learning, I strive to ignite a sense of wonder in every child, empowering them to become capable, resilient learners who embrace knowledge and exploration throughout their lives. |
| Chloe Leary | Principal's Executive Assistant \| Registrar | I know choosing a school for your child is a big decision. I love being part of that journey with families and then having the privilege of watching their child grow in confidence and thrive. |
| Renee De Rossi | Director of Teaching & Learning | I lead because every child deserves to be seen and to thrive, whoever they are and however they experience the world. This conviction inspires everything I do. |
| Emily Eu | Director of Marketing & Events \| Stage Leader | Teaching is deeply rewarding because I have the privilege of watching children discover their strengths, embrace challenges, grow in confidence, and begin to believe in what they can achieve. |
| Hannah Davis | Director of Daily Operations & Pastoral Care \| Stage Leader | I believe every child deserves to feel safe, valued and known. Together with families, I nurture wellbeing, confidence and learning, helping every child feel they belong. |

### Welcome: educators (`quote_slider`, educators layout)

Names from the Design 2 hover cards; roles and quotes from the client's comments on those cards (Emily, 30 September to 11 October). Three educators have no quote yet. The quotes are long: update 10 makes them scroll in their box, so enter them in full.

| # | Name | Role | Quote |
| --- | --- | --- | --- |
| 1 | Katrina Calverley | Learning Enrichment Teacher | “Being a Learning Enrichment Teacher at Claremont College is a privilege. Our unique co-teaching partnerships foster a powerful culture of collective care, shared knowledge and purpose, ensuring every child is known, valued and inspired to be their best.” |
| 2 | Bianca Herborn | Classroom Teacher | “STEM and robotics at Claremont equip students with the skills and mindset to thrive in an ever-changing world. Through creativity, collaboration and problem-solving, students are encouraged to imagine what’s possible.” |
| 3 | Abby Carter | Classroom Teacher | “Starting Kindergarten at Claremont College is about building strong foundations for learning and belonging, where every child is known, valued and supported to grow with confidence and curiosity.” |
| 4 | Will Mison | Classroom Teacher | (no quote yet: keep Figma’s placeholder or leave empty) |
| 5 | Cath McKersie | School Counsellor | “At the heart of our approach to wellbeing is a compassionate and inclusive community where every child feels known, valued and supported. Through counselling and pastoral care, we work closely with students and families to build resilience, strengthen social and emotional skills, and help children navigate life’s challenges with confidence.” |
| 6 | Deborah Koh | Teacher Librarian | “What makes Claremont special is the way we nurture students in their learning, faith and character. Through Chapel and lunchtime clubs, students build friendships, explore new interests and develop a genuine sense of belonging within our community.” |
| 7 | Lisa Speranza | Teaching and Learning Assistant | (no quote yet: keep Figma’s placeholder or leave empty) |
| 8 | Louise McNerney | Learning Enrichment Teacher | (no quote yet: keep Figma’s placeholder or leave empty) |

### Extra Curricular: the Languages card

Replace the Languages card's placeholder copy with:

> Students in Kindergarten to Year 6 can choose to learn French or Mandarin through our weekly after-school language program. Lessons are designed to develop language skills through engaging, interactive and enjoyable learning experiences, with cultural learning incorporated where it supports and enriches language development.

### Home: core values

The third pillar's statement is Collaboration / Innovation / Compassion, one per line (edit 5).

### Home hero photo

Upload the new `home/hero.webp` and `home/hero-m.webp` over the old ones (section 2).

## 6. Script changes in detail

Only needed for Option B, or if the Wagtail copy of a script was modified. The `.patch` file has every hunk with full context.

| File | What changed | Update |
| --- | --- | --- |
| `form.js` | New. `initForms()` on `form[data-form-validate]`: sets `novalidate`; on submit finds the first control that fails `checkValidity()`, builds `div.form-tip` (role alert, the warning icon, the message from `data-error` or `data-error-format`) straight after it, marks the control `aria-invalid` with `aria-describedby`, focuses it, and shows the tip a frame later so its entrance transition runs. The tip is removed on input in that field, on blur, on Escape, or after 6s; one tip at a time | 8 |
| `main.js` | Imports `initForms` from `form.js` and calls it after `initLoadMore()` | 8 |
| `pan.js` | `measure()`: from lg the card width is at least the section's width divided by the number of cards less one, so a screen wider than the loop never sees its end; the width is still snapped to device pixels and written to `--pan-card` | 1 |
| `ui.js` | `initQuoteCards` first runs the new `initQuoteScroll` on every `[data-quote-cards]` group, before the hover-only return. `initQuoteScroll`: for each card whose `.quote-slider__quote` is scrollable (`overflow-y` not visible), it marks the quote `is-scrolled` / `is-end` as it scrolls, gives it `tabindex="0"` and `data-lenis-prevent` only when the text is longer than the box, and once the card is open (`is-open` from lg, `is-active` on phones) and the block is 40% in view, waits 1.4s then glides the quote to its end at 24px/s; a wheel, touch, pointer or key stops the glide for that card; when the card closes the quote scrolls back to the top after 0.7s. Reduced motion never glides | 10 |

## 7. Style changes per file

Only needed for Option B. Copy the whole file unless the Wagtail copy has local edits.

| File (under `src/assets/styles/`) | What changed | Update |
| --- | --- | --- |
| `01-settings/_tokens.less` | New `--du: 1rem`, becoming `calc(100vw / 102.5)` from 1640: a rem that keeps growing past 1640, for measures tied to a full-width photo | 1 |
| `01-settings/_bootstrap-vars.less` | `.container-edge` (the header's and footer's wrapper) takes `.design-frame()` | 1 |
| `02-tools/_mixins.less` | New `.design-frame()`: from 1640, `max-width: 102.5rem; margin-inline: auto` | 1 |
| `03-base/_base.less` | The root font-size table: 16 to 991, **14 from 992 to 1399** (was 16 to 1199 and 14 from 1200), 16 from 1400 with no rule above 1640 (the `calc(100vw / 102.5)` line is gone) | 1, 2 |
| `04-layout/_header.less` | From 992: logo `17rem` (238), links `1rem` (14), nav gap `clamp(1.75rem, 33.3333vw - 21.87rem, 2.25rem)` (24.5 at 992 to 31.5 by 1013), replacing the three 992-to-1200 clamps | 2 |
| `05-components/_article-grid.less` | The green strip behind the first cards is `750 / 216` from 576 (two cards side by side); the phone caption declares its tracking | 9, 4 |
| `05-components/_contact.less` | The field rule's two halves overlap by half a pixel; `.contact__field { position: relative }`; new `.form-tip` (Dark Green, white 13 / 18 copy, a 10px caret, the Yellow 18px icon, `--shadow-marker`, rises 6 and fades in over `--duration-fast` / `--duration-base` on `--ease-settle`, leaves over `--duration-fast`) | 8 |
| `05-components/_cta-links.less` | The phone intro declares its tracking | 4 |
| `05-components/_feature-banner.less` | `--banner-height` max and `--banner-top` (and the `--y168`, `--y237`, `--y209` tops) in `--du`, so a banner keeps its proportion past 1640; the right-hand copy (`--right`) never sits further left than 57.26% past 1640; the phone text declares its tracking | 1, 4 |
| `05-components/_hero.less` | Photo layer `106.77%` tall with `--parallax-to: -6.34%` (the new photo's 80 of spare); the title a tenth smaller from 992 to 1199 (`7.402 * var(--hero-u)` under `max-width: 1199.98px`); the copy's tracking is `var(--letter-spacing-body)` at every width (the `0.01em` phone value and the lg override are gone) | 2, 3, 4 |
| `05-components/_link-columns.less` | The grid takes `.design-frame()`; `.fold__body { color: var(--color-text) }`; three 15px blocks declare their tracking | 1, 7, 4 |
| `05-components/_link-grid.less` | `.link-grid__link` declares `letter-spacing: var(--letter-spacing-body)` (the policy titles); the phone copy declares its tracking | 4 |
| `05-components/_mosaic.less`, `_page-hero.less`, `_staff-grid.less`, `_timeline.less`, `_scroller.less` (phone text), `_quote-slider.less` (intro) | 15px phone copy declares `letter-spacing: var(--letter-spacing-body)` (in `_timeline.less` the Inter `__time` label is split out and keeps its own); `_scroller.less` also lets the activity cards grow past 1640 (`flex-grow: 1` from `@bp-design`) | 4, 1 |
| `05-components/_pillars.less` | The grid takes `.design-frame()`; on phones the slider has a `1px` `--color-line` top rule under the arrows; the phone text declares its tracking | 1, 6, 4 |
| `05-components/_quote-slider.less` | Two `@property` rules (`--qs-fade-top`, `--qs-fade-bottom`); in the educators layout the quote box has `min-height: 0` and the quote `flex: 1 1 0; overflow-y: auto; scrollbar-width: none` with a `mask-image` fading its top and bottom edges (the fade sizes animate with `is-scrolled` / `is-end`); the quote's line-height is `var(--qs-quote-leading, 0.95)`; on phones the educators' caption is `height: var(--qs-panel-m)` | 10 |
| `05-components/_search.less` | `__meta` soft white (`color-mix` 75%), `__page` white, `__link` hover and focus Yellow (were Light Blue) | 5 |
| `05-components/_split-feature.less` | `--split-height` max and `--split-top` in `--du` | 1 |

## 8. Things that break if missed

- **`--du` and `.design-frame()` first.** `_feature-banner`, `_split-feature`, `_bootstrap-vars`, `_pillars` and `_link-columns` use them. Without the mixin the LESS does not compile; without `--du` the banner height clamp is invalid and every photo banner collapses to its 24rem minimum.
- **The root font-size table.** The 14px step now starts at 992, not 1200. Port `_base.less` whole: a Wagtail copy that still has 16 at 992 to 1199 shows the oversized laptop layout the agency flagged.
- **CSS and JS together, twice.** The form tip is `form.js` plus `.form-tip` in `_contact.less` plus the `icon-warning` symbol: with only the script, the tip renders unstyled; with only the CSS, the browser's own bubble shows. The scrolling quotes are `_quote-slider.less` plus `initQuoteScroll` in `ui.js`: with only the CSS the quotes scroll by hand but never glide.
- **`data-form-validate`** must be on the `<form>` and every control must have an `id`, or the script does nothing and the browser bubble returns.
- **`data-lenis-prevent`** on a scrolling quote is set by the script. Do not add it in the template: a quote shorter than its box would then swallow the wheel.
- **Educator quotes in full.** The box scrolls; do not trim the quotes to fit.
- **The logo `sizes`.** Leaving the old values only picks a larger file than needed; it is not a layout bug, but fix it with edit 1.

## 9. Checks after porting

Desktop checks at 1640 wide unless stated.

- [ ] **2560 wide:** the copy, nav, buttons and logo are the same size as at 1640, the content column is centred, and the photo banners fill the width. The home faith banner's copy does not sit on the boy's cap. The testimonial row shows no gap at its right end.
- [ ] **992 × 600** (DevTools responsive mode): the logo is 238 wide, the nav links 14px, the three quick-link chips smaller than at 1640, the hero title about 60px, and the bar fits on one line with nothing wrapped. At 1200 × 700 nothing has changed from before.
- [ ] **Home hero:** the new photo (girl and boy in blazers) on desktop and on a phone, scrolling up slightly as the page scrolls on desktop.
- [ ] **Policies list:** the titles are tighter than before (−3%); nothing wraps differently at 1640.
- [ ] **Search:** no Light Blue anywhere in the results; a hovered result turns Yellow; the matched words are Yellow.
- [ ] **Phone pillars** (375): a thin Light Blue line sits 20px under the arrows, above the first card.
- [ ] **Preparatory "Our teaching approach" and K-6 teams:** the copy under an open title is Near Black; the titles stay Dark Green.
- [ ] **Contact form:** press Submit with the fields empty: a Dark Green bubble with a Yellow warning disc appears under First Name, which has the focus; it goes as you type. Type `jane.doe` as the email and submit: the bubble asks for an address like jane.doe@gmail.com. No browser-styled bubble appears. On a phone the bubble sits under the field the same way.
- [ ] **News listing at 600 wide:** no green behind the captions of the first two cards.
- [ ] **Welcome educators:** hover a card with a long quote: the quote shows in its box at 40px, fades at the bottom, and after a moment glides to its end; a wheel over it scrolls it by hand without the page moving. On a phone the active card's quote does the same in the 300px panel. Will Mison, Lisa Speranza and Louise McNerney show the placeholder.
- [ ] **Welcome executives:** six real roles and bios.
- [ ] **Extra Curricular:** the Languages card shows the French and Mandarin copy.
- [ ] **Home core values:** Collaboration, Innovation, Compassion, in that order.
