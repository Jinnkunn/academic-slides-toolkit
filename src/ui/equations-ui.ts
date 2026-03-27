// ---------------------------------------------------------------------------
// Equation UI functions -- extracted from ui.html
// ---------------------------------------------------------------------------

import { state } from "./state";

// Declared helpers from utils / i18n / other modules (not yet extracted)
declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function esc(value: string): string;

// Forward-declared cross-module helpers
declare function openOverlayPage(moduleId: string, pageId: string): void;
declare function closeOverlayPage(): void;
declare function setModule(moduleId: string): void;

// ---------------------------------------------------------------------------
// Equation snippets — one-click LaTeX template insertion
// ---------------------------------------------------------------------------

interface Snippet {
  label: string;
  latex: string;
  /** If true, wraps the snippet around selected text in the textarea */
  wrap?: boolean;
}

const SNIPPETS_COMMON: Snippet[] = [
  { label: "\\frac{}{}", latex: "\\frac{a}{b}" },
  { label: "\\sqrt{}", latex: "\\sqrt{x}" },
  { label: "\\sum", latex: "\\sum_{i=1}^{n}" },
  { label: "\\prod", latex: "\\prod_{i=1}^{n}" },
  { label: "\\int", latex: "\\int_{a}^{b}" },
  { label: "\\lim", latex: "\\lim_{x \\to \\infty}" },
  { label: "x^{n}", latex: "x^{n}" },
  { label: "x_{i}", latex: "x_{i}" },
  { label: "\\binom{}{}", latex: "\\binom{n}{k}" },
  { label: "\\vec{}", latex: "\\vec{v}" },
  { label: "\\hat{}", latex: "\\hat{x}" },
  { label: "\\bar{}", latex: "\\bar{x}" },
  { label: "\\dot{}", latex: "\\dot{x}" },
  { label: "matrix", latex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
  { label: "cases", latex: "\\begin{cases} x & \\text{if } x > 0 \\\\ -x & \\text{otherwise} \\end{cases}" },
  { label: "aligned", latex: "\\begin{aligned} a &= b + c \\\\ d &= e + f \\end{aligned}" },
];

const SNIPPETS_SYMBOLS: Snippet[] = [
  { label: "\\alpha", latex: "\\alpha" },
  { label: "\\beta", latex: "\\beta" },
  { label: "\\gamma", latex: "\\gamma" },
  { label: "\\delta", latex: "\\delta" },
  { label: "\\theta", latex: "\\theta" },
  { label: "\\lambda", latex: "\\lambda" },
  { label: "\\sigma", latex: "\\sigma" },
  { label: "\\omega", latex: "\\omega" },
  { label: "\\partial", latex: "\\partial" },
  { label: "\\nabla", latex: "\\nabla" },
  { label: "\\infty", latex: "\\infty" },
  { label: "\\approx", latex: "\\approx" },
  { label: "\\neq", latex: "\\neq" },
  { label: "\\leq", latex: "\\leq" },
  { label: "\\geq", latex: "\\geq" },
  { label: "\\in", latex: "\\in" },
  { label: "\\subset", latex: "\\subset" },
  { label: "\\cup", latex: "\\cup" },
  { label: "\\cap", latex: "\\cap" },
  { label: "\\forall", latex: "\\forall" },
  { label: "\\exists", latex: "\\exists" },
  { label: "\\rightarrow", latex: "\\rightarrow" },
  { label: "\\Rightarrow", latex: "\\Rightarrow" },
  { label: "\\cdot", latex: "\\cdot" },
];

function insertSnippetAtCursor(textarea: HTMLTextAreaElement, latex: string): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  // If there's selected text, try to wrap it (e.g. for \frac{selection}{})
  textarea.value = before + latex + " " + after;
  const newCursor = start + latex.length + 1;
  textarea.selectionStart = newCursor;
  textarea.selectionEnd = newCursor;
  textarea.focus();

  // Trigger preview update
  renderEquationInsertPreview();
}

function renderSnippetGrid(containerId: string, snippets: Snippet[], textareaId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < snippets.length; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "snippet-btn";
    btn.textContent = snippets[i].label;
    btn.title = snippets[i].latex;
    const latex = snippets[i].latex;
    btn.addEventListener("click", () => {
      const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
      if (textarea) insertSnippetAtCursor(textarea, latex);
    });
    container.appendChild(btn);
  }
}

