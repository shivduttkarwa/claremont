/**
 * slider — Swiper carousels for [data-slider] sections: free-width slides that snap to the
 * .container edge, with the section's own arrow buttons.
 */
import Swiper from "swiper";
import { A11y, Navigation } from "swiper/modules";

// The .container content edge, measured from the section's own container so any gutter expression works:
// the snapped card lines up with the copy above it
const containerEdge = (section, el) => {
  const box = section.querySelector(".container");
  if (!box) return 0;
  return box.getBoundingClientRect().left + parseFloat(getComputedStyle(box).paddingLeft) - el.getBoundingClientRect().left;
};

export function initSliders(root = document) {
  root.querySelectorAll("[data-slider]").forEach((section) => {
    const el = section.querySelector(".swiper");
    if (!el) return;
    const edge = () => containerEdge(section, el);

    el.swiper = new Swiper(el, {
      modules: [Navigation, A11y],
      speed: 900,
      slidesPerView: "auto",
      spaceBetween: 0,
      resistance: false,
      initialSlide: parseInt(el.dataset.sliderStart || "0", 10),
      slidesOffsetBefore: edge(),
      slidesOffsetAfter: edge(),
      navigation: {
        prevEl: section.querySelector("[data-slider-prev]"),
        nextEl: section.querySelector("[data-slider-next]"),
        disabledClass: "is-disabled",
      },
      on: {
        resize: (s) => {
          s.params.slidesOffsetBefore = edge();
          s.params.slidesOffsetAfter = edge();
          s.update();
        },
      },
    });
  });
}
