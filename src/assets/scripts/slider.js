/**
 * slider — Swiper carousels for [data-slider] sections: free-width slides with the section's own
 * arrow buttons. data-slider-edge snaps them to the .container edge (from a breakpoint when it names
 * one), data-slider-dim fades the card that is only partly on screen, data-slider-per-view-md shows
 * that many slides from the md breakpoint.
 */
import Swiper from "swiper";
import { A11y, Navigation } from "swiper/modules";

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

// The .swiper box clips the slides waiting off to the side, so a lazy photo there is not fetched until it slides in
const loadAhead = (section) => {
  const photos = section.querySelectorAll('.swiper-slide img[loading="lazy"]');
  if (!photos.length) return;
  const load = () => photos.forEach((img) => {
    img.loading = "eager";
    img.decode?.().catch(() => {});
  });
  if (!("IntersectionObserver" in window)) return load();
  const watcher = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watcher.disconnect();
      load();
    },
    { rootMargin: "200% 0px" }
  );
  watcher.observe(section);
};

const SWIPE = 40; // px of sideways travel that counts as a swipe

// data-slider-deck: below md the slides are one stacked deck. The stylesheet draws the change; this names the states
const buildDeck = (section, el) => {
  const slides = [...el.querySelectorAll(".swiper-slide")];
  const buttons = [section.querySelector("[data-slider-prev]"), section.querySelector("[data-slider-next]")];
  let current = 0;
  let queued = null;
  let timer = 0;
  let start = null;

  const show = (index) => {
    const to = Math.max(0, Math.min(slides.length - 1, index));
    // one change at a time: a tap during it is kept and played next
    if (timer) {
      queued = to;
      return;
    }
    const from = current;
    current = to;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === to);
      slide.classList.toggle("is-before", i < to);
      slide.classList.toggle("is-leaving", i === from && from !== to);
      if (i === to) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", "true");
    });
    buttons.forEach((button, i) => {
      const off = i ? to === slides.length - 1 : to === 0;
      button?.classList.toggle("is-disabled", off);
      if (button) button.disabled = off;
    });
    if (from === to) return;
    timer = setTimeout(() => {
      timer = 0;
      slides[from].classList.remove("is-leaving");
      const next = queued;
      queued = null;
      if (next !== null && next !== current) show(next);
    }, parseFloat(getComputedStyle(el).getPropertyValue("--deck-time")) * 1000 || 0);
  };
  const back = () => show(current - 1);
  const forward = () => show(current + 1);
  const down = (event) => {
    if (event.pointerType !== "mouse") start = { x: event.clientX, y: event.clientY };
  };
  const up = (event) => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
  };
  const cancel = () => { start = null; };

  el.classList.add("is-deck");
  show(0);
  buttons[0]?.addEventListener("click", back);
  buttons[1]?.addEventListener("click", forward);
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", cancel);

  return () => {
    clearTimeout(timer);
    buttons[0]?.removeEventListener("click", back);
    buttons[1]?.removeEventListener("click", forward);
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", cancel);
    el.classList.remove("is-deck");
    slides.forEach((slide) => {
      slide.classList.remove("is-active", "is-before", "is-leaving");
      slide.removeAttribute("aria-hidden");
    });
    buttons.forEach((button) => {
      button?.classList.remove("is-disabled");
      if (button) button.disabled = false;
    });
  };
};

export function initSliders(root = document) {
  root.querySelectorAll("[data-slider]").forEach((section) => {
    const el = section.querySelector(".swiper");
    if (!el) return;
    loadAhead(section);
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

    const build = () => {
      el.swiper = new Swiper(el, {
        modules: [Navigation, A11y],
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
    };

    const teardown = () => {
      el.swiper.destroy(true, true);
      el.swiper = null;
    };

    // data-slider-below-lg: one list of items is a slider on phones and tablets only; from lg the
    // stylesheet lays the same slides out itself, so the Swiper is torn down there (styles cleaned)
    if (section.hasAttribute("data-slider-below-lg")) {
      const phone = window.matchMedia("(max-width: 991.98px)");
      const deck = el.hasAttribute("data-slider-deck") ? window.matchMedia("(max-width: 767.98px)") : null;
      let undeck = null;
      const sync = () => {
        const stacked = !!deck?.matches;
        if (stacked && el.swiper) teardown();
        if (!stacked && undeck) {
          undeck();
          undeck = null;
        }
        if (stacked) undeck ||= buildDeck(section, el);
        else if (phone.matches && !el.swiper) build();
        else if (!phone.matches && el.swiper) teardown();
      };
      phone.addEventListener("change", sync);
      deck?.addEventListener("change", sync);
      sync();
      return;
    }
    build();
  });
}
