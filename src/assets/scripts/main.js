/**
 * Site entry — bundled by esbuild into dist/assets/js/main.js
 */
import "bootstrap/js/dist/offcanvas";
import { Anim } from "./anim.js";
import { initAccordions, initApproachAccordion, initCurrentNav, initHotspots, initPlaceholderLinks, initQuoteCards, initRevealCards, initRevealColumns, initScrollers, initStickyHeader, initTabArrows } from "./ui.js";
import { initSearch } from "./search.js";
import { initSliders } from "./slider.js";
import { initPan } from "./pan.js";
import { initMosaicAssembly } from "./mosaic.js";
import { initPageTransition } from "./transition.js";
import { initImageCarousels } from "./carousel.js";

document.addEventListener("DOMContentLoaded", () => {
  Anim.init({ after: window.__pageArrival });
  initCurrentNav();
  initPlaceholderLinks();
  initHotspots();
  initQuoteCards();
  initRevealColumns();
  initRevealCards();
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
  initPageTransition();
});
