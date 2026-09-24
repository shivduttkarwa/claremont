/**
 * Site entry — bundled by esbuild into dist/assets/js/main.js
 */
import "bootstrap/js/dist/offcanvas";
import { Anim } from "./anim.js";
import { initApproachAccordion, initCurrentNav, initHotspots, initQuoteCards, initScrollers, initStickyHeader, initTabArrows } from "./ui.js";
import { initSearch } from "./search.js";
import { initSliders } from "./slider.js";
import { initPortraitReveal, initQuoteReveal } from "./fluid-reveal.js";

document.addEventListener("DOMContentLoaded", () => {
  Anim.init();
  initCurrentNav();
  initHotspots();
  initQuoteCards();
  initQuoteReveal();
  initPortraitReveal();
  initScrollers();
  initSliders();
  initTabArrows();
  initApproachAccordion();
  initSearch();
  initStickyHeader();
});
