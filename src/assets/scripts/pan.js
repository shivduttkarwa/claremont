// pan — a row of cards drifts slowly to the left on desktop (the view pans left to right), each card wrapping round as it leaves;
// the arrows step it a card, the pointer pauses it, a drag throws it, and below lg the row is the Swiper carousel (data-slider-below-lg)
import { gsap } from "gsap";

const CARD_SECONDS = 7; // one card width of drift
const STEP = { duration: 0.9, ease: "power2.out" };
const DRAG_START = 6; // px before a press becomes a drag, so a click on a card still clicks
const GLIDE = 1;

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
    let drag = null;
    let dragged = false;

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
    // the row holds still until its cards have wiped in, so they rise in order from the left
    const entered = () =>
      !track.hasAttribute("data-anim") || track.classList.contains("is-revealed") || document.documentElement.classList.contains("anim-reduced");
    const tick = (time, delta) => {
      if (!paused && !drag?.active && !reduced.matches && entered()) state.travel += (width / CARD_SECONDS) * (delta / 1000);
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

    const onDrag = (event) => {
      if (event.pointerId !== drag.id) return;
      if (!drag.active) {
        if (Math.abs(event.clientX - drag.x) < DRAG_START) return;
        drag.active = true;
        drag.x = event.clientX;
        drag.step = state.step;
        gsap.killTweensOf(state);
        hover.classList.add("is-dragging");
      }
      const dt = event.timeStamp - drag.t;
      if (dt > 0) drag.v = 0.8 * ((event.clientX - drag.lastX) / dt) + 0.2 * drag.v;
      drag.lastX = event.clientX;
      drag.t = event.timeStamp;
      state.step = drag.step - (event.clientX - drag.x);
    };
    const endDrag = (event) => {
      if (event.pointerId !== drag.id) return;
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      const { active, v, t } = drag;
      drag = null;
      if (!active) return;
      hover.classList.remove("is-dragging");
      dragged = true;
      setTimeout(() => { dragged = false; });
      // px per ms; a pointer held still before letting go does not throw
      const speed = event.timeStamp - t > 100 ? 0 : gsap.utils.clamp(-4, 4, v);
      if (!speed || reduced.matches) return;
      // power3.out leaves at three times its average speed, so the glide starts at the release speed
      gsap.to(state, { step: state.step - (speed * GLIDE * 1000) / 3, duration: GLIDE, ease: "power3.out", overwrite: true });
    };
    hover.addEventListener("pointerdown", (event) => {
      if (!running || drag || !event.isPrimary || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, lastX: event.clientX, t: event.timeStamp, v: 0, step: 0, active: false };
      window.addEventListener("pointermove", onDrag);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    });
    // a drag must not also follow a card's link, pick up its photo or select its quote
    hover.addEventListener("click", (event) => {
      if (dragged) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    hover.addEventListener("dragstart", (event) => { if (running) event.preventDefault(); });
    hover.addEventListener("selectstart", (event) => { if (running) event.preventDefault(); });

    measure();
    sync();
  });
}
