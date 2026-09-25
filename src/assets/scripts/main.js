/**
 * Site entry — bundled by esbuild into dist/assets/js/main.js
 */
import "bootstrap/js/dist/offcanvas";
import { Anim } from "./anim.js";
import { initApproachAccordion, initCurrentNav, initHotspots, initQuoteCards, initRevealCards, initRevealColumns, initScrollers, initStickyHeader, initTabArrows } from "./ui.js";
import { initSearch } from "./search.js";
import { initSliders } from "./slider.js";
import { initQuoteReveal } from "./quote-reveal.js";

document.addEventListener("DOMContentLoaded", () => {
  Anim.init();
  initCurrentNav();
  initHotspots();
  initQuoteCards();
  initRevealColumns();
  initRevealCards();
  initQuoteReveal();
  initScrollers();
  initSliders();
  initTabArrows();
  initApproachAccordion();
  initSearch();
  initStickyHeader();
});
