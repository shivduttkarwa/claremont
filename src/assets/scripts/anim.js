/**
 * anim — animation system
 * Window-native Lenis smooth scroll + GSAP ScrollTrigger reveal / split / sequence / parallax,
 * driven entirely by data-anim-* attributes. See references/anim-api.md.
 *
 * Tiers: "default" and "secondary" play when they scroll into view. "hero" is the page entrance:
 * every hero-tier element joins one timeline on load, stepping through data-anim-order (0 first);
 * elements that share an order start together and each step starts as the previous one lands
 * (data-anim-lead = seconds before the previous step ends; the default is DEFAULTS.entranceLead).
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
  entranceLead: 0.4, // an entrance step starts this long before the previous one ends
  lenis: { duration: 1.2, smoothWheel: true, wheelMultiplier: 0.8, touchMultiplier: 1.5 },
};

// Every preset fades (autoAlpha) so the CSS FOUC guard works uniformly.
const REVEAL = {
  "fade-up":    { from: { y: 30, autoAlpha: 0 },                to: { y: 0, autoAlpha: 1 } },
  "fade":       { from: { autoAlpha: 0 },                       to: { autoAlpha: 1 } },
  "from-left":  { from: { x: "-15%", autoAlpha: 0 },            to: { x: "0%", autoAlpha: 1 } },
  "from-right": { from: { x: "15%", autoAlpha: 0 },             to: { x: "0%", autoAlpha: 1 } },
  "drop":       { from: { y: -48, autoAlpha: 0 },               to: { y: 0, autoAlpha: 1, duration: 0.9, ease: "back.out(1.4)" } },
  "scale":      { from: { scale: 1.12, autoAlpha: 0 },          to: { scale: 1, autoAlpha: 1, duration: 1.1, ease: "power4.out" } },
  "scale-x":    { from: { scaleX: 0, autoAlpha: 0 },            to: { scaleX: 1, autoAlpha: 1, duration: 1.2, ease: "power4.inOut" } },
  "scale-y":    { from: { scaleY: 0, autoAlpha: 0 },            to: { scaleY: 1, autoAlpha: 1, duration: 1.2, ease: "power4.inOut" } },
  "clip":       { from: { "--anim-clip": "100%", autoAlpha: 0 }, to: { "--anim-clip": "0%", autoAlpha: 1, duration: 1.1, ease: "power3.out" } },
};

// Split text: characters slide up one after another; lines rise out of a mask.
const SPLIT = {
  chars: { from: { y: 50, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1, duration: 0.3, ease: "power1.inOut", stagger: 0.03 } },
  lines: { from: { y: 30, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1, duration: 0.6, ease: "power1.out", stagger: 0.1 } },
};

const TIER_START = {
  default: "top bottom-=100",
  secondary: "top bottom-=50",
};
const HERO = "hero";

const BOUND = "data-anim-bound"; // marks an element as already initialised

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const attr = (el, name, fallback = null) =>
  el.hasAttribute(name) ? el.getAttribute(name) : fallback;

const number = (el, name, fallback) => {
  const value = parseFloat(attr(el, name, ""));
  return Number.isNaN(value) ? fallback : value;
};

const tierOf = (el) => attr(el, "data-anim-tier", "default");
const orderOf = (el, fallback = 0) => number(el, "data-anim-order", fallback);
const leadOf = (el) => number(el, "data-anim-lead", DEFAULTS.entranceLead);
const presetOf = (el) => REVEAL[attr(el, "data-anim-type", "fade-up")] || REVEAL["fade-up"];

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

// A step is { targets, vars } ready to tween, or { build, duration } when it can only be
// prepared at play time (text splits, which need the final font on screen).
const tweenOf = (step) => (step.build ? step.build() : step);

// Hero-tier steps join the entrance timeline; the rest play once they scroll into view.
function play(el, step, entrance) {
  if (tierOf(el) === HERO) {
    entrance.push({ order: orderOf(el), lead: leadOf(el), ...step });
    return;
  }
  ScrollTrigger.create({
    trigger: el,
    start: TIER_START[tierOf(el)] || TIER_START.default,
    once: true,
    onEnter: () => {
      const { targets, vars } = tweenOf(step);
      gsap.to(targets, { ...vars, delay: orderOf(el) * DEFAULTS.stagger });
    },
  });
}

function playEntrance(steps) {
  if (!steps.length) return;
  const tl = gsap.timeline();
  [...new Set(steps.map((step) => step.order))]
    .sort((a, b) => a - b)
    .forEach((order, i) => {
      const group = steps.filter((step) => step.order === order);
      const lead = Math.max(...group.map((step) => step.lead));
      const at = i ? Math.max(0, tl.duration() - lead) : 0;
      group.forEach((step) => {
        if (!step.build) {
          tl.to(step.targets, step.vars, at);
          return;
        }
        tl.call(() => {
          const { targets, vars } = step.build();
          gsap.to(targets, vars);
        }, [], at);
        tl.to({}, { duration: step.duration }, at); // holds the slot so the next step waits for it
      });
    });
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

function revealStep(el) {
  const preset = presetOf(el);
  return {
    targets: el,
    vars: {
      ...preset.to,
      duration: preset.to.duration || DEFAULTS.duration,
      ease: preset.to.ease || DEFAULTS.ease,
      onComplete: () => el.classList.add("is-revealed"),
    },
  };
}

function setupReveals(root, entrance) {
  const byTier = {};
  scoped(root, '[data-anim="reveal"]').forEach((el) => {
    bind(el);
    gsap.set(el, presetOf(el).from);
    const tier = tierOf(el);
    if (tier === HERO) play(el, revealStep(el), entrance);
    else (byTier[tier] ||= []).push(el);
  });
  Object.entries(byTier).forEach(([tier, group]) => {
    ScrollTrigger.batch(group, {
      start: TIER_START[tier] || TIER_START.default,
      once: true,
      onEnter: (batch) =>
        batch.forEach((el, i) => {
          const step = revealStep(el);
          gsap.to(step.targets, { ...step.vars, delay: orderOf(el, i) * DEFAULTS.stagger });
        }),
    });
  });
}

// Left edge of every non-blank glyph while the text is still one kerned run.
function glyphLefts(el) {
  const lefts = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent;
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) continue;
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      lefts.push(range.getBoundingClientRect().left);
    }
  }
  return lefts;
}

// Boxing each character loses the kerning between pairs; nudge every box back to where its glyph sat.
function keepKerning(chars, lefts) {
  if (chars.length !== lefts.length) return;
  chars.forEach((char, i) => {
    const nudge = lefts[i] - char.getBoundingClientRect().left;
    if (Math.abs(nudge) > 0.01) char.style.marginLeft = `${nudge}px`;
  });
}

function setupSplits(root, entrance) {
  scoped(root, '[data-anim="split"]').forEach((el) => {
    bind(el);
    const isChars = attr(el, "data-anim-type", "lines") === "chars";
    const preset = isChars ? SPLIT.chars : SPLIT.lines;
    const count = isChars
      ? el.textContent.replace(/\s/g, "").length
      : Math.max(1, Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)) || 1);
    play(el, {
      duration: preset.to.duration + preset.to.stagger * Math.max(0, count - 1),
      build: () => {
        const lefts = isChars ? glyphLefts(el) : null;
        const split = new SplitText(
          el,
          isChars
            ? { type: "chars", charsClass: "anim-char" }
            : { type: "lines", linesClass: "anim-line", mask: "lines", tag: "span" }
        );
        const targets = isChars ? split.chars : split.lines;
        if (lefts) keepKerning(targets, lefts);
        gsap.set(el, { autoAlpha: 1 }); // the container shows; its pieces carry the hidden state
        gsap.set(targets, preset.from);
        return {
          targets,
          vars: {
            ...preset.to,
            // the original markup comes back once it has played, so the audited layout is untouched
            onComplete: () => {
              el.classList.add("is-revealed");
              split.revert();
            },
          },
        };
      },
    }, entrance);
  });
}

// data-anim="sequence": one tween over the marked descendants (data-anim-item), staggered in DOM order.
// Items are cleared on completion so their own hover transitions keep working afterwards.
function setupSequences(root, entrance) {
  scoped(root, '[data-anim="sequence"]').forEach((el) => {
    bind(el);
    const items = Array.from(el.querySelectorAll("[data-anim-item]")).filter((item) => item.getClientRects().length);
    if (!items.length) {
      el.classList.add("is-revealed");
      return;
    }
    const preset = presetOf(el);
    // a CSS transition on an item would smear every frame of the tween, so it is paused until the end
    gsap.set(items, { ...preset.from, transition: "none" });
    play(el, {
      targets: items,
      vars: {
        ...preset.to,
        duration: preset.to.duration || DEFAULTS.duration,
        ease: preset.to.ease || DEFAULTS.ease,
        stagger: number(el, "data-anim-stagger", 0) || DEFAULTS.stagger,
        onComplete: () => {
          el.classList.add("is-revealed");
          gsap.set(items, { clearProps: "all" });
        },
      },
    }, entrance);
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
  const entrance = [];
  expandGroups(root);
  setupReveals(root, entrance);
  setupSplits(root, entrance);
  setupSequences(root, entrance);
  setupParallax(root);
  playEntrance(entrance);
}

function revealEverything() {
  gsap.utils
    .toArray('[data-anim="reveal"], [data-anim="split"], [data-anim="sequence"] [data-anim-item]')
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
