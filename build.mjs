/**
 * build.mjs — no-framework build for the HTML+JS+LESS cutup starter.
 * - LESS (+ Bootstrap inline) -> autoprefixed dist/assets/css/main.css
 * - JS (anim + bootstrap) -> bundled dist/assets/js/main.js (esbuild)
 * - HTML pages -> partials resolved with posthtml-include -> dist/*.html
 * - images/icons/fonts copied verbatim
 * Run: node build.mjs        (production, minified)
 *      node build.mjs --dev  (watch + live-reload server)
 */
import fs from "node:fs";
import path from "node:path";
import less from "less";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import * as esbuild from "esbuild";
import posthtml from "posthtml";
import include from "posthtml-include";
import browserSync from "browser-sync";
import chokidar from "chokidar";

const DEV = process.argv.includes("--dev");
const SRC = "src";
const DIST = "dist";

// --- CSS ------------------------------------------------------------
async function buildCss() {
  const input = `${SRC}/assets/styles/main.less`;
  const code = fs.readFileSync(input, "utf8");
  const out = await less.render(code, {
    filename: path.resolve(input),
    paths: ["node_modules", `${SRC}/assets/styles`],
  });
  const prefixed = await postcss([autoprefixer]).process(out.css, { from: undefined });
  const css = DEV ? prefixed.css : (await esbuild.transform(prefixed.css, { loader: "css", minify: true, legalComments: "none" })).code;
  fs.mkdirSync(`${DIST}/assets/css`, { recursive: true });
  fs.writeFileSync(`${DIST}/assets/css/main.css`, css);
}

// --- Search index ----------------------------------------------------
// One record per heading section, collected from the same tree the page is rendered from,
// so the index cannot drift from the content. Headings without an id get one, so a result
// can deep-link to the section it matched. Site chrome is skipped: otherwise the nav labels
// match on every page and drown out real hits.
const SKIP_TAGS = new Set(["script", "style", "svg", "noscript", "template", "head"]);

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";

const squash = (s) => s.replace(/\s+/g, " ").trim();

const isComment = (s) => typeof s === "string" && s.trimStart().startsWith("<!--");

function textOf(content, out = []) {
  for (const n of content || []) {
    if (typeof n === "string") { if (!isComment(n)) out.push(n); }
    else if (n && n.tag && !SKIP_TAGS.has(n.tag)) textOf(n.content, out);
    else if (n && !n.tag) textOf(n.content, out);
  }
  return out.join(" ");
}

function indexPage(tree, url, records) {
  let title = url;
  const findTitle = (nodes) => {
    for (const n of nodes || []) {
      if (typeof n === "string" || !n) continue;
      if (n.tag === "title") { title = squash(textOf(n.content)); return true; }
      if (n.content && findTitle(n.content)) return true;
    }
    return false;
  };
  findTitle(tree);

  let description = "";
  const findDesc = (nodes) => {
    for (const n of nodes || []) {
      if (typeof n === "string" || !n) continue;
      if (n.tag === "meta" && n.attrs && n.attrs.name === "description") {
        description = squash(n.attrs.content || "");
        return true;
      }
      if (n.content && findDesc(n.content)) return true;
    }
    return false;
  };
  findDesc(tree);

  const main = (() => {
    let found = null;
    const dig = (nodes) => {
      for (const n of nodes || []) {
        if (typeof n === "string" || !n) continue;
        if (n.tag === "main") { found = n; return true; }
        if (n.content && dig(n.content)) return true;
      }
      return false;
    };
    dig(tree);
    return found;
  })();
  if (!main) return;

  const ids = new Set();
  const pageRecords = [];
  const pageName = title.split("|")[0].trim() || title;
  let cur = { u: url, t: pageName, i: "", h: pageName, l: 0, x: "" };
  let buf = description ? [description] : [];

  const flush = () => {
    cur.x = squash(buf.join(" ")).slice(0, 1500);
    buf = [];
    if (cur.x || cur.l > 0) pageRecords.push(cur);
  };

  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (typeof n === "string") { if (!isComment(n)) buf.push(n); continue; }
      if (!n) continue;
      if (!n.tag) { walk(n.content); continue; }
      if (SKIP_TAGS.has(n.tag)) continue;
      const attrs = n.attrs || {};
      if (attrs["aria-hidden"] === "true") continue;
      if ("data-search-skip" in attrs) continue;
      if (typeof attrs.class === "string" && /visually-hidden/.test(attrs.class)) continue;
      if (n.tag === "img" && attrs.alt) buf.push(attrs.alt);

      if (/^h[1-6]$/.test(n.tag)) {
        const heading = squash(textOf(n.content));
        if (heading) {
          flush();
          let id = attrs.id;
          if (!id) {
            id = slugify(heading);
            let k = 2;
            while (ids.has(id)) id = `${slugify(heading)}-${k++}`;
            n.attrs = { ...attrs, id };
          }
          ids.add(id);
          cur = { u: url, t: pageName, i: id, h: heading, l: Number(n.tag[1]), x: "" };
          continue;
        }
      }
      walk(n.content);
    }
  };

  walk(main.content);
  flush();

  // The page-level record and the h1 usually carry the same name; fold the
  // description into the heading record so one page is not listed twice.
  const lead = pageRecords[0];
  if (lead && lead.l === 0) {
    const twin = pageRecords.find((r) => r !== lead && r.l === 1 && r.h.toLowerCase() === lead.h.toLowerCase());
    if (twin) {
      twin.x = squash(`${lead.x} ${twin.x}`).slice(0, 1500);
      pageRecords.splice(pageRecords.indexOf(lead), 1);
    }
  }
  records.push(...pageRecords);
}

