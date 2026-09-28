// carousel — [data-image-carousel]: the arrows step through the stacked slides and wrap round, a horizontal swipe too;
// the cross-fade and zoom are the stylesheet's
const SWIPE = 40; // px of horizontal travel that counts as a swipe

export function initImageCarousels(root = document) {
  root.querySelectorAll("[data-image-carousel]").forEach((carousel) => {
    const stage = carousel.querySelector("[data-carousel-stage]");
    const slides = [...stage.children];
    if (slides.length < 2) return;
    let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));

    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const on = i === current;
        slide.classList.toggle("is-active", on);
        if (on) slide.removeAttribute("aria-hidden");
        else slide.setAttribute("aria-hidden", "true");
      });
    };
    carousel.querySelector("[data-carousel-prev]")?.addEventListener("click", () => show(current - 1));
    carousel.querySelector("[data-carousel-next]")?.addEventListener("click", () => show(current + 1));

    let start = null;
    stage.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse") start = { x: event.clientX, y: event.clientY };
    });
    stage.addEventListener("pointerup", (event) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener("pointercancel", () => { start = null; });
  });
}
