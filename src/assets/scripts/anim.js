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
  spread: 0.6, // the longest a batch of staggered reveals may run in total
  entranceLead: 0.4, // an entrance step starts this long before the previous one ends
  lenis: { duration: 1.2, smoothWheel: true, wheelMultiplier: 0.8, touchMultiplier: 1.5 },
};

// Every preset fades (autoAlpha) so the CSS FOUC guard works uniformly.
const REVEAL = {
  "fade-up":    { from: { y: 30, autoAlpha: 0 },                to: { y: 0, autoAlpha: 1 } },
  "fade":       { from: { autoAlpha: 0 },                       to: { autoAlpha: 1 } },
  "fade-soft":  { from: { autoAlpha: 0 },                       to: { autoAlpha: 1, duration: 0.5, ease: "power1.out" } }, // header items
  "from-left":  { from: { x: "-15%", autoAlpha: 0 },            to: { x: "0%", autoAlpha: 1 } },
  "from-right": { from: { x: "15%", autoAlpha: 0 },             to: { x: "0%", autoAlpha: 1 } },
  "enter-right": { from: { x: "110%", autoAlpha: 0 },           to: { x: "0%", autoAlpha: 1, duration: 0.9, ease: "expo.out" } },
  "nudge-right": { from: { x: 40, autoAlpha: 0 },               to: { x: 0, autoAlpha: 1 } },
  "swing-in":   { from: { xPercent: 92, yPercent: -145, rotation: 90, autoAlpha: 0 }, to: { xPercent: 0, yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out" } },
  "drop":       { from: { y: -48, autoAlpha: 0 },               to: { y: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.4)" } },
  "pop":        { from: { scale: 0, autoAlpha: 0 },             to: { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(2)" } },
  "wipe-right": { from: { clipPath: "inset(0% 100% 0% 0%)", x: -12, autoAlpha: 0 }, to: { clipPath: "inset(0% 0% 0% 0%)", x: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out" } },
  // a crisp wipe from the bottom edge up, no fade: visibility flips as the tween starts
  "wipe-up":    { from: { clipPath: "inset(100% 0% 0% 0%)", visibility: "hidden" }, to: { clipPath: "inset(0% 0% 0% 0%)", visibility: "inherit", duration: 1.1, ease: "power3.out" } },
  "scale":      { from: { scale: 1.12, autoAlpha: 0 },          to: { scale: 1, autoAlpha: 1, duration: 1.1, ease: "power4.out" } },
  "scale-x":    { from: { scaleX: 0, autoAlpha: 0 },            to: { scaleX: 1, autoAlpha: 1, duration: 1.2, ease: "power4.inOut" } },
  "scale-y":    { from: { scaleY: 0, autoAlpha: 0 },            to: { scaleY: 1, autoAlpha: 1, duration: 1.2, ease: "power4.inOut" } },
  "clip":       { from: { "--anim-clip": "100%", autoAlpha: 0 }, to: { "--anim-clip": "0%", autoAlpha: 1, duration: 1.1, ease: "power3.out" } },
};

// Split text: characters slide up one after another; lines rise out of a mask. `spread` caps how
// long the stagger may run in total, so a long title tightens its stagger instead of dragging on.
// `rise` is the distance in em of the element's font size, so a phone title rises less than the
// 1640 one (0.38em: 50 at the 131.6 hero, 23 at the 60 phone hero; 0.4em: 14 at the 35 section h2).
const SPLIT = {
  "chars":      { from: { autoAlpha: 0 }, rise: 0.38, to: { y: 0, autoAlpha: 1, duration: 0.3, ease: "power1.inOut", stagger: 0.03 }, spread: 0.9 }, // hero titles
  "chars-soft": { from: { autoAlpha: 0 }, rise: 0.4, to: { y: 0, autoAlpha: 1, duration: 0.25, ease: "power1.inOut", stagger: 0.02 }, spread: 0.5 }, // section titles
  "lines":      { from: { y: 30, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1, duration: 0.6, ease: "power1.out", stagger: 0.1 } },
};

// Scroll tiers play once the element's top is this far up the viewport; data-anim-start overrides it
// (ScrollTrigger syntax, e.g. "top 45%" for a tall block whose pieces sit low).
const TIER_START = {
  default: "top 85%",
  secondary: "top 90%",
};
const HERO = "hero";

const BOUND = "data-anim-bound"; // marks an element as already initialised
const AUTO_ORDER = "data-anim-auto-order"; // the order came from a group, not from the markup

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const attr = (el, name, fallback = null) =>
  el.hasAttribute(name) ? el.getAttribute(name) : fallback;

const number = (el, name, fallback) => {
  const value = parseFloat(attr(el, name, ""));
  return Number.isNaN(value) ? fallback : value;
};

const tierOf = (el) => attr(el, "data-anim-tier", "default");
const startOf = (el) => attr(el, "data-anim-start", TIER_START[tierOf(el)] || TIER_START.default);
// data-anim-order-mobile reorders an entrance step where the phone layout stacks things differently
const orderOf = (el, fallback = 0) =>
  window.innerWidth < 992 && el.hasAttribute("data-anim-order-mobile")
    ? number(el, "data-anim-order-mobile", fallback)
    : number(el, "data-anim-order", fallback);
const leadOf = (el) => number(el, "data-anim-lead", DEFAULTS.entranceLead);
const presetOf = (el) => REVEAL[attr(el, "data-anim-type", "fade-up")] || REVEAL["fade-up"];

// data-anim-duration / data-anim-delay let a step be timed against its neighbours
const toVars = (preset, el) => ({
  ...preset.to,
  duration: (el && number(el, "data-anim-duration", 0)) || preset.to.duration || DEFAULTS.duration,
  delay: (el && number(el, "data-anim-delay", 0)) || 0,
  ease: preset.to.ease || DEFAULTS.ease,
});

// Collect matching elements under `root` (incl. root itself) that aren't bound yet.
function scoped(root, selector) {
  const list = Array.from(root.querySelectorAll(selector));
  if (root.matches && root.matches(selector)) list.unshift(root);
  // a hidden element (a closed tab pane) is left for Anim.add() once it is shown
  return list.filter((el) => !el.hasAttribute(BOUND) && el.getClientRects().length);
}
const bind = (el) => el.setAttribute(BOUND, "");

let lenis = null;
let started = false;
let immediate = false; // add(root, { immediate }) treats every step as an entrance step
const triggers = new WeakMap(); // element -> its ScrollTrigger
const splits = new WeakMap(); // element -> its SplitText while split
const entrances = new WeakMap(); // root -> its entrance timeline

function initScroll(opts) {
  lenis = new Lenis({ ...DEFAULTS.lenis, ...(opts.lenis || {}) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// A step is { animation } — a factory that creates and starts its tween or timeline — plus
// { deferred: true, duration } when it can only be built at play time (text splits need the final font).

// Hero-tier steps join the entrance timeline; the rest play once they scroll into view.
function play(el, step, entrance) {
  if (tierOf(el) === HERO || immediate) {
    entrance.push({ order: orderOf(el), lead: leadOf(el), ...step });
    return;
  }
  triggers.set(el, ScrollTrigger.create({
    trigger: el,
    start: startOf(el),
    once: true,
    // the order stagger adds to whatever data-anim-delay already asked for
    onEnter: () => {
      const tween = step.animation();
      tween.delay(tween.delay() + orderOf(el) * DEFAULTS.stagger);
    },
  }));
}

function playEntrance(steps, root) {
  if (!steps.length) return;
  const tl = gsap.timeline();
  entrances.set(root, tl);
  [...new Set(steps.map((step) => step.order))]
    .sort((a, b) => a - b)
    .forEach((order, i) => {
      const group = steps.filter((step) => step.order === order);
      const lead = Math.max(...group.map((step) => step.lead));
      const at = i ? Math.max(0, tl.duration() - lead) : 0;
      group.forEach((step) => {
        if (!step.deferred) {
          tl.add(step.animation(), at);
          return;
        }
        tl.call(() => step.animation(), [], at);
        tl.to({}, { duration: step.duration }, at); // holds the slot so the next step waits for it
      });
    });
}

// data-anim-group -> tag direct children as staggered reveals (auto ordering)
function expandGroups(root) {
  scoped(root, "[data-anim-group]").forEach((group) => {
    const type = group.getAttribute("data-anim-group") || "fade-up";
    Array.from(group.children).forEach((child, i) => {
      if (child.hasAttribute("data-anim") || child.hasAttribute("data-anim-item")) return; // an item belongs to its sequence
      child.setAttribute("data-anim", "reveal");
      child.setAttribute("data-anim-type", type);
      if (!child.hasAttribute("data-anim-order")) {
        child.setAttribute("data-anim-order", String(i));
        child.setAttribute(AUTO_ORDER, "");
      }
    });
    bind(group);
  });
}

const revealStep = (el) => ({
  animation: () => gsap.to(el, { ...toVars(presetOf(el), el), onComplete: () => el.classList.add("is-revealed") }),
});

// A group's auto order is only a stagger index, so it restarts with each batch; a hand-written one stays absolute.
function batchOrders(batch) {
  const auto = batch.filter((el) => el.hasAttribute(AUTO_ORDER)).map((el) => orderOf(el, 0));
  const base = auto.length ? Math.min(...auto) : 0;
  return batch.map((el, i) => orderOf(el, i) - (el.hasAttribute(AUTO_ORDER) ? base : 0));
}

function setupReveals(root, entrance) {
  const byTier = {};
  scoped(root, '[data-anim="reveal"]').forEach((el) => {
    bind(el);
    const preset = presetOf(el);
    gsap.set(el, preset.from);

    // data-anim-scrub hands the reveal to the scroll position. The trigger is an untransformed
    // ancestor, because the preset's start state has already moved the element's own box.
    if (el.hasAttribute("data-anim-scrub")) {
      const { delay, ...vars } = toVars(preset, el);
      const tween = gsap.to(el, {
        ...vars,
        scrollTrigger: {
          trigger: el.closest("[data-anim-trigger]") || el.parentElement || el,
          start: attr(el, "data-anim-start", "top 85%"),
          end: attr(el, "data-anim-end", "top 35%"),
          scrub: number(el, "data-anim-scrub", 1),
        },
      });
      if (tween.scrollTrigger) triggers.set(el, tween.scrollTrigger);
      return;
    }

    const tier = tierOf(el);
    // a custom start point needs its own trigger; the rest batch per tier
    if (tier === HERO || immediate || el.hasAttribute("data-anim-start")) play(el, revealStep(el), entrance);
    else (byTier[tier] ||= []).push(el);
  });
  Object.entries(byTier).forEach(([tier, group]) => {
    ScrollTrigger.batch(group, {
      start: TIER_START[tier] || TIER_START.default,
      once: true,
      onEnter: (batch) => {
        const orders = batchOrders(batch);
        const last = Math.max(0, ...orders);
        const step = last ? Math.min(DEFAULTS.stagger, DEFAULTS.spread / last) : 0;
        batch.forEach((el, i) => {
          const tween = revealStep(el).animation();
          tween.delay(tween.delay() + orders[i] * step);
        });
      },
    }).forEach((st) => triggers.set(st.trigger, st));
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
    const type = attr(el, "data-anim-type", "lines");
    const preset = SPLIT[type] || SPLIT.lines;
    const isChars = preset !== SPLIT.lines;
    const count = isChars
      ? el.textContent.replace(/\s/g, "").length
      : Math.max(1, Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)) || 1);
    const stagger = preset.spread ? Math.min(preset.to.stagger, preset.spread / Math.max(1, count)) : preset.to.stagger;
    play(el, {
      deferred: true,
      duration: preset.to.duration + stagger * Math.max(0, count - 1),
      animation: () => {
        const lefts = isChars ? glyphLefts(el) : null;
        // words are boxed too, so a wrapping title still breaks between words and not inside one
        const split = new SplitText(
          el,
          isChars
            ? { type: "words,chars", wordsClass: "anim-word", charsClass: "anim-char" }
            : { type: "lines", linesClass: "anim-line", mask: "lines", tag: "span" }
        );
        const targets = isChars ? split.chars : split.lines;
        if (lefts) keepKerning(targets, lefts);
        splits.set(el, split);
        gsap.set(el, { autoAlpha: 1 }); // the container shows; its pieces carry the hidden state
        const from = preset.rise ? { ...preset.from, y: parseFloat(getComputedStyle(el).fontSize) * preset.rise } : preset.from;
        gsap.set(targets, from);
        return gsap.to(targets, {
          ...preset.to,
          stagger,
          // the original markup comes back once it has played, so the audited layout is untouched
          onComplete: () => {
            el.classList.add("is-revealed");
            split.revert();
            splits.delete(el);
          },
        });
      },
    }, entrance);
  });
}

// data-anim="sequence": one timeline over the marked descendants, staggered in DOM order. An item
// inherits the container's data-anim-type unless data-anim-item names a preset of its own.
// Items are cleared on completion so their own hover transitions keep working afterwards.
function setupSequences(root, entrance) {
  scoped(root, '[data-anim="sequence"]').forEach((el) => {
    bind(el);
    // data-anim-items="children" makes the direct children the items (rich text: the CMS cannot mark each <p>)
    if (attr(el, "data-anim-items") === "children") Array.from(el.children).forEach((child) => child.setAttribute("data-anim-item", ""));
    // an item belongs to its nearest sequence, so sequences can nest (the accordion rows around the hotspots)
    const items = Array.from(el.querySelectorAll("[data-anim-item]")).filter(
      (item) => item.closest('[data-anim="sequence"]') === el && item.getClientRects().length
    );
    const mobile = window.innerWidth < 992;
    if (!items.length || (mobile && el.hasAttribute("data-anim-disable-mobile"))) {
      el.classList.add("is-revealed");
      return;
    }
    // data-anim-mobile="each": where the items stack, each one reveals on its own as it scrolls in
    if (mobile && attr(el, "data-anim-mobile") === "each") {
      el.classList.add("is-revealed");
      items.forEach((item) => {
        item.setAttribute("data-anim", "reveal");
        item.setAttribute("data-anim-type", item.getAttribute("data-anim-item") || attr(el, "data-anim-type", "fade-up"));
      });
      return;
    }
    const presetFor = (item) => REVEAL[item.getAttribute("data-anim-item")] || presetOf(el);
    const stagger = number(el, "data-anim-stagger", null) ?? DEFAULTS.stagger; // an explicit 0 plays the items together
    // a CSS transition on an item would smear every frame of the tween, so it is paused until the end
    items.forEach((item) => gsap.set(item, { ...presetFor(item).from, transition: "none" }));
    play(el, {
      animation: () => {
        const tl = gsap.timeline({
          delay: number(el, "data-anim-delay", 0),
          onComplete: () => {
            el.classList.add("is-revealed");
            gsap.set(items, { clearProps: "all" });
          },
        });
        items.forEach((item, i) => tl.to(item, toVars(presetFor(item), item), i * stagger));
        return tl;
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

// data-anim="progress" — scrubs --anim-progress from 0 to 1 as the block passes, for CSS to hang a
// growing line or any other scroll-linked state on.
function setupProgress(root) {
  scoped(root, '[data-anim="progress"]').forEach((el) => {
    bind(el);
    gsap.fromTo(
      el,
      { "--anim-progress": 0 },
      {
        "--anim-progress": 1,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: attr(el, "data-anim-start", "top 75%"),
          end: attr(el, "data-anim-end", "bottom 70%"),
          scrub: number(el, "data-anim-scrub", 0.5),
        },
      }
    );
  });
}

function setupAll(root, opts = {}) {
  const entrance = [];
  immediate = !!opts.immediate;
  try {
    expandGroups(root);
    setupSequences(root, entrance); // first: on a phone it may hand its items to setupReveals
    setupReveals(root, entrance);
    setupSplits(root, entrance);
    setupParallax(root);
    setupProgress(root);
  } finally {
    immediate = false;
  }
  playEntrance(entrance, root);
}

// Put every bound target under `root` back to its hidden start, so add() can play it again.
function resetAll(root) {
  entrances.get(root)?.kill();
  entrances.delete(root);
  const bound = Array.from(root.querySelectorAll(`[${BOUND}]`));
  if (root.hasAttribute && root.hasAttribute(BOUND)) bound.unshift(root);
  bound.forEach((el) => {
    triggers.get(el)?.kill();
    triggers.delete(el);
    const pieces = Array.from(el.querySelectorAll("[data-anim-item], .anim-char"));
    gsap.killTweensOf([el, ...pieces]);
    splits.get(el)?.revert();
    splits.delete(el);
    gsap.set([el, ...pieces], { clearProps: "all" });
    el.removeAttribute(BOUND);
    el.classList.remove("is-revealed");
  });
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
    document.documentElement.setAttribute("data-anim-live", "");

    if (reduced()) {
      document.documentElement.classList.add("anim-reduced");
      return this;
    }
    const start = () => {
      try {
        setupAll(document);
        ScrollTrigger.refresh();
      } catch (err) {
        console.error("[anim] init failed — revealing content", err);
        revealEverything();
      }
    };
    try {
      initScroll(opts);
      this.lenis = lenis;
      window.addEventListener("load", () => ScrollTrigger.refresh());
    } catch (err) {
      console.error("[anim] init failed — revealing content", err);
      revealEverything();
      return this;
    }
    // A split measured against the fallback face would nudge its glyphs to the wrong places, so the
    // entrance waits for the webfonts (briefly: a font that never arrives must not hold the page).
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 800))]).then(start, start);
    return this;
  },

  // Initialise animations on content added AFTER init (e.g. load-more / AJAX, a tab pane).
  // Pass the inserted container (or a selector). Already-bound elements are skipped.
  // { immediate: true } plays every step at once as an entrance instead of waiting for scroll.
  add(container = document, opts = {}) {
    if (reduced()) return this;
    const root =
      typeof container === "string" ? document.querySelector(container) : container;
    if (!root) return this;
    try {
      setupAll(root, opts);
      ScrollTrigger.refresh();
    } catch (err) {
      console.error("[anim] add() failed", err);
    }
    return this;
  },

  // Return a container's targets to their hidden start so add() can replay them (a tab pane re-shown).
  reset(container = document) {
    if (reduced()) return this;
    const root =
      typeof container === "string" ? document.querySelector(container) : container;
    if (!root) return this;
    try {
      resetAll(root);
    } catch (err) {
      console.error("[anim] reset() failed", err);
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
