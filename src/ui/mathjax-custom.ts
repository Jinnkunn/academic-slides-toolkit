// Custom MathJax build — selective TeX packages for academic math
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";

import "mathjax-full/js/input/tex/ams/AmsConfiguration.js";
import "mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js";
import "mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js";
import "mathjax-full/js/input/tex/color/ColorConfiguration.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({
  packages: ["base", "ams", "boldsymbol", "newcommand", "color"],
});
const svg = new SVG({ fontCache: "none" });
const doc = mathjax.document("", { InputJax: tex, OutputJax: svg });

(window as any).__MathJaxCustom = {
  tex2svg(latex: string, options?: { display?: boolean }) {
    const display = !!(options && options.display);
    const node = doc.convert(latex, { display });
    return adaptor.outerHTML(node);
  },
};
(window as any).__mathjaxReady = true;
(window as any).__mathjaxFailed = false;
window.dispatchEvent(new Event("mathjax-ready"));
