/**
 * ui — the few interactions the design calls for: hotspot toggles,
 * the snap-scroll carousel arrows and prev/next for the tab bar.
 * Everything else (reveals, parallax) is the anim system.
 */
import Tab from "bootstrap/js/dist/tab";
import { Anim } from "./anim.js";

const remToPx = (value) =>
  parseFloat(value) * parseFloat(getComputedStyle(document.documentElement).fontSize);

// Static cutup only: Wagtail marks the current page server-side.
export function initCurrentNav(root = document) {
  const here = location.pathname.split("/").pop() || "index.html";
  root.querySelectorAll("[data-nav] a").forEach((link) => {
    if (link.getAttribute("href") === here) link.setAttribute("aria-current", "page");
  });
}

// Open one hotspot of a group (or none) and close the rest
export function openHotspot(group, open) {
  group.querySelectorAll("[data-hotspot]").forEach((item) => {
    const on = item === open;
    item.classList.toggle("is-open", on);
    item.querySelector("[data-hotspot-toggle]")?.setAttribute("aria-expanded", String(on));
  });
  placeHotspot(group);
}

// The card opens to the right of its disc as Figma draws it and fades the discs it covers; it only moves when it would
// leave the photo or cover the title, which happens as the photo shrinks while the card keeps Figma's 353
const desktop = window.matchMedia("(min-width: 992px)");
const PLACES = [[false, false], [true, false], [false, true], [true, true]];

export function placeHotspot(group) {
  const items = [...group.querySelectorAll("[data-hotspot]")];
  items.forEach((item) => item.classList.remove("is-covered"));
  const open = items.find((item) => item.classList.contains("is-open"));
  const bounds = group.getBoundingClientRect();
  if (!open || !desktop.matches || !bounds.width) {
    open?.classList.remove("is-swapped", "is-up");
    return;
  }
  const card = open.querySelector(".hotspot__card");
  const gap = remToPx(0.5);
  const title = group.closest(".approach__overlay")?.querySelector("h2");
  const discs = items.filter((item) => item !== open).map((item) => [item, item.getBoundingClientRect()]);
  const keepClear = [];
  if (title) {
    const range = document.createRange();
    range.selectNodeContents(title);
    keepClear.push(range.getBoundingClientRect());
  }

  const measure = ([swapped, up]) => {
    open.classList.toggle("is-swapped", swapped);
    open.classList.toggle("is-up", up);
    const box = open.getBoundingClientRect();
    const left = box.left + card.offsetLeft;
    const top = box.top + card.offsetTop;
    const right = left + card.offsetWidth;
    const bottom = top + card.offsetHeight;
    const touches = (r) => r.right + gap > left && r.left - gap < right && r.bottom + gap > top && r.top - gap < bottom;
    const hits = discs.filter(([, r]) => touches(r));
    const outside = left < bounds.left || right > bounds.right || top < bounds.top || bottom > bounds.bottom;
    return { place: [swapped, up], hits, score: (outside ? 100 : 0) + keepClear.filter(touches).length };
  };

  let best = null;
  for (const place of PLACES) {
    const result = measure(place);
    if (!best || result.score < best.score) best = result;
    if (!result.score) break;
  }
  measure(best.place);
  best.hits.forEach(([item]) => item?.classList.add("is-covered"));
}

function placeAll() {
  document.querySelectorAll("[data-hotspots]").forEach(placeHotspot);
}

export function initHotspots(root = document) {
  root.querySelectorAll("[data-hotspots]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-hotspot-toggle]");
      if (!toggle) return;
      const item = toggle.closest("[data-hotspot]");
      openHotspot(group, item.classList.contains("is-open") ? null : item);
      settleReveals(item.querySelector(".hotspot__card"));
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Escape") openHotspot(group, null);
    });
  });
  let frame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(placeAll);
  });
  document.fonts?.ready.then(placeAll);
  placeAll();
}

// Links still pointing at "#" are placeholders for pages the CMS will supply: a click does nothing, instead of jumping to the top
export function initPlaceholderLinks(root = document) {
  root.addEventListener("click", (event) => {
    const link = event.target.closest('a[href="#"]');
    if (link) event.preventDefault();
  });
}

// Hover only, no click: the card under the pointer raises its quote over its overlay, and drops it again
// when the pointer leaves. Touch opens the active slide instead (data-slider-open-active).
export function initQuoteCards(root = document) {
  root.querySelectorAll("[data-quote-cards]").forEach(initQuoteScroll);
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  root.querySelectorAll("[data-quote-cards]").forEach((group) => {
    const cards = [...group.querySelectorAll("[data-quote-card]")];
    cards.forEach((card) => {
      card.addEventListener("pointerenter", () => {
        cards.forEach((other) => other.classList.toggle("is-open", other === card));
      });
      card.addEventListener("pointerleave", () => card.classList.remove("is-open"));
    });
  });
}

