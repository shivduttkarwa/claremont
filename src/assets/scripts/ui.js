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
}

export function initHotspots(root = document) {
  root.querySelectorAll("[data-hotspots]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-hotspot-toggle]");
      if (!toggle) return;
      const item = toggle.closest("[data-hotspot]");
      openHotspot(group, item.classList.contains("is-open") ? null : item);
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Escape") openHotspot(group, null);
    });
  });
}

// One quote showing at a time: hovering a card raises its quote and drops the one before it.
// Touch keeps whichever card the markup opens, so the design's resting state stands.
export function initQuoteCards(root = document) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  root.querySelectorAll("[data-quote-cards]").forEach((group) => {
    const cards = [...group.querySelectorAll("[data-quote-card]")];
    cards.forEach((card) => {
      card.addEventListener("pointerenter", () => {
        cards.forEach((other) => other.classList.toggle("is-open", other === card));
      });
    });
  });
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
      // reveals folded away at load are only set up once they have a box
      if (open) Anim.add(pane);
    });
  });
}

// One column open at a time: hover or click opens one from lg (one always stays open), a tap toggles below lg
export function initRevealColumns(root = document) {
  const desktop = window.matchMedia("(min-width: 992px)");
  const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
  root.querySelectorAll("[data-reveal-columns]").forEach((section) => {
    const items = [...section.querySelectorAll(".link-columns__item:has([aria-expanded])")];
    const open = (item, on = true) => {
      items.forEach((other) => {
        const state = other === item && on;
        other.classList.toggle("is-open", state);
        other.querySelector("[aria-expanded]")?.setAttribute("aria-expanded", String(state));
      });
    };
    items.forEach((item) => {
      item.querySelector("[aria-expanded]")?.addEventListener("click", () => {
        open(item, desktop.matches || !item.classList.contains("is-open"));
      });
      item.addEventListener("mouseenter", () => {
        if (desktop.matches && mouse.matches) open(item);
      });
    });
  });
}

// Cards whose copy shows on the open one only: with a mouse from lg the first is open at rest and hover or
// focus opens another; below lg the cards are an accordion, so a tap toggles the copy instead of following the link
export function initRevealCards(root = document) {
  const mouse = window.matchMedia("(min-width: 992px) and (hover: hover) and (pointer: fine)");
  const phone = window.matchMedia("(max-width: 991.98px)");
  root.querySelectorAll("[data-reveal-cards]").forEach((track) => {
    const cards = [...track.children];
    const links = cards.map((card) => card.querySelector("a"));
    const open = (card) => cards.forEach((other) => other.classList.toggle("is-open", other === card));
    const sync = () =>
      cards.forEach((card, i) => {
        if (phone.matches && card.querySelector(".scroller__panel")) links[i].setAttribute("aria-expanded", String(card.classList.contains("is-open")));
        else links[i].removeAttribute("aria-expanded");
      });
    cards.forEach((card, i) => {
      card.addEventListener("mouseenter", () => mouse.matches && open(card));
      card.addEventListener("focusin", () => mouse.matches && open(card));
      links[i].addEventListener("click", (event) => {
        if (!phone.matches || !card.querySelector(".scroller__panel")) return;
        event.preventDefault();
        if (card.classList.contains("is-open")) card.classList.remove("is-open");
        else open(card);
        sync();
      });
    });
    phone.addEventListener("change", sync);
    sync();
  });
}

// Headroom header: pinned once scrolled past its own height, hidden on the way down, shown on the way up
export function initStickyHeader(header = document.querySelector(".site-header")) {
  if (!header) return;
  const tolerance = 6;
  let last = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = Math.max(0, window.scrollY);
    const delta = y - last;
    if (y <= 0) {
      header.classList.remove("is-pinned", "is-shown");
    } else if (!header.classList.contains("is-pinned")) {
      if (y > header.offsetHeight) {
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
