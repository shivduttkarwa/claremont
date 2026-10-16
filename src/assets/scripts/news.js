// news — [data-load-more]: the listing's arrow fetches the next page and adds its cards under these, then points at the
// page after or goes; without the script, or where the fetch fails (a file:// preview), it simply opens that page
import { Anim } from "./anim.js";

const CARDS = ".article-grid__grid > li";

export function initLoadMore(root = document) {
  root.querySelectorAll("[data-load-more]").forEach((link) => {
    const list = link.closest("section")?.querySelector(".article-grid__grid");
    if (!list) return;
    let busy = false;

    link.addEventListener("click", async (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
      event.preventDefault();
      if (busy) return;
      busy = true;
      link.setAttribute("aria-busy", "true");
      try {
        const response = await fetch(link.href);
        if (!response.ok) throw new Error(response.status);
        const page = new DOMParser().parseFromString(await response.text(), "text/html");
        const cards = [...page.querySelectorAll(CARDS)].map((card) => document.importNode(card, true));
        if (!cards.length) throw new Error("no cards");
        cards.forEach((card, i) => {
          // the same staggered rise along its row as the cards above (anim.js reads these, as from data-anim-group)
          card.setAttribute("data-anim", "reveal");
          card.setAttribute("data-anim-type", "fade-up");
          card.setAttribute("data-anim-order", String(i));
          card.setAttribute("data-anim-auto-order", "");
          list.append(card);
        });
        cards.forEach((card) => {
          Anim.add(card);
          if (!card.hasAttribute("data-anim-bound")) card.removeAttribute("data-anim"); // never left hidden
        });
        // a keyboard reader carries on from the first new card once its reveal has shown it (a hidden card takes no focus)
        const first = cards[0].querySelector("a");
        const land = () => (getComputedStyle(cards[0]).visibility === "visible" ? first?.focus({ preventScroll: true }) : requestAnimationFrame(land));
        requestAnimationFrame(land);
        const next = page.querySelector("[data-load-more]");
        if (next) link.href = next.getAttribute("href");
        else link.closest("nav")?.remove();
      } catch {
        window.location.href = link.href;
      } finally {
        busy = false;
        link.removeAttribute("aria-busy");
      }
    });
  });
}