// A quote that scrolls in its box glides to its end once its card opens; a wheel, swipe or key takes over by hand
const QUOTE_GLIDE = { speed: 24, wait: 1400, reset: 700 };

function initQuoteScroll(group) {
  const cards = [...group.querySelectorAll("[data-quote-card]")].filter((card) => {
    const quote = card.querySelector(".quote-slider__quote");
    return quote && getComputedStyle(quote).overflowY !== "visible";
  });
  if (!cards.length) return;
  const phone = window.matchMedia("(max-width: 767.98px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const section = group.closest("[data-slider]") || group;
  const syncs = [];
  const marks = [];
  let inView = false;
  new IntersectionObserver(
    ([entry]) => {
      inView = entry.intersectionRatio >= 0.4;
      syncs.forEach((sync) => sync());
    },
    { threshold: [0, 0.4, 1] }
  ).observe(section);

  cards.forEach((card) => {
    const quote = card.querySelector(".quote-slider__quote");
    let raf = 0;
    let timer = 0;
    let manual = false;
    // only a quote longer than its box is a tab stop and keeps the wheel from the page
    const mark = () => {
      const room = quote.scrollHeight - quote.clientHeight;
      quote.classList.toggle("is-scrolled", quote.scrollTop > 1);
      quote.classList.toggle("is-end", quote.scrollTop >= room - 1);
      quote.toggleAttribute("data-lenis-prevent", room > 1);
      if (room > 1) quote.tabIndex = 0;
      else quote.removeAttribute("tabindex");
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      raf = timer = 0;
    };
    const glide = () => {
      if (raf || timer || manual || reduced.matches) return;
      timer = setTimeout(() => {
        timer = 0;
        let pos = quote.scrollTop;
        let last = null;
        const step = (now) => {
          if (last !== null) pos += ((now - last) / 1000) * QUOTE_GLIDE.speed;
          last = now;
          const max = quote.scrollHeight - quote.clientHeight;
          quote.scrollTop = Math.min(pos, max);
          raf = pos < max ? requestAnimationFrame(step) : 0;
        };
        raf = requestAnimationFrame(step);
      }, QUOTE_GLIDE.wait);
    };
    const isOpen = () => inView && card.classList.contains(phone.matches ? "is-active" : "is-open");
    const sync = () => {
      if (isOpen()) return glide();
      stop();
      manual = false;
      setTimeout(() => {
        if (isOpen()) return;
        quote.scrollTop = 0;
        mark();
      }, QUOTE_GLIDE.reset);
    };
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach((type) =>
      quote.addEventListener(type, () => {
        manual = true;
        stop();
      }, { passive: true })
    );
    quote.addEventListener("scroll", mark, { passive: true });
    new MutationObserver(sync).observe(card, { attributes: true, attributeFilter: ["class"] });
    syncs.push(sync);
    marks.push(mark);
    mark();
  });
  const markAll = () => marks.forEach((mark) => mark());
  document.fonts?.ready.then(markAll);
  window.addEventListener("resize", markAll);
}

export function initScrollers(root = document) {
  root.querySelectorAll("[data-scroller]").forEach((scroller) => {
    const track = scroller.querySelector("[data-scroller-track]");
    if (!track) return;
    const step = () => track.firstElementChild?.getBoundingClientRect().width || 0;

    // Start on the Nth card, aligned to the .container edge (scroll-padding), with the previous card peeking.
    const start = parseInt(track.dataset.scrollerStart || "0", 10);
    if (start > 0) {
      // --container-gutter is a max() below xxl, which parseFloat cannot read, so take the resolved
      // padding off a real .container instead.
      const probe = scroller.querySelector(".container");
      const gutter = probe ? parseFloat(getComputedStyle(probe).paddingLeft) : 0;
      const content = remToPx(getComputedStyle(document.documentElement).getPropertyValue("--container-content"));
      const offset = Math.max(gutter, (track.clientWidth - content) / 2);
      track.scrollLeft = step() * start - offset;
    }

    // Dim whichever card is only partly on screen (the design fades the peeking card)
    if (track.hasAttribute("data-scroller-dim") && "IntersectionObserver" in window) {
      const watcher = new IntersectionObserver(
        (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-clipped", entry.intersectionRatio < 0.98)),
        // generous vertical margin: only sideways clipping counts, not the reveal animation's vertical offset
        { root: track, rootMargin: "50% 0px", threshold: [0, 0.5, 0.98, 1] }
      );
      Array.from(track.children).forEach((card) => watcher.observe(card));
    }

    scroller.querySelector("[data-scroller-prev]")?.addEventListener("click", () =>
      track.scrollBy({ left: -step(), behavior: "smooth" })
    );
    scroller.querySelector("[data-scroller-next]")?.addEventListener("click", () =>
      track.scrollBy({ left: step(), behavior: "smooth" })
    );
  });
}

export function initTabArrows(root = document) {
  root.querySelectorAll("[data-tabs]").forEach((wrap) => {
    const tabs = Array.from(wrap.querySelectorAll('[data-bs-toggle="tab"]'));
    if (!tabs.length) return;
    const paneOf = (tab) => document.querySelector(tab.getAttribute("data-bs-target"));
    const go = (dir) => {
      const current = tabs.findIndex((tab) => tab.classList.contains("active"));
      const next = tabs[(current + dir + tabs.length) % tabs.length];
      Tab.getOrCreateInstance(next).show();
      next.scrollIntoView({ inline: "nearest", block: "nearest" });
    };
    wrap.querySelector("[data-tabs-prev]")?.addEventListener("click", () => go(-1));
    wrap.querySelector("[data-tabs-next]")?.addEventListener("click", () => go(1));

    // Before the switch: the incoming pane goes back to its start (first hotspot open, content
    // hidden) and is laid out at opacity 0, so it can cross-fade in over the outgoing pane.
    wrap.addEventListener("show.bs.tab", (event) => {
      const pane = paneOf(event.target);
      if (!pane) return;
      pane.querySelectorAll("[data-hotspots]").forEach((group) => openHotspot(group, group.querySelector("[data-hotspot]")));
      Anim.reset(pane);
      pane.classList.add("is-entering");
      void pane.offsetWidth;
      pane.querySelectorAll("[data-hotspots]").forEach(placeHotspot);
    });
    // The outgoing pane stays in place while the incoming one fades over it
    wrap.addEventListener("hide.bs.tab", (event) => {
      const pane = paneOf(event.target);
      if (!pane) return;
      pane.classList.add("is-leaving");
      const done = (end) => {
        if (end && (end.target !== pane || end.propertyName !== "opacity")) return;
        pane.classList.remove("is-leaving");
        pane.removeEventListener("transitionend", done);
      };
      pane.addEventListener("transitionend", done);
      setTimeout(done, 1500);
    });
    // The pane plays its entrance (title, markers, card) once its cross-fade is most of the way in.
    // Bootstrap's shown event fires at once, so the timing comes from the pane's own transition.
    wrap.addEventListener("shown.bs.tab", (event) => {
      const pane = paneOf(event.target);
      if (!pane) return;
      const fade = parseFloat(getComputedStyle(pane).transitionDuration) * 1000 || 0;
      setTimeout(() => {
        pane.classList.remove("is-entering");
        if (pane.classList.contains("active")) Anim.add(pane, { immediate: true });
      }, fade * 0.7);
    });
  });
}

// Phones show the four approach topics as an accordion instead of tabs: one open at a time, and the
// topic's photo rides above its own row. Desktop keeps the Bootstrap tabs untouched.
export function initApproachAccordion(root = document) {
  root.querySelectorAll("[data-tabs]").forEach((wrap) => {
    wrap.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-approach-toggle]");
      if (!toggle) return;
      const pane = toggle.closest(".tab-pane");
      const open = !pane.classList.contains("is-open");
      wrap.querySelectorAll(".tab-pane").forEach((other) => {
        const on = other === pane && open;
        other.classList.toggle("is-open", on);
        other.querySelector("[data-approach-toggle]")?.setAttribute("aria-expanded", String(on));
      });
      settleReveals(pane.querySelector(".approach__overlay"));
    });
  });
}

