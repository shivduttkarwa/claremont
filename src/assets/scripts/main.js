/**
 * Site entry — bundled by esbuild into dist/assets/js/main.js
 */
import "bootstrap/js/dist/offcanvas";
import { Anim } from "./anim.js";
import { initApproachAccordion, initCurrentNav, initHeaderNav, initHotspots, initQuoteCards, initRevealCards, initRevealColumns, initScrollers, initStickyHeader, initTabArrows } from "./ui.js";
import { initSearch } from "./search.js";
import { initSliders } from "./slider.js";
import { initQuoteReveal } from "./quote-reveal.js";
import { initMosaicAssembly } from "./mosaic.js";
import { initPageTransition } from "./transition.js";

document.addEventListener("DOMContentLoaded", () => {
  Anim.init({ after: window.__pageArrival });
  initCurrentNav();
  initHotspots();
  initQuoteCards();
  initRevealColumns();
  initRevealCards();
  initQuoteReveal();
  initMosaicAssembly();
  initScrollers();
  initSliders();
  initTabArrows();
  initApproachAccordion();
  initSearch();
  initStickyHeader();
  initHeaderNav();
  initPageTransition();
});
