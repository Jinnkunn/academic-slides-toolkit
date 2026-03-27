// ---------------------------------------------------------------------------
// Cross-reference UI functions
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
// Format options per target kind
// ---------------------------------------------------------------------------

const FORMAT_OPTIONS: Record<string, { label: string; format: string }[]> = {
  equation: [
    { label: "(1)", format: "({n})" },
    { label: "(Eq. 1)", format: "(Eq. {n})" },
    { label: "Eq. (1)", format: "Eq. ({n})" },
    { label: "Equation 1", format: "Equation {n}" },
  ],
  figure: [
    { label: "(Fig. 1)", format: "(Fig. {n})" },
    { label: "Fig. 1", format: "Fig. {n}" },
    { label: "Figure 1", format: "Figure {n}" },
  ],
  table: [
    { label: "(Table 1)", format: "(Table {n})" },
    { label: "Table 1", format: "Table {n}" },
    { label: "(表 1)", format: "(表 {n})" },
  ],
  theorem: [
    { label: "(Thm. 1)", format: "(Thm. {n})" },
    { label: "Theorem 1", format: "Theorem {n}" },
  ],
};

// ---------------------------------------------------------------------------
// getCrossrefToastScope
// ---------------------------------------------------------------------------
export function getCrossrefToastScope(): string {
  return "toast-crossrefs";
}

// ---------------------------------------------------------------------------
// onCrossrefTargetKindChange — updates format <select> when kind changes
// ---------------------------------------------------------------------------
export function onCrossrefTargetKindChange(): void {
  const kindSelect = document.getElementById("crossref-target-kind") as HTMLSelectElement | null;
  const formatSelect = document.getElementById("crossref-format") as HTMLSelectElement | null;
  if (!kindSelect || !formatSelect) return;

  const kind = kindSelect.value;
  const options = FORMAT_OPTIONS[kind] || [];

  formatSelect.innerHTML = "";
  for (let i = 0; i < options.length; i++) {
    const opt = document.createElement("option");
    opt.value = options[i].format;
    opt.textContent = options[i].label;
    formatSelect.appendChild(opt);
  }

  updateCrossrefPreview();
}

// ---------------------------------------------------------------------------
// updateCrossrefPreview — live preview of the formatted cross-reference text
// ---------------------------------------------------------------------------
export function updateCrossrefPreview(): void {
  const formatSelect = document.getElementById("crossref-format") as HTMLSelectElement | null;
  const indexInput = document.getElementById("crossref-index") as HTMLInputElement | null;
  const preview = document.getElementById("crossref-preview");
  if (!formatSelect || !indexInput || !preview) return;

  const format = formatSelect.value || "({n})";
  const index = Math.max(1, parseInt(indexInput.value, 10) || 1);
  const text = format.replace(/\{n\}/g, String(index));

  preview.textContent = text;
}

// ---------------------------------------------------------------------------
// insertCrossref — reads form values and sends insert message to plugin
// ---------------------------------------------------------------------------
export function insertCrossref(): void {
  const kindSelect = document.getElementById("crossref-target-kind") as HTMLSelectElement | null;
  const formatSelect = document.getElementById("crossref-format") as HTMLSelectElement | null;
  const indexInput = document.getElementById("crossref-index") as HTMLInputElement | null;

  const targetKind = kindSelect ? kindSelect.value : "equation";
  const format = formatSelect ? formatSelect.value : "({n})";
  const index = Math.max(1, parseInt(indexInput ? indexInput.value : "1", 10) || 1);

  send("insert-crossref", {
    targetKind,
    format,
    index,
  });
}

// ---------------------------------------------------------------------------
// updateAllCrossrefs — sends update-all message to plugin
// ---------------------------------------------------------------------------
export function updateAllCrossrefs(): void {
  send("update-all-crossrefs", {});
}

// ---------------------------------------------------------------------------
// onCrossrefInserted — toast on successful insertion
// ---------------------------------------------------------------------------
export function onCrossrefInserted(message: any): void {
  toast(getCrossrefToastScope(), t("crossrefInserted"), "success");
  send("get-selection");
}

// ---------------------------------------------------------------------------
// onCrossrefsUpdated — toast with update count
// ---------------------------------------------------------------------------
export function onCrossrefsUpdated(message: any): void {
  const count = (message && message.count) || 0;
  toast(getCrossrefToastScope(), t("crossrefsUpdated", { count }), "success");
  send("get-selection");
}

// ---------------------------------------------------------------------------
// initCrossrefUI — wire up event listeners on form elements
// ---------------------------------------------------------------------------
export function initCrossrefUI(): void {
  const kindSelect = document.getElementById("crossref-target-kind");
  const formatSelect = document.getElementById("crossref-format");
  const indexInput = document.getElementById("crossref-index");

  if (kindSelect) {
    kindSelect.addEventListener("change", onCrossrefTargetKindChange);
  }
  if (formatSelect) {
    formatSelect.addEventListener("change", updateCrossrefPreview);
  }
  if (indexInput) {
    indexInput.addEventListener("input", updateCrossrefPreview);
  }

  // Populate initial format options
  onCrossrefTargetKindChange();
}