// The phone menu opens under the bar: html carries has-menu-open while it is open, so the bar stays on top and its
// hamburger reads as an X (both in _header.less). The page is held still under it by stopping touch scrolling at the
// document while the menu is open, except where the panel itself has room to scroll (its own overscroll is contained in
// CSS). Bootstrap's own hold, overflow: hidden on the body (data-bs-scroll is on), is not used: with the root clipping
// overflow it turns the body into a scroll container, and the sticky bar then sticks to the body's top, off screen
export function initMenu(root = document) {
  const panel = root.querySelector(".site-menu");
  if (!panel) return;
  const header = document.querySelector(".site-header");
  const html = document.documentElement;
  const scroller = panel.querySelector(".offcanvas-body");
  const hold = (event) => {
    if (scroller?.contains(event.target) && scroller.scrollHeight > scroller.clientHeight) return;
    event.preventDefault();
  };
  panel.addEventListener("show.bs.offcanvas", () => {
    html.classList.add("has-menu-open");
    // a bar that had scrolled away comes back for the menu, as if the reader had just scrolled up, and stays once it shuts
    if (header?.classList.contains("is-pinned")) header.classList.add("is-shown");
    document.addEventListener("touchmove", hold, { passive: false });
  });
  panel.addEventListener("hide.bs.offcanvas", () => html.classList.remove("has-menu-open"));
  panel.addEventListener("hidden.bs.offcanvas", () => document.removeEventListener("touchmove", hold));
}

