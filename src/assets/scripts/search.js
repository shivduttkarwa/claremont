/**
 * search — the overlay drawn in Figma 2125:14070 / 2125:14365.
 * Wagtail will own the results (the form GETs `q` to its search view). Until then this stand-in
 * intercepts submit and lists matches from the build-time index (assets/search-index.js), which
 * loads once, on first open.
 */
import Offcanvas from "bootstrap/js/dist/offcanvas";
import { Anim } from "./anim.js";

const MAX_RESULTS = 20;

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

function snippet(text, terms, length = 140) {
  if (!text) return "";
  const norm = normalise(text);
  let at = -1;
  for (const term of terms) {
    const i = norm.indexOf(term);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  let start = at < 0 ? 0 : Math.max(0, at - 50);
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

const visible = (el) => el && el.getClientRects().length > 0;

export function initSearch(root = document) {
  const box = root.querySelector("[data-search]");
  if (!box) return;

  const form = box.querySelector("[data-search-form]");
  const input = box.querySelector("[data-search-input]");
  const results = box.querySelector("[data-search-results]");
  const list = box.querySelector("[data-search-list]");
  const meta = box.querySelector("[data-search-meta]");
  const status = box.querySelector("[data-search-status]");
  const openers = root.querySelectorAll("[data-search-open]");
  const closers = box.querySelectorAll("[data-search-close]");
  const backs = box.querySelectorAll("[data-search-back]");
  const menuPanel = root.querySelector(".offcanvas");
  if (!form || !input || !results || !list) return;

  let records = null;
  let loading = null;
  let failed = false;
  let lastFocus = null;
  let hideTimer;

  // A script tag rather than fetch(): file:// blocks cross-origin fetches, and the
  // built site is previewed from disk.
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

  const say = (text) => {
    if (status) status.textContent = text;
  };

  const setMeta = (text) => {
    if (meta) meta.textContent = text;
  };

  const setExpanded = (on) => openers.forEach((el) => el.setAttribute("aria-expanded", on ? "true" : "false"));

  const clear = () => {
    list.innerHTML = "";
    setMeta("");
    results.hidden = true;
  };

  const render = (query) => {
    const terms = normalise(query).split(" ").filter(Boolean);
    if (!terms.length) {
      clear();
      say("");
      return;
    }

    const hits = rank(query, records || []);
    results.hidden = false;

    if (!hits.length) {
      const text = failed
        ? "Search is unavailable right now. Please use the menu."
        : `No results for “${query}”. Try another word.`;
      list.innerHTML = `<li class="search__none">${escapeHtml(text)}</li>`;
      setMeta("");
      say(text);
      return;
    }

    list.innerHTML = hits
      .map(({ record }) => {
        const href = record.i ? `${record.u}#${record.i}` : record.u;
        const text = snippet(record.x, terms);
        const trail = text ? ` &middot; ${highlight(text, terms)}` : "";
        return `<li class="search__item">
          <a class="search__link" href="${href}">
            <span class="search__heading">${highlight(record.h, terms)}</span>
            <span class="search__snippet"><span class="search__page">${escapeHtml(record.t)}</span>${trail}</span>
          </a>
        </li>`;
      })
      .join("");

    const count = `${hits.length} result${hits.length === 1 ? "" : "s"}`;
    setMeta(count);
    say(`${count} for ${query}`);
  };

  const focusables = () =>
    [...box.querySelectorAll("input, button, a[href]")].filter((el) => visible(el) && !el.disabled);

  const open = (from) => {
    clearTimeout(hideTimer);
    if (!box.hidden) return;
    lastFocus = from || document.activeElement;

    // From the phone menu the panel slides away first, so the overlay is alone on screen.
    // Bootstrap hands focus back to the burger once hidden, so the field takes it again then.
    const menu = from && from.closest(".offcanvas");
    if (menu) {
      const panel = Offcanvas.getInstance(menu);
      if (panel) {
        menu.addEventListener("hidden.bs.offcanvas", () => { if (!box.hidden) input.focus(); }, { once: true });
        panel.hide();
      }
    }

    // Stopping Lenis clips the page scrollbar; the header and bar pad by its width so they do not slide
    const html = document.documentElement;
    html.style.setProperty("--scrollbar-size", `${window.innerWidth - html.clientWidth}px`);
    box.hidden = false;
    html.classList.add("has-search-open");
    setExpanded(true);
    Anim.stop();
    requestAnimationFrame(() => {
      box.classList.add("is-open");
      input.focus();
      input.select();
    });
    load().then(() => {
      if (input.value.trim()) render(input.value);
    });
  };

  const close = () => {
    if (box.hidden) return;
    box.classList.remove("is-open");
    document.documentElement.classList.remove("has-search-open");
    setExpanded(false);
    Anim.start();
    const done = () => {
      box.hidden = true;
      document.documentElement.style.removeProperty("--scrollbar-size");
      box.removeEventListener("transitionend", done);
    };
    box.addEventListener("transitionend", done);
    hideTimer = setTimeout(done, 400);

    // The phone menu's search button is gone by now; the burger stands in for it
    const target = visible(lastFocus) ? lastFocus : [...openers, root.querySelector(".site-header__toggle")].find(visible);
    if (target && target.focus) target.focus();
  };

  setExpanded(false);

  openers.forEach((el) =>
    el.addEventListener("click", (event) => {
      event.preventDefault();
      box.hidden ? open(el) : close();
    })
  );
  closers.forEach((el) => el.addEventListener("click", close));

  // The phone panel's back arrow returns to the menu it was opened from
  backs.forEach((el) =>
    el.addEventListener("click", () => {
      close();
      if (menuPanel) Offcanvas.getOrCreateInstance(menuPanel).show();
    })
  );

  // Anywhere on the wash outside the bar and its results closes, like a backdrop
  box.addEventListener("click", (event) => {
    if (!event.target.closest(".search__form, .search__tools, .search__results, .search__top")) close();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    load().then(() => render(input.value));
  });

  input.addEventListener("input", () => {
    if (!input.value.trim()) clear();
  });

  list.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });

  box.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    const links = [...list.querySelectorAll("a")];
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!links.length) return;
      const at = links.indexOf(document.activeElement);
      let next;
      if (event.key === "ArrowDown") next = at < 0 ? links[0] : links[Math.min(at + 1, links.length - 1)];
      else next = at <= 0 ? input : links[at - 1];
      event.preventDefault();
      next.focus();
      return;
    }

    if (event.key === "Tab") {
      const stops = focusables();
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
