// buttons — ink bloom: a button's hover colour floods in from where the pointer enters and drains out where it leaves,
// and a click throws a few flecks of ink from the pointer. The ink is built on first contact, so the markup stays as authored until then.
const SELECTOR = ".btn, .arrow-btn";
const DRAIN = 750; // ms, --duration-ink
const FLECKS = 12;

export function initButtons() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const leftAt = new WeakMap();
  let pressed = null;

  const find = (event) => event.target.closest?.(SELECTOR);
  const inert = (btn) => btn.matches(":disabled, .disabled, .is-disabled");

  const enhance = (btn) => {
    if (btn.classList.contains("has-ink")) return;
    const icon = btn.classList.contains("arrow-btn") && btn.querySelector(".icon");
    if (icon) {
      const glyph = document.createElement("span");
      glyph.className = "arrow-btn__glyph";
      icon.replaceWith(glyph);
      const twin = icon.cloneNode(true);
      twin.setAttribute("aria-hidden", "true");
      glyph.append(icon, twin);
    }
    // a copy of the content in the hover colours, revealed by the ink's circle
    const ink = document.createElement("span");
    ink.className = "btn__ink";
    ink.setAttribute("aria-hidden", "true");
    btn.childNodes.forEach((node) => ink.append(node.cloneNode(true)));
    btn.append(ink);
    btn.classList.add("has-ink");
  };

  const at = (btn, x, y) => {
    const box = btn.getBoundingClientRect();
    btn.style.setProperty("--ink-x", `${x - box.left}px`);
    btn.style.setProperty("--ink-y", `${y - box.top}px`);
  };

  const enter = (btn, event) => {
    if (inert(btn)) return;
    enhance(btn);
    // a fresh bloom starts at the pointer; one still draining grows back from where it is
    if (performance.now() - (leftAt.get(btn) ?? -Infinity) > DRAIN) {
      btn.classList.add("is-placing");
      at(btn, event.clientX, event.clientY);
      btn.getBoundingClientRect();
      btn.classList.remove("is-placing");
    } else at(btn, event.clientX, event.clientY);
    btn.classList.add("is-inked");
  };

  const leave = (btn, event) => {
    if (!btn.classList.contains("is-inked")) return;
    at(btn, event.clientX, event.clientY);
    btn.classList.remove("is-inked");
    leftAt.set(btn, performance.now());
  };

  const splash = (btn, x, y) => {
    if (reduced.matches) return;
    const style = getComputedStyle(btn);
    const colours = [style.getPropertyValue("--btn-fleck-a").trim(), style.getPropertyValue("--btn-fleck-b").trim()];
    const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
    const layer = document.createElement("span");
    layer.className = "btn-splash";
    layer.setAttribute("aria-hidden", "true");
    layer.style.left = `${x}px`;
    layer.style.top = `${y}px`;
    document.body.append(layer);
    const done = [];
    for (let i = 0; i < FLECKS; i++) {
      const fleck = document.createElement("span");
      const angle = (i / FLECKS) * Math.PI * 2 + Math.random() * 0.45;
      const distance = (28 + Math.random() * 30) * unit;
      const size = (4 + Math.random() * 5) * unit;
      fleck.style.width = fleck.style.height = `${size}px`;
      fleck.style.background = colours[i % 2];
      layer.append(fleck);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      done.push(fleck.animate(
        [
          { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3) rotate(${90 + Math.random() * 180}deg)`, opacity: 0 },
        ],
        { duration: 520 + Math.random() * 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      ).finished);
    }
    Promise.allSettled(done).then(() => layer.remove());
  };

  document.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse") return;
    const btn = find(event);
    if (btn && !btn.contains(event.relatedTarget)) enter(btn, event);
  });
  document.addEventListener("pointerout", (event) => {
    const btn = find(event);
    if (btn && !btn.contains(event.relatedTarget)) leave(btn, event);
  });

  document.addEventListener("focusin", (event) => {
    const btn = find(event);
    if (!btn || inert(btn) || !btn.matches(":focus-visible")) return;
    enhance(btn);
    btn.style.setProperty("--ink-x", "50%");
    btn.style.setProperty("--ink-y", "50%");
    btn.getBoundingClientRect();
    btn.classList.add("is-inked");
  });
  document.addEventListener("focusout", (event) => {
    const btn = find(event);
    if (btn && !btn.matches(":hover")) btn.classList.remove("is-inked");
  });

  // a mouse splashes on press; a tap waits for the click, so a scroll that starts on a button does not splash
  document.addEventListener("pointerdown", (event) => {
    const btn = find(event);
    pressed = btn && event.pointerType === "mouse" && event.button === 0 && !inert(btn) ? btn : null;
    if (pressed) splash(btn, event.clientX, event.clientY);
  });
  document.addEventListener("click", (event) => {
    const btn = find(event);
    const splashed = pressed;
    pressed = null;
    if (!btn || btn === splashed || !event.isTrusted || inert(btn)) return;
    if (event.detail) return splash(btn, event.clientX, event.clientY);
    const box = btn.getBoundingClientRect();
    splash(btn, box.left + box.width / 2, box.top + box.height / 2);
  });
}
