/**
 * search — site-wide search over the build-time index (assets/search-index.js).
 * The index loads once, on first open, so it costs nothing until used.
 */

const MAX_RESULTS = 24;

const FOLD = { "’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-" };

function normalise(s) {
  return s
    .replace(/[‘’“”–—]/g, (c) => FOLD[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const escapeHtml = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function rank(query, records) {
  const q = normalise(query);
  if (!q) return [];
  const terms = q.split(" ").filter(Boolean);
  const scored = [];

  for (const r of records) {
    const heading = normalise(r.h);
    const body = normalise(r.x);
    const page = normalise(r.t);
    let score = 0;
    let matched = 0;

    for (const term of terms) {
      let s = 0;
      if (heading.startsWith(term)) s += 10;
      else if (heading.includes(term)) s += 7;
      if (page.includes(term)) s += 2;
      const at = body.indexOf(term);
      if (at >= 0) s += 3 + Math.max(0, 2 - at / 400);
      if (s > 0) matched += 1;
      score += s;
    }

    // every term has to appear somewhere, or a two-word query returns half the site
    if (matched < terms.length) continue;
    if (heading.includes(q)) score += 12;
    if (body.includes(q)) score += 6;
    score -= r.l * 0.4;
    scored.push({ record: r, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
}

function snippet(text, terms, length = 160) {
  if (!text) return "";
  const norm = normalise(text);
  let at = -1;
  for (const term of terms) {
    const i = norm.indexOf(term);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  let start = at < 0 ? 0 : Math.max(0, at - 60);
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space > -1 && space < start + 25) start = space + 1;
  }
  let cut = text.slice(start, start + length);
  if (start + length < text.length) cut = cut.replace(/\s+\S*$/, "") + "…";
  return (start > 0 ? "…" : "") + cut;
}

function highlight(text, terms) {
  const safe = escapeHtml(text);
  if (!terms.length) return safe;
  const pattern = terms
    .map((t) => escapeRe(escapeHtml(t)))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .join("|");
  if (!pattern) return safe;
  return safe.replace(new RegExp(`(${pattern})`, "gi"), "<mark>$1</mark>");
}

export function initSearch(root = document) {
  const box = root.querySelector("[data-search]");
  if (!box) return;

  const input = box.querySelector("[data-search-input]");
  const list = box.querySelector("[data-search-results]");
  const status = box.querySelector("[data-search-status]");
  const empty = box.querySelector("[data-search-empty]");
  const meta = box.querySelector("[data-search-meta]");
  const closers = box.querySelectorAll("[data-search-close]");
  const openers = root.querySelectorAll("[data-search-open]");
  if (!input || !list) return;

  let records = null;
  let loading = null;
  let failed = false;
  let results = [];
  let active = -1;
  let lastFocus = null;

  // A script tag rather than fetch(): file:// blocks cross-origin fetches, and the
  // built site is previewed from disk. Still loaded on first open, not on page load.
  const load = () => {
    if (records) return Promise.resolve(records);
    if (!loading) {
      loading = new Promise((resolve) => {
        if (window.__claremontSearch) return resolve(window.__claremontSearch.records || []);
        const tag = document.createElement("script");
        tag.src = "assets/search-index.js";
        tag.onload = () => resolve((window.__claremontSearch || {}).records || []);
        tag.onerror = () => { failed = true; resolve([]); };
        document.head.appendChild(tag);
      }).then((loaded) => {
        records = loaded;
        return records;
      });
    }
    return loading;
  };

  const setStatus = (text) => {
    if (status) status.textContent = text;
  };

  const setMeta = (text) => {
    if (meta) meta.textContent = text;
  };

  const setActive = (index) => {
    const options = list.querySelectorAll("[role='option']");
    if (!options.length) {
      active = -1;
      input.removeAttribute("aria-activedescendant");
      return;
    }
    active = (index + options.length) % options.length;
    options.forEach((el, i) => el.setAttribute("aria-selected", i === active ? "true" : "false"));
    const current = options[active];
    input.setAttribute("aria-activedescendant", current.id);
    current.scrollIntoView({ block: "nearest" });
  };

  const render = (query) => {
    const terms = normalise(query).split(" ").filter(Boolean);
    if (!terms.length) {
      list.innerHTML = "";
      list.hidden = true;
      if (empty) empty.hidden = false;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      setStatus("");
      setMeta("");
      results = [];
      active = -1;
      return;
    }

    results = rank(query, records || []);
    if (empty) empty.hidden = true;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");

    if (!results.length) {
      const message = failed
        ? "Search is unavailable right now. Please use the menu."
        : `No matches for <strong>${escapeHtml(query)}</strong>. Try a different word.`;
      list.innerHTML = `<li class="search__none" role="presentation">${message}</li>`;
      setMeta(failed ? "Unavailable" : "No results");
      setStatus(failed ? "Search is unavailable" : `No results for ${query}`);
      active = -1;
      input.removeAttribute("aria-activedescendant");
      return;
    }

    list.innerHTML = results
      .map(({ record }, i) => {
        const href = record.i ? `${record.u}#${record.i}` : record.u;
        const number = String(i + 1).padStart(2, "0");
        const text = snippet(record.x, terms);
        const trail = text ? ` &middot; ${highlight(text, terms)}` : "";
        return `<li class="search__result" role="option" id="search-result-${i}" aria-selected="false">
          <a class="search__result-link" href="${href}" tabindex="-1">
            <span class="search__result-index" aria-hidden="true">${number}</span>
            <span class="search__result-body">
              <span class="search__result-heading">${highlight(record.h, terms)}</span>
              <span class="search__result-snippet"><span class="search__result-page">${escapeHtml(record.t)}</span>${trail}</span>
            </span>
            <svg class="icon search__result-arrow" aria-hidden="true"><use href="#icon-arrow-diagonal"></use></svg>
          </a>
        </li>`;
      })
      .join("");

    setMeta(`${results.length} result${results.length === 1 ? "" : "s"}`);
    setStatus(`${results.length} result${results.length === 1 ? "" : "s"} for ${query}`);
    setActive(0);
  };

  let timer;
  const onType = () => {
    clearTimeout(timer);
    timer = setTimeout(() => load().then(() => render(input.value)), 120);
  };

  const open = () => {
    if (!box.hidden) return;
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add("has-search-open");
    load().then(() => {
      if (input.value.trim()) render(input.value);
    });
    requestAnimationFrame(() => {
      box.classList.add("is-open");
      input.focus();
      input.select();
    });
  };

  const close = () => {
    if (box.hidden) return;
    box.classList.remove("is-open");
    document.documentElement.classList.remove("has-search-open");
    const done = () => {
      box.hidden = true;
      box.removeEventListener("transitionend", done);
    };
    box.addEventListener("transitionend", done);
    setTimeout(done, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  openers.forEach((el) =>
    el.addEventListener("click", (event) => {
      event.preventDefault();
      open();
    })
  );
  closers.forEach((el) => el.addEventListener("click", close));

  input.addEventListener("input", onType);

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(active + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(active - 1);
    } else if (event.key === "Home" && results.length) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End" && results.length) {
      event.preventDefault();
      setActive(results.length - 1);
    } else if (event.key === "Enter") {
      const current = list.querySelectorAll("[role='option']")[active];
      const link = current && current.querySelector("a");
      if (link) {
        event.preventDefault();
        link.click();
      }
    }
  });

  list.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });

  box.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    // Focus stays between the field and the close button while the dialog is up
    if (event.key === "Tab") {
      const stops = [input, box.querySelector("[data-search-close]")].filter(Boolean);
      if (stops.length < 2) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      box.hidden ? open() : close();
    } else if (event.key === "/" && !typing && box.hidden) {
      event.preventDefault();
      open();
    }
  });
}
