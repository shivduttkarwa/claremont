// buttons — ink bloom: a button's hover colour floods in from where the pointer enters and drains out where it leaves.
// The ink is built on first contact, so the markup stays as authored until then.
const SELECTOR = ".btn, .arrow-btn";
const DRAIN = 750; // ms, --duration-ink

export function initButtons() {
  const leftAt = new WeakMap();

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
}
