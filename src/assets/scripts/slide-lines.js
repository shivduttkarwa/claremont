// slide-lines: as a slide comes in, its copy rises line by line out of masks; the others wait lowered
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const OUT = 160; // % of a line: far enough to take its descenders out of the mask too

export function slideLines(swiper, selector) {
  const groups = swiper.slides.map((slide) => [...slide.querySelectorAll(selector)]);
  let splits = [];
  let lines = [];
  let width = 0;
  let tl = null;
  let live = true;

  const split = () => {
    width = swiper.width;
    splits.forEach((s) => s.revert());
    splits = [];
    lines = groups.map((els) => els.map((el) => {
      const s = SplitText.create(el, { type: "lines", mask: "lines", tag: "span", linesClass: "slide-line" });
      splits.push(s);
      return s.lines;
    }));
    lines.forEach((group, i) => gsap.set(group.flat(), { yPercent: i === swiper.activeIndex ? 0 : OUT }));
    swiper.el.classList.add("has-lines");
  };

  const play = () => {
    if (!lines.length) return;
    tl?.kill();
    const group = lines[swiper.activeIndex];
    gsap.set(group.flat(), { yPercent: OUT });
    tl = gsap.timeline({ delay: 0.1 });
    group.forEach((set, k) => tl.to(set, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, k ? "-=0.7" : 0));
  };

  const lower = () => lines.forEach((group, i) => { if (i !== swiper.activeIndex) gsap.set(group.flat(), { yPercent: OUT }); });

  const resize = () => { if (lines.length && swiper.width !== width) split(); };

  swiper.on("slideChange", play);
  swiper.on("slideChangeTransitionEnd", lower);
  swiper.on("resize", resize);
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]) : Promise.resolve();
  fonts.then(() => { if (live) split(); });

  return () => {
    live = false;
    tl?.kill();
    swiper.off("slideChange", play);
    swiper.off("slideChangeTransitionEnd", lower);
    swiper.off("resize", resize);
    splits.forEach((s) => s.revert());
    swiper.el.classList.remove("has-lines");
  };
}
