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

// --- HTML (partial includes) ----------------------------------------
async function buildHtml() {
  const processor = posthtml([include({ root: SRC })]);
  for (const file of fs.readdirSync(SRC)) {
    if (!file.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(SRC, file), "utf8");
    const result = await processor.process(html);
    fs.mkdirSync(DIST, { recursive: true });
    fs.writeFileSync(path.join(DIST, file), result.html);
  }
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