export function initSnippets(): void {
  renderSnippetGrid("snippet-grid-common", SNIPPETS_COMMON, "equation-input");
  renderSnippetGrid("snippet-grid-symbols", SNIPPETS_SYMBOLS, "equation-input");
}

// ---------------------------------------------------------------------------
// getEquationToastScope  (ui.html ~line 2629)
// ---------------------------------------------------------------------------
export function getEquationToastScope(): string {
  if (state.activeOverlay && state.activeOverlay.moduleId === "equations") {
    if (state.activeOverlay.pageId === "selected") return "equations-selected";
    if (state.activeOverlay.pageId === "numbering") return "equations-numbering";
    if (state.activeOverlay.pageId === "insert") return "equations";
  }
  return "equations-overview";
}

// ---------------------------------------------------------------------------
// mathJaxReady  (ui.html ~line 2835)
// ---------------------------------------------------------------------------
export function mathJaxReady(): boolean {
  return !!((window as any).__mathjaxReady && (window as any).__MathJaxCustom && typeof (window as any).__MathJaxCustom.tex2svg === "function");
}

// ---------------------------------------------------------------------------
// getEquationFormValues  (ui.html ~line 2839)
// ---------------------------------------------------------------------------
export function getEquationFormValues(prefix: string): {
  latex: string;
  displayMode: string;
  fontSize: number;
  color: string;
} {
  const input = document.getElementById(prefix + "-input") as HTMLInputElement | null;
  const mode = document.getElementById(prefix + "-display-mode") as HTMLSelectElement | null;
  const size = document.getElementById(prefix + "-font-size") as HTMLInputElement | null;
  const color = document.getElementById(prefix + "-color") as HTMLInputElement | null;

  return {
    latex: input ? input.value.trim() : "",
    displayMode: mode ? mode.value : "display",
    fontSize: Math.max(12, parseInt(size ? size.value : "32", 10) || 32),
    color: color ? (color.value.trim() || "#111827") : "#111827",
  };
}

// ---------------------------------------------------------------------------
// renderEquationSvg  (ui.html ~line 2853)
// ---------------------------------------------------------------------------
export function renderEquationSvg(latex: string, displayMode: string, fontSize: number, color: string): string {
  if ((window as any).__mathjaxFailed) return "";
  if (!mathJaxReady() || !latex) return "";

  try {
    // __MathJaxCustom.tex2svg returns an outer HTML string from liteAdaptor
    const html = (window as any).__MathJaxCustom.tex2svg(latex, {
      display: displayMode === "display",
    });
    if (!html) return "";

    // Parse and apply styling
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const svg = tmp.querySelector("svg");
    if (!svg) return "";
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.color = color;
    svg.style.maxWidth = "100%";

    // Scale based on fontSize (MathJax liteAdaptor defaults to 16px ex)
    const scale = fontSize / 16;
    if (scale !== 1) {
      const currentWidth = svg.getAttribute("width") || "";
      const currentHeight = svg.getAttribute("height") || "";
      if (currentWidth.endsWith("ex")) {
        svg.setAttribute("width", (parseFloat(currentWidth) * scale) + "ex");
      }
      if (currentHeight.endsWith("ex")) {
        svg.setAttribute("height", (parseFloat(currentHeight) * scale) + "ex");
      }
    }

    return svg.outerHTML;
  } catch (error) {
    return "";
  }
}

// ---------------------------------------------------------------------------
// renderEquationPreview  (ui.html ~line 2875)
// ---------------------------------------------------------------------------
export function renderEquationPreview(prefix: string, emptyKey: string): void {
  const values = getEquationFormValues(prefix);
  const preview = document.getElementById(prefix + "-preview")!;
  const svgMarkup = renderEquationSvg(values.latex, values.displayMode, values.fontSize, values.color);

  if (prefix === "equation") {
    state.equationInsertSvg = svgMarkup;
  } else {
    state.equationSelectedSvg = svgMarkup;
  }

  if (!values.latex) {
    preview.className = "equation-preview empty";
    preview.textContent = t(emptyKey);
    return;
  }

  if (!mathJaxReady()) {
    preview.className = "equation-preview empty";
    preview.textContent = t("equationsPreviewNotReady");
    return;
  }

  if (!svgMarkup) {
    preview.className = "equation-preview empty";
    preview.textContent = t("equationsPreviewNotReady");
    return;
  }

  preview.className = "equation-preview";
  preview.innerHTML = svgMarkup;
}

