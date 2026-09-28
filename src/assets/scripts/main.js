/**
 * Site entry — bundled by esbuild into dist/assets/js/main.js
 */
import "bootstrap/js/dist/offcanvas";
import { Anim } from "./anim.js";
import { initAccordions, initApproachAccordion, initCurrentNav, initHeaderNav, initHotspots, initPlaceholderLinks, initQuoteCards, initRevealCards, initRevealColumns, initScrollers, initStickyHeader, initTabArrows } from "./ui.js";
import { initSearch } from "./search.js";
import { initSliders } from "./slider.js";
import { initPan } from "./pan.js";
import { initQuoteReveal } from "./quote-reveal.js";
import { initMosaicAssembly } from "./mosaic.js";
import { initPageTransition } from "./transition.js";
import { initButtons } from "./buttons.js";
import { initImageCarousels } from "./carousel.js";

document.addEventListener("DOMContentLoaded", () => {
  Anim.init({ after: window.__pageArrival });
  initCurrentNav();
  initPlaceholderLinks();
  initHotspots();
  initQuoteCards();
  initRevealColumns();
  initRevealCards();
  initQuoteReveal();
  initMosaicAssembly();
  initScrollers();
  initPan(); // before the sliders: the snapped card width must be in place when Swiper measures
  initSliders();
  initTabArrows();
  initApproachAccordion();
  initAccordions();
  initImageCarousels();
  initSearch();
  initStickyHeader();
  initHeaderNav();
  initButtons();
  initPageTransition();
});
