/**
 * anim — animation system
 * Window-native Lenis smooth scroll + GSAP ScrollTrigger reveal / split / parallax,
 * driven entirely by data-anim-* attributes. See references/anim-api.md.
 */
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const DEFAULTS = {
  duration: 0.7,
  ease: "power1.out",
  stagger: 0.1,
  lenis: { duration: 1.2, smoothWheel: true, wheelMultiplier: 0.8, touchMultiplier: 1.5 },
};

// Every preset fades (autoAlpha) so the CSS FOUC guard works uniformly.
const REVEAL = {
  "fade-up":    { from: { y: 30, autoAlpha: 0 },                to: { y: 0, autoAlpha: 1 } },
  "fade":       { from: { autoAlpha: 0 },                       to: { autoAlpha: 1 } },
  "from-left":  { from: { x: "-15%", autoAlpha: 0 },            to: { x: "0%", autoAlpha: 1 } },
  "from-right": { from: { x: "15%", autoAlpha: 0 },             to: { x: "0%", autoAlpha: 1 } },
  "scale":      { from: { scale: 1.12, autoAlpha: 0 },          to: { scale: 1, autoAlpha: 1, duration: 1.1, ease: "power4.out" } },
  "scale-x":    { from: { scaleX: 0, autoAlpha: 0 },            to: { scaleX: 1, autoAlpha: 1, duration: 1.2, ease: "power4.inOut" } },
  "scale-y":    { from: { scaleY: 0, autoAlpha: 0 },            to: { scaleY: 1, autoAlpha: 1, duration: 1.2, ease: "power4.inOut" } },
  "clip":       { from: { "--anim-clip": "100%", autoAlpha: 0 }, to: { "--anim-clip": "0%", autoAlpha: 1, duration: 1.1, ease: "power3.out" } },
};

const TIER_START = {
  default: "top bottom-=100",
  secondary: "top bottom-=50",
  hero: "top bottom",
};

const BOUND = "data-anim-bound"; // marks an element as already initialised

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const attr = (el, name, fallback = null) =>
  el.hasAttribute(name) ? el.getAttribute(name) : fallback;

// Collect matching elements under `root` (incl. root itself) that aren't bound yet.
function scoped(root, selector) {
  const list = Array.from(root.querySelectorAll(selector));
  if (root.matches && root.matches(selector)) list.unshift(root);
  return list.filter((el) => !el.hasAttribute(BOUND));
}
const bind = (el) => el.setAttribute(BOUND, "");

let lenis = null;
let started = false;

