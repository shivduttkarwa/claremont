// pan — a row of cards drifts slowly to the left on desktop (the view pans left to right), each card wrapping round as it leaves;
// the arrows step it a card, the pointer pauses it, and below lg the row is the Swiper carousel (data-slider-below-lg)
import { gsap } from "gsap";

const CARD_SECONDS = 7; // one card width of drift
const STEP = { duration: 0.9, ease: "power2.out" };

export function initPan(root = document) {
  const lg = window.matchMedia("(min-width: 992px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  root.querySelectorAll("[data-pan]").forEach((section) => {
    const track = section.querySelector("[data-pan-track]");
    if (!track) return;
    const cards = [...track.children];
    const set = cards.map((card) => gsap.quickSetter(card, "x", "px"));
    const state = { travel: 0, step: 0 };
    let width = 0;
    let paused = false;
    let running = false;

    // whole pixels, or a fractional card edge shows a flickering hairline; --pan-card on the section is read at every width so the Swiper snaps too
    const measure = () => {
      section.style.removeProperty("--pan-card");
      width = Math.round(cards[0].getBoundingClientRect().width);
      section.style.setProperty("--pan-card", `${width}px`);
    };
    // each card sits in its slot moved left by the drift, wrapped so it comes back in from the right
    const render = () => {
      const period = width * cards.length;
      const shift = state.travel + state.step;
      cards.forEach((card, i) => {
        const slot = i * width;
        const x = ((slot - shift + width) % period + period) % period - width;
        set[i](Math.round(x - slot));
      });
    };
    const tick = (time, delta) => {
      if (!paused && !reduced.matches) state.travel += (width / CARD_SECONDS) * (delta / 1000);
      render();
    };
    const start = () => {
      if (running) return;
      running = true;
      measure();
      gsap.ticker.add(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
      gsap.set(cards, { clearProps: "transform" });
    };
    // after Swiper has built or torn down on the same change
    const sync = () => requestAnimationFrame(() => (lg.matches ? start() : stop()));
    lg.addEventListener("change", sync);
    window.addEventListener("resize", measure);

    const hover = section.querySelector("[data-pan-hover]") || track;
    hover.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") paused = true; });
    hover.addEventListener("pointerleave", () => { paused = false; });

    const stepBy = (dir) => {
      if (!running) return;
      gsap.to(state, { step: state.step + dir * width, ...STEP, duration: reduced.matches ? 0 : STEP.duration, overwrite: true, onUpdate: render });
    };
    section.querySelector("[data-slider-prev]")?.addEventListener("click", () => stepBy(-1));
    section.querySelector("[data-slider-next]")?.addEventListener("click", () => stepBy(1));

    measure();
    sync();
  });
}
