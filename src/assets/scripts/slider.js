/**
 * slider — Swiper carousels for [data-slider] sections: free-width slides with the section's own
 * arrow buttons. data-slider-edge snaps them to the .container edge, data-slider-dim fades the
 * card that is only partly on screen.
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

// The trailing space that leaves the row on the card grid: the carousel then stops with the last
// card's edge where the dim starts, instead of a few px past it.
const latticeTail = (el, before) => {
  const slide = el.querySelector(".swiper-slide");
  const card = slide ? slide.getBoundingClientRect().width : 0;
  return card > 0 ? (el.getBoundingClientRect().width - before) % card : before;
};

// Fade whichever card is only partly on screen (the design fades the peeking card). This reads
// Swiper's own geometry rather than the painted box: the wipe-up entrance clips the cards, and an
// observer would take that for sideways clipping and dim the whole row until the reveal finished.
const dimClipped = (swiper) => {
  const update = () => {
    swiper.slides.forEach((slide, i) => {
      const left = swiper.slidesGrid[i] + swiper.translate;
      slide.classList.toggle("is-clipped", left < -1 || left + slide.swiperSlideSize > swiper.width + 1);
    });
  };
  swiper.on("setTranslate", update);
  swiper.on("resize", update);
  update();
};

export function initSliders(root = document) {
  root.querySelectorAll("[data-slider]").forEach((section) => {
    const el = section.querySelector(".swiper");
    if (!el) return;
    const edge = () => (el.hasAttribute("data-slider-edge") ? containerEdge(section, el) : 0);
    const tail = () => (el.hasAttribute("data-slider-edge") ? latticeTail(el, edge()) : 0);

    el.swiper = new Swiper(el, {
      modules: [Navigation, A11y],
      speed: 900,
      slidesPerView: "auto",
      spaceBetween: 0,
      resistance: false,
      initialSlide: parseInt(el.dataset.sliderStart || "0", 10),
      slidesOffsetBefore: edge(),
      slidesOffsetAfter: tail(),
      navigation: {
        prevEl: section.querySelector("[data-slider-prev]"),
        nextEl: section.querySelector("[data-slider-next]"),
        disabledClass: "is-disabled",
      },
      on: {
        resize: (s) => {
          s.params.slidesOffsetBefore = edge();
          s.params.slidesOffsetAfter = tail();
          s.update();
        },
      },
    });

    if (el.hasAttribute("data-slider-dim")) dimClipped(el.swiper);
  });
}
