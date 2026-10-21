// The browser's validation bubble in the site's own dress: a form with data-form-validate takes novalidate, and on
// submit the first empty or malformed field gets a tip under its rule (data-error; data-error-format for a value that
// is typed but malformed) and the focus, as the browser does. The tip goes as the field is typed in, when it loses
// focus, on Escape, or after a few seconds.

const HIDE_AFTER = 6000;
let open = null;

function message(field) {
  const v = field.validity;
  if (v.valueMissing) return field.dataset.error || "Please fill in this field.";
  if (v.typeMismatch || v.patternMismatch) return field.dataset.errorFormat || field.dataset.error || "Please check this field.";
  return field.validationMessage;
}

function describe(field, id, on) {
  const ids = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter((x) => x && x !== id);
  if (on) ids.push(id);
  if (ids.length) field.setAttribute("aria-describedby", ids.join(" "));
  else field.removeAttribute("aria-describedby");
}

function hide() {
  if (!open) return;
  const { field, tip, timer } = open;
  open = null;
  clearTimeout(timer);
  field.removeAttribute("aria-invalid");
  describe(field, tip.id, false);
  tip.classList.remove("is-shown");
  const drop = () => tip.remove();
  tip.addEventListener("transitionend", drop, { once: true });
  setTimeout(drop, 600); // reduced motion has no transition to end
}

function show(field) {
  hide();
  const tip = document.createElement("div");
  tip.className = "form-tip";
  tip.id = `${field.id}-tip`;
  tip.setAttribute("role", "alert");
  tip.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-warning"></use></svg><span></span>';
  tip.lastChild.textContent = message(field);
  field.insertAdjacentElement("afterend", tip);
  field.setAttribute("aria-invalid", "true");
  describe(field, tip.id, true);
  open = { field, tip, timer: setTimeout(hide, HIDE_AFTER) };
  void tip.offsetWidth; // the hidden state is laid out before the class changes it, or the entrance has nothing to run from
  tip.classList.add("is-shown");
  field.focus();
}

export function initForms(root = document) {
  root.querySelectorAll("form[data-form-validate]").forEach((form) => {
    form.setAttribute("novalidate", "");
    const fields = [...form.querySelectorAll("input, textarea, select")].filter((f) => f.id && f.willValidate);

    fields.forEach((field) => {
      const mine = () => open && open.field === field;
      field.addEventListener("input", () => { if (mine()) hide(); });
      field.addEventListener("blur", () => { if (mine()) hide(); });
      field.addEventListener("keydown", (event) => { if (event.key === "Escape" && mine()) hide(); });
    });

    form.addEventListener("submit", (event) => {
      const bad = fields.find((field) => !field.checkValidity());
      if (!bad) return;
      event.preventDefault();
      show(bad);
    });
  });
}
