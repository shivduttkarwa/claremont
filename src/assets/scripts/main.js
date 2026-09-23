/**
 * Site entry — bundled by esbuild into dist/assets/js/main.js
 */
import "bootstrap/js/dist/offcanvas";
import { Anim } from "./anim.js";
import { initCurrentNav, initHotspots, initScrollers, initTabArrows } from "./ui.js";
import { initSearch } from "./search.js";
import { initSliders } from "./slider.js";

document.addEventListener("DOMContentLoaded", () => {
  Anim.init();
  initCurrentNav();
  initHotspots();
  initScrollers();
  initSliders();
  initTabArrows();
  initSearch();
});