function initScroll(opts) {
  lenis = new Lenis({ ...DEFAULTS.lenis, ...(opts.lenis || {}) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// data-anim-group -> tag direct children as staggered reveals (auto ordering)
function expandGroups(root) {
  scoped(root, "[data-anim-group]").forEach((group) => {
    const type = group.getAttribute("data-anim-group") || "fade-up";
    Array.from(group.children).forEach((child, i) => {
      if (child.hasAttribute("data-anim")) return;
      child.setAttribute("data-anim", "reveal");
      child.setAttribute("data-anim-type", type);
      if (!child.hasAttribute("data-anim-order"))
        child.setAttribute("data-anim-order", String(i));
    });
    bind(group);
  });
}

function setupReveals(root) {
  const els = scoped(root, '[data-anim="reveal"]');
  if (!els.length) return;
  const byTier = {};
  els.forEach((el) => {
    const preset = REVEAL[attr(el, "data-anim-type", "fade-up")] || REVEAL["fade-up"];
    gsap.set(el, preset.from);
    bind(el);
    const tier = attr(el, "data-anim-tier", "default");
    (byTier[tier] ||= []).push(el);
  });
  Object.entries(byTier).forEach(([tier, group]) => {
    ScrollTrigger.batch(group, {
      start: TIER_START[tier] || TIER_START.default,
      once: true,
      onEnter: (batch) => batch.forEach(playReveal),
    });
  });
}

function playReveal(el, i) {
  const preset = REVEAL[attr(el, "data-anim-type", "fade-up")] || REVEAL["fade-up"];
  const order = el.hasAttribute("data-anim-order")
    ? parseFloat(el.getAttribute("data-anim-order"))
    : i;
  gsap.to(el, {
    ...preset.to,
    duration: preset.to.duration || DEFAULTS.duration,
    ease: preset.to.ease || DEFAULTS.ease,
    delay: order * DEFAULTS.stagger,
    onComplete: () => el.classList.add("is-revealed"),
  });
}

function setupSplits(root) {
  scoped(root, '[data-anim="split"]').forEach((el) => {
    bind(el);
    const isChars = attr(el, "data-anim-type", "lines") === "chars";
    const split = new SplitText(el, {
      type: isChars ? "chars,lines" : "lines",
      linesClass: "anim-line",
      charsClass: "anim-char",
      mask: "lines",
      tag: "span",
    });
    const targets = isChars ? split.chars : split.lines;
    gsap.set(el, { autoAlpha: 1 });       // reveal container (FOUC guard)
    gsap.set(targets, { y: 30, autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: el,
      start: TIER_START[attr(el, "data-anim-tier", "default")] || TIER_START.default,
      once: true,
      onEnter: () =>
        gsap.to(targets, {
          y: 0,
          autoAlpha: 1,
          duration: isChars ? 0.4 : 0.6,
          ease: DEFAULTS.ease,
          stagger: isChars ? (targets.length < 10 ? 0.1 : 0.05) : 0.1,
        }),
    });
  });
}

function setupParallax(root) {
  scoped(root, '[data-anim="parallax"]').forEach((el) => {
    bind(el);
    if (el.hasAttribute("data-anim-disable-mobile") && window.innerWidth < 992) return;
    const axis = attr(el, "data-anim-axis", "y");
    const speed = parseFloat(attr(el, "data-anim-speed", "0")) || 0;
    const reverse = el.hasAttribute("data-anim-reverse");
    const scaleAttr = attr(el, "data-anim-scale", null);
    const scrubAttr = attr(el, "data-anim-scrub", null);
    const trigger = el.closest("[data-anim-parallax-trigger]") || el;
    const dir = reverse ? -1 : 1;

    const vars = { ease: "none" };
    if (axis === "y") vars.yPercent = speed * dir;
    if (axis === "x") vars.xPercent = speed * dir;
    if (scaleAttr) vars.scale = parseFloat(scaleAttr);

    gsap.to(el, {
      ...vars,
      scrollTrigger: {
        trigger,
        start: attr(el, "data-anim-start", "top bottom"),
        end: attr(el, "data-anim-end", "bottom top"),
        scrub: scrubAttr === null ? 1 : scrubAttr === "" ? true : parseFloat(scrubAttr),
      },
    });
  });
}

function setupAll(root) {
  expandGroups(root);
  setupReveals(root);
  setupSplits(root);
  setupParallax(root);
}

function revealEverything() {
  gsap.utils
    .toArray('[data-anim="reveal"], [data-anim="split"]')
    .forEach((el) => gsap.set(el, { clearProps: "all" }));
  document.documentElement.classList.add("anim-reduced");
}

const Anim = {
  lenis: null,

  init(opts = {}) {
    if (started) return this;
    started = true;
    document.documentElement.classList.add("anim-ready");

    if (reduced()) {
      document.documentElement.classList.add("anim-reduced");
      return this;
    }
    try {
      initScroll(opts);
      this.lenis = lenis;
      setupAll(document);
      ScrollTrigger.refresh();
      window.addEventListener("load", () => ScrollTrigger.refresh());
    } catch (err) {
      console.error("[anim] init failed — revealing content", err);
      revealEverything();
    }
    return this;
  },

  // Initialise animations on content added AFTER init (e.g. load-more / AJAX).
  // Pass the inserted container (or a selector). Already-bound elements are skipped.
  add(container = document) {
    if (reduced()) return this;
    const root =
      typeof container === "string" ? document.querySelector(container) : container;
    if (!root) return this;
    try {
      setupAll(root);
      ScrollTrigger.refresh();
    } catch (err) {
      console.error("[anim] add() failed", err);
    }
    return this;
  },

  refresh() { ScrollTrigger.refresh(); return this; },
  stop() { lenis && lenis.stop(); return this; },
  start() { lenis && lenis.start(); return this; },
};

if (typeof window !== "undefined") window.Anim = Anim;

export { Anim };
export default Anim;