// ---------------------------------------------------------------------------
// renderEquationInsertPreview  (ui.html ~line 2908)
// ---------------------------------------------------------------------------
export function renderEquationInsertPreview(): void {
  renderEquationPreview("equation", "equationsPreviewEmpty");
}

// ---------------------------------------------------------------------------
// renderEquationSelectedPreview  (ui.html ~line 2912)
// ---------------------------------------------------------------------------
export function renderEquationSelectedPreview(): void {
  renderEquationPreview("equation-selected", "equationsSelectedPreviewEmpty");
}

// ---------------------------------------------------------------------------
// onEquationSelection  (ui.html ~line 2916)
// ---------------------------------------------------------------------------
export function onEquationSelection(equation: any, autoNavigate: boolean = false): void {
  const hadEquation = !!state.selectedEquation;
  const hasEquation = !!equation;
  state.selectedEquation = equation || null;
  const status = document.getElementById("equation-selected-status")!;
  const input = document.getElementById("equation-selected-input") as HTMLInputElement;
  const mode = document.getElementById("equation-selected-display-mode") as HTMLSelectElement;
  const size = document.getElementById("equation-selected-font-size") as HTMLInputElement;
  const color = document.getElementById("equation-selected-color") as HTMLInputElement;
  const updateButton = document.getElementById("equation-update-btn") as HTMLButtonElement;
  const deleteButton = document.getElementById("equation-delete-btn") as HTMLButtonElement;

  if (!state.selectedEquation) {
    status.textContent = t("equationsSelectedEmpty");
    status.className = "status";
    input.value = "";
    mode.value = "display";
    size.value = "32";
    color.value = "#111827";
    input.disabled = true;
    mode.disabled = true;
    size.disabled = true;
    color.disabled = true;
    updateButton.disabled = true;
    deleteButton.disabled = true;
    renderEquationSelectedPreview();
    return;
  }

  status.textContent = state.selectedEquation.name || "Equation";
  status.className = "status active";
  input.value = state.selectedEquation.latex || "";
  mode.value = state.selectedEquation.displayMode || "display";
  size.value = String(state.selectedEquation.fontSize || 32);
  color.value = state.selectedEquation.color || "#111827";
  input.disabled = false;
  mode.disabled = false;
  size.disabled = false;
  color.disabled = false;
  updateButton.disabled = false;
  deleteButton.disabled = false;
  renderEquationSelectedPreview();

  // Auto-navigate to equation editor when user selects a plugin equation
  if (autoNavigate && hasEquation && !hadEquation) {
    // Only auto-switch if we're not already viewing this equation
    if (state.currentModule !== "equations" ||
        !state.activeOverlay ||
        state.activeOverlay.pageId !== "selected") {
      openOverlayPage("equations", "selected");
      toast("equations-overview", t("equationsAutoOpened"), "info");
    }
  }
}

// ---------------------------------------------------------------------------
// buildEquationPayload  (ui.html ~line 2958)
// ---------------------------------------------------------------------------
export function buildEquationPayload(prefix: string, svgMarkup: string): any {
  const values = getEquationFormValues(prefix);
  return {
    latex: values.latex,
    displayMode: values.displayMode,
    fontSize: values.fontSize,
    color: values.color,
    svgMarkup: svgMarkup,
  };
}

// ---------------------------------------------------------------------------
// insertEquation  (ui.html ~line 2969)
// ---------------------------------------------------------------------------
export function insertEquation(): void {
  const payload = buildEquationPayload("equation", state.equationInsertSvg);
  if (!payload.latex) {
    toast(getEquationToastScope(), t("equationsNeedContent"), "error");
    return;
  }
  if (!payload.svgMarkup) {
    renderEquationInsertPreview();
    if (!state.equationInsertSvg) {
      toast(getEquationToastScope(), t("equationsPreviewNotReady"), "error");
      return;
    }
  }

  send("insert-equation", payload);
}