// --- HTML (partial includes) ----------------------------------------
async function buildHtml() {
  const processor = posthtml([include({ root: SRC })]);
  const records = [];
  for (const file of fs.readdirSync(SRC)) {
    if (!file.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(SRC, file), "utf8");
    const result = await processor.process(html);
    indexPage(result.tree, file, records);
    fs.mkdirSync(DIST, { recursive: true });
    fs.writeFileSync(path.join(DIST, file), result.html);
  }
  // Emitted as a script, not JSON: fetch() is blocked on file:// and the whole QA
  // workflow previews dist/ from disk. Still lazy — it is injected on first open.
  fs.mkdirSync(`${DIST}/assets`, { recursive: true });
  fs.writeFileSync(
    `${DIST}/assets/search-index.js`,
    `window.__claremontSearch=${JSON.stringify({ records })};`
  );
}

// --- Assets ---------------------------------------------------------
function copyAssets() {
  for (const dir of ["images", "icons", "fonts"]) {
    const from = `${SRC}/assets/${dir}`;
    if (fs.existsSync(from)) {
      fs.cpSync(from, `${DIST}/assets/${dir}`, { recursive: true });
    }
  }
}

// --- JS -------------------------------------------------------------
async function makeJsContext() {
  return esbuild.context({
    entryPoints: [`${SRC}/assets/scripts/main.js`],
    bundle: true,
    outfile: `${DIST}/assets/js/main.js`,
    minify: !DEV,
    sourcemap: DEV,
    logLevel: "info",
  });
}

async function run() {
  fs.rmSync(DIST, { recursive: true, force: true });
  copyAssets();
  await buildCss();
  await buildHtml();

  const jsCtx = await makeJsContext();
  await jsCtx.rebuild();

  if (!DEV) {
    await jsCtx.dispose();
    console.log("Build complete → dist/");
    return;
  }

  await jsCtx.watch();
  const bs = browserSync.create();
  bs.init({ server: DIST, notify: false, open: false, ui: false });

  chokidar.watch(`${SRC}/**/*.html`).on("change", async () => {
    await buildHtml();
    bs.reload();
  });
  chokidar.watch(`${SRC}/assets/styles/**/*.less`).on("change", async () => {
    await buildCss();
    bs.reload("*.css");
  });
  chokidar.watch(`${DIST}/assets/js/main.js`).on("change", () => bs.reload());
  chokidar
    .watch([`${SRC}/assets/images`, `${SRC}/assets/icons`, `${SRC}/assets/fonts`])
    .on("all", () => copyAssets());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
