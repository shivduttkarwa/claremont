/**
 * Site entry — bundled by esbuild into dist/assets/js/main.js
 */
import "bootstrap/js/dist/offcanvas";
import { Anim } from "./anim.js";
import { initApproachAccordion, initCurrentNav, initFolds, initHotspots, initMenu, initPlaceholderLinks, initQuoteCards, initScrollers, initStickyHeader, initSubnavTuck, initTabArrows } from "./ui.js";
import { initSearch } from "./search.js";
import { initSliders } from "./slider.js";
import { initPan } from "./pan.js";
import { initPageTransition } from "./transition.js";
import { initImageCarousels } from "./carousel.js";
import { initLoadMore } from "./news.js";
import { initForms } from "./form.js";

document.addEventListener("DOMContentLoaded", () => {
  Anim.init({ after: window.__pageArrival });
  initCurrentNav();
  initPlaceholderLinks();
  initHotspots();
  initQuoteCards();
  initScrollers();
  initPan(); // before the sliders: the snapped card width must be in place when Swiper measures
  initSliders();
  initTabArrows();
  initApproachAccordion();
  initFolds();
  initImageCarousels();
  initLoadMore();
  initForms();
  initSearch();
  initStickyHeader();
  initSubnavTuck();
  initMenu();
  initPageTransition();
});