// The rows around a fold move without a scroll, so their scroll reveals are brought up to date once it has settled
function settleReveals(panel) {
  const settle = panel ? parseFloat(getComputedStyle(panel).transitionDuration) * 1000 : 0;
  setTimeout(() => Anim.refresh(), settle + 50);
}

// [data-fold]: the ruled fold (_fold.less). One row open at a time; a row's button opens it, or shuts it when open.
// .fold--hover keeps one row open from lg, the one under the mouse or the last one tapped (the columns and the activity cards);
// data-fold-from moves that width for a list that stays an accordion longer
export function initFolds(root = document) {
  root.querySelectorAll("[data-fold]").forEach((list) => {
    const from = list.dataset.foldFrom || 992;
    const mouse = window.matchMedia(`(min-width: ${from}px) and (hover: hover) and (pointer: fine)`);
    const wide = window.matchMedia(`(min-width: ${from}px)`);
    const items = [...list.querySelectorAll(".fold__item")].filter((item) => item.closest("[data-fold]") === list);
    const rowOf = (item) => [...item.querySelectorAll(".fold__row[aria-expanded]")].find((row) => row.closest(".fold__item") === item);
    const hover = list.classList.contains("fold--hover");
    const setOpen = (open) => {
      items.forEach((other) => {
        const on = other === open;
        other.classList.toggle("is-open", on);
        rowOf(other)?.setAttribute("aria-expanded", String(on));
      });
    };
    list.addEventListener("click", (event) => {
      const row = event.target.closest(".fold__row[aria-expanded]");
      if (!row || row.closest("[data-fold]") !== list) return;
      const item = row.closest(".fold__item");
      setOpen(item.classList.contains("is-open") && !(hover && wide.matches) ? null : item);
      settleReveals(item.querySelector(":scope > .fold__panel"));
    });
    if (hover) items.forEach((item) => item.addEventListener("mouseenter", () => { if (mouse.matches) setOpen(item); }));
  });
}

// Headroom header: pinned once scrolled past its own height, hidden on the way down, shown on the way up
export function initStickyHeader(header = document.querySelector(".site-header")) {
  if (!header) return;
  const tolerance = 6;
  const band = window.matchMedia("(max-width: 991.98px)");
  let last = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = Math.max(0, window.scrollY);
    const h = header.offsetHeight;
    const delta = y - last;
    // below lg the bar is sticky in its own slot: once that slot is back in view it docks at once, never sliding in over white
    const docked = band.matches ? h : 0;
    if (y <= docked) {
      if (band.matches && header.classList.contains("is-pinned")) {
        header.classList.add("is-docking");
        requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove("is-docking")));
      }
      header.classList.remove("is-pinned", "is-shown");
    } else if (!header.classList.contains("is-pinned")) {
      if (y > h + (band.matches ? h / 2 : 0)) {
        header.classList.add("is-pinning", "is-pinned");
        requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove("is-pinning")));
      }
    } else if (Math.abs(delta) >= tolerance) {
      header.classList.toggle("is-shown", delta < 0);
    } else {
      return;
    }
    last = y;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) requestAnimationFrame(update);
    ticking = true;
  }, { passive: true });
  update();
}

// The fixed quick links tuck to their icons once the hero's bottom edge has risen past them
export function initSubnavTuck(root = document) {
  const nav = root.querySelector(":is(.hero, .page-hero) .subnav");
  if (!nav) return;
  const hero = nav.closest(".hero, .page-hero");
  let ticking = false;

  const update = () => {
    ticking = false;
    nav.classList.toggle("is-tucked", hero.getBoundingClientRect().bottom < nav.getBoundingClientRect().bottom);
  };
  const queue = () => {
    if (!ticking) requestAnimationFrame(update);
    ticking = true;
  };

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();
}
