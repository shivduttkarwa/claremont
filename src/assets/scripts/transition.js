/**
 * transition — helper for the page transition (06-animation/_page-transition.less): a page link is
 * prefetched as soon as it is hovered, focused or touched, so the slide can start the moment it is clicked.
 */
const FILES = /\.(pdf|zip|docx?|xlsx?|pptx?|jpe?g|png|webp|svg|mp4|mp3)$/i;

// The page a link leads to, or null for anything the transition would not cover
function pageOf(link) {
  if (link.target || link.hasAttribute("download")) return null;
  let url;
  try { url = new URL(link.href); } catch { return null; }
  if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin || FILES.test(url.pathname)) return null;
  url.hash = "";
  const here = new URL(location.href);
  here.hash = "";
  return url.href === here.href ? null : url.href;
}

export function initPageTransition(root = document) {
  if (!document.createElement("link").relList.supports("prefetch")) return;
  const warmed = new Set();
  const warm = (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const href = link && pageOf(link);
    if (!href || warmed.has(href)) return;
    warmed.add(href);
    const tag = document.createElement("link");
    tag.rel = "prefetch";
    tag.href = href;
    document.head.append(tag);
  };
  root.addEventListener("pointerover", warm);
  root.addEventListener("focusin", warm);
  root.addEventListener("touchstart", warm, { passive: true });
}
