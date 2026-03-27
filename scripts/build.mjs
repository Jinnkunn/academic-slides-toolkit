import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const isProd = process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

function buildHtml(uiJs) {
  const template = readFileSync(resolve(root, "src/ui/ui-template.html"), "utf8");
  const mathjax = readFileSync(resolve(root, "node_modules/mathjax/es5/tex-svg.js"), "utf8");

  const html = template
    .replace("<!-- INJECT_MATHJAX -->", `<script>${mathjax}</script>`)
    .replace("<!-- INJECT_UI_SCRIPT -->", `<script>${uiJs}</script>`);

  mkdirSync(resolve(root, "dist"), { recursive: true });
  writeFileSync(resolve(root, "dist/ui.html"), html, "utf8");
  console.log("[build] dist/ui.html written (" + Math.round(html.length / 1024) + " KB)");
}

// Plugin bundle (sandbox, no DOM)
const pluginOptions = {
  entryPoints: [resolve(root, "src/plugin/main.ts")],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: resolve(root, "dist/code.js"),
  minify: isProd,
  sourcemap: isProd ? false : "inline",
  logLevel: "info",
};

// UI bundle (iframe, has DOM)
const uiOptions = {
  entryPoints: [resolve(root, "src/ui/main-ui.ts")],
  bundle: true,
  format: "iife",
  target: "es2020",
  write: false,
  minify: isProd,
  logLevel: "info",
};

async function build() {
  // Build plugin
  await esbuild.build(pluginOptions);

  // Build UI JS and assemble HTML
  const uiResult = await esbuild.build(uiOptions);
  const uiJs = uiResult.outputFiles[0].text;
  buildHtml(uiJs);
}

async function watch() {
  // Watch plugin
  const pluginCtx = await esbuild.context(pluginOptions);
  await pluginCtx.watch();

  // Watch UI with HTML rebuild on change
  const uiCtx = await esbuild.context({
    ...uiOptions,
    write: true,
    outfile: resolve(root, "dist/_ui_bundle.js"),
    plugins: [{
      name: "rebuild-html",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            try {
              const uiJs = readFileSync(resolve(root, "dist/_ui_bundle.js"), "utf8");
              buildHtml(uiJs);
            } catch (e) {
              console.error("[build] HTML rebuild failed:", e.message);
            }
          }
        });
      },
    }],
  });
  await uiCtx.watch();
  console.log("[build] Watching for changes...");
}

if (isWatch) {
  watch().catch((e) => { console.error(e); process.exit(1); });
} else {
  build().catch((e) => { console.error(e); process.exit(1); });
}
