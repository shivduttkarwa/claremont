/**
 * slider — Swiper carousels for [data-slider] sections: free-width slides with the section's own
 * arrow buttons. data-slider-edge snaps them to the .container edge (from a breakpoint when it names
 * one), data-slider-dim fades the card that is only partly on screen, data-slider-per-view-md shows
 * that many slides from the md breakpoint, data-slider-parallax lets each photo drift behind its card edge and data-slider-lines rolls
 * that copy in line by line, both on phones.
 */
import Swiper from "swiper";
import { A11y, Navigation, Parallax } from "swiper/modules";
import { slideLines } from "./slide-lines.js";

const breakpoints = { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 };

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
    // data-slider-edge="md" keeps the .container-edge snap for tablets and up: phones run full-bleed
    const edgeOn = () => {
      const value = el.getAttribute("data-slider-edge");
      if (value === null) return false;
      return !(value in breakpoints) || window.matchMedia(`(min-width: ${breakpoints[value]}px)`).matches;
    };
    const edge = () => (edgeOn() ? containerEdge(section, el) : 0);
    const tail = () => (edgeOn() ? latticeTail(el, edge()) : 0);

    // data-slider-open-active: without hover, the active slide's card is the open one (its quote rises
    // as the slide arrives and the previous card's drops), the way hovering opens a card on desktop
    const openActive = (swiper) => {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const sync = (s) => s.slides.forEach((slide, i) => slide.classList.toggle("is-open", i === s.activeIndex));
      swiper.on("slideChange", sync);
      sync(swiper);
    };

    // data-slider-parallax="35%": on phones each photo trails its card by that share, gliding in behind the edge
    const phoneFx = el.dataset.sliderParallax || el.dataset.sliderLines
      ? window.matchMedia("(max-width: 767.98px) and (prefers-reduced-motion: no-preference)")
      : null;
    const photos = (on) => el.querySelectorAll(".swiper-slide img").forEach((img) => {
      if (on) return img.setAttribute("data-swiper-parallax", el.dataset.sliderParallax);
      img.removeAttribute("data-swiper-parallax");
      img.style.removeProperty("transform");
      img.style.removeProperty("transition-duration");
    });

    const build = () => {
      const fx = !!phoneFx?.matches;
      const drift = fx && !!el.dataset.sliderParallax;
      if (el.dataset.sliderParallax) photos(drift);
      el.swiper = new Swiper(el, {
        modules: drift ? [Navigation, A11y, Parallax] : [Navigation, A11y],
        parallax: drift,
        speed: 900,
        slidesPerView: el.dataset.sliderPerView ? parseFloat(el.dataset.sliderPerView) : "auto",
        breakpoints: el.dataset.sliderPerViewMd ? { [breakpoints.md]: { slidesPerView: parseFloat(el.dataset.sliderPerViewMd) } } : undefined,
        spaceBetween: 0,
        resistance: false,
        initialSlide: parseInt(el.dataset.sliderStart || "0", 10),
        rewind: el.hasAttribute("data-slider-rewind"),
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
      if (el.hasAttribute("data-slider-open-active")) openActive(el.swiper);
      if (fx && el.dataset.sliderLines) el.linesOff = slideLines(el.swiper, el.dataset.sliderLines);
    };

    const teardown = () => {
      el.linesOff?.();
      el.linesOff = null;
      el.swiper.destroy(true, true);
      el.swiper = null;
      if (el.dataset.sliderParallax) photos(false);
    };

    phoneFx?.addEventListener("change", () => {
      if (!el.swiper) return;
      teardown();
      build();
    });

    // data-slider-below-lg: one list of items is a slider on phones and tablets only; from lg the
    // stylesheet lays the same slides out itself, so the Swiper is torn down there (styles cleaned)
    if (section.hasAttribute("data-slider-below-lg")) {
      const phone = window.matchMedia("(max-width: 991.98px)");
      const sync = () => {
        if (phone.matches && !el.swiper) build();
        else if (!phone.matches && el.swiper) teardown();
      };
      phone.addEventListener("change", sync);
      sync();
      return;
    }
    build();
  });
}
