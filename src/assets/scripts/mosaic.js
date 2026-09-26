// mosaic assembly — each tile's outline draws like a plan, then its panel or photo floods in along it and the copy settles
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ROW_SPREAD = 0.45; // seconds from the first tile in a row to the last, so each row runs left to right

function assemble(cell) {
  return gsap
    .timeline({
      paused: true,
      onComplete: () => {
        cell.classList.remove("is-assembling");
        gsap.set(cell, { clearProps: "--draw,--fill,--develop,--settle" });
      },
    })
    .to(cell, { "--draw": 1, duration: 0.8, ease: "power2.inOut" }, 0)
    .to(cell, { "--fill": 1, duration: 0.9, ease: "power3.inOut" }, 0.55)
    .to(cell, { "--develop": 1, duration: 1.2, ease: "power2.out" }, 0.9)
    .to(cell, { "--settle": 1, duration: 0.7, ease: "power3.out" }, 1.1);
}

export function initMosaicAssembly() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("[data-mosaic-assemble]").forEach((grid) => {
    const cells = Array.from(grid.querySelectorAll(".mosaic__cell"));
    const box = grid.getBoundingClientRect();
    cells.forEach((cell) => {
      const across = gsap.utils.clamp(0, 1, (cell.getBoundingClientRect().left - box.left) / box.width);
      const tl = assemble(cell);
      cell.classList.add("is-assembling");
      gsap.set(cell, { "--draw": 0, "--fill": 0, "--develop": 0, "--settle": 0 });
      ScrollTrigger.create({
        trigger: cell,
        start: "top 88%",
        once: true,
        onEnter: () => gsap.delayedCall(across * ROW_SPREAD, () => tl.play()),
      });
    });
  });
}