// ---------------------------------------------------------------------------
// updateSelectedEquation  (ui.html ~line 2986)
// ---------------------------------------------------------------------------
export function updateSelectedEquation(): void {
  if (!state.selectedEquation || !state.selectedEquation.nodeId) {
    toast(getEquationToastScope(), t("equationsSelectedEmpty"), "error");
    return;
  }

  const payload = buildEquationPayload("equation-selected", state.equationSelectedSvg);
  if (!payload.latex) {
    toast(getEquationToastScope(), t("equationsNeedContent"), "error");
    return;
  }
  if (!payload.svgMarkup) {
    renderEquationSelectedPreview();
    if (!state.equationSelectedSvg) {
      toast(getEquationToastScope(), t("equationsPreviewNotReady"), "error");
      return;
    }
  }

  payload.nodeId = state.selectedEquation.nodeId;
  send("update-equation", payload);
}

// ---------------------------------------------------------------------------
// deleteSelectedEquation  (ui.html ~line 3009)
// ---------------------------------------------------------------------------
export function deleteSelectedEquation(): void {
  if (!state.selectedEquation || !state.selectedEquation.nodeId) {
    toast(getEquationToastScope(), t("equationsSelectedEmpty"), "error");
    return;
  }
  if (!confirm(t("equationsDeleteConfirm"))) {
    return;
  }
  send("delete-equation", { nodeId: state.selectedEquation.nodeId });
}

// ---------------------------------------------------------------------------
// applyEquationNumbering  (ui.html ~line 3020)
// ---------------------------------------------------------------------------
export function applyEquationNumbering(): void {
  send("apply-equation-numbering", {
    scope: (document.getElementById("equations-numbering-scope") as HTMLSelectElement).value,
    style: (document.getElementById("equations-numbering-style") as HTMLSelectElement).value,
  });
}

// ---------------------------------------------------------------------------
// clearEquationNumbering  (ui.html ~line 3027)
// ---------------------------------------------------------------------------
export function clearEquationNumbering(): void {
  send("clear-equation-numbering", {
    scope: (document.getElementById("equations-numbering-scope") as HTMLSelectElement).value,
  });
}

// ---------------------------------------------------------------------------
// onEquationInserted  (ui.html ~line 3990)
// ---------------------------------------------------------------------------
export function onEquationInserted(message: any): void {
  if (message && message.equation) {
    onEquationSelection(message.equation);
  }
  openOverlayPage("equations", "selected");
  toast(getEquationToastScope(), t("equationsInserted"), "success");
  send("get-selection");
}

// ---------------------------------------------------------------------------
// onEquationUpdated  (ui.html ~line 3999)
// ---------------------------------------------------------------------------
export function onEquationUpdated(message: any): void {
  if (message && message.equation) {
    onEquationSelection(message.equation);
  }
  openOverlayPage("equations", "selected");
  toast(getEquationToastScope(), t("equationsUpdated"), "success");
  send("get-selection");
}

// ---------------------------------------------------------------------------
// onEquationDeleted  (ui.html ~line 4008)
// ---------------------------------------------------------------------------
export function onEquationDeleted(): void {
  onEquationSelection(null);
  closeOverlayPage();
  setModule("equations");
  toast(getEquationToastScope(), t("equationsDeleted"), "success");
}

// ---------------------------------------------------------------------------
// onEquationNumberingApplied  (ui.html ~line 4015)
// ---------------------------------------------------------------------------
export function onEquationNumberingApplied(message: any): void {
  toast(getEquationToastScope(), t("equationsNumberingApplied", { count: message.count || 0 }), "success");
  send("get-selection");
}

// ---------------------------------------------------------------------------
// onEquationNumberingCleared  (ui.html ~line 4020)
// ---------------------------------------------------------------------------
export function onEquationNumberingCleared(message: any): void {
  toast(getEquationToastScope(), t("equationsNumberingCleared", { count: message.count || 0 }), "success");
  send("get-selection");
}
