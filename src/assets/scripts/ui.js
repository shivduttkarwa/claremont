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

export function initScrollers(root = document) {
  root.querySelectorAll("[data-scroller]").forEach((scroller) => {
    const track = scroller.querySelector("[data-scroller-track]");
    if (!track) return;
    const step = () => track.firstElementChild?.getBoundingClientRect().width || 0;

    // Start on the Nth card, aligned to the .container edge (scroll-padding), with the previous card peeking.
    const start = parseInt(track.dataset.scrollerStart || "0", 10);
    if (start > 0) {
      const styles = getComputedStyle(document.documentElement);
      const gutter = remToPx(styles.getPropertyValue("--container-gutter"));
      const content = remToPx(styles.getPropertyValue("--container-content"));
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
