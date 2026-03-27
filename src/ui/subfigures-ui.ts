// ---------------------------------------------------------------------------
// Subfigure UI functions — insert, update, delete, numbering
// ---------------------------------------------------------------------------

import { state } from "./state";

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function openOverlayPage(moduleId: string, pageId: string): void;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let selectedSubfigure: any = null;

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function parseLayoutCount(layout: string): number {
  const parts = layout.split("x");
  const rows = Math.max(1, parseInt(parts[0], 10) || 2);
  const cols = Math.max(1, parseInt(parts[1], 10) || 2);
  return rows * cols;
}

function sublabel(index: number): string {
  return `(${String.fromCharCode(97 + index)})`;
}

// ---------------------------------------------------------------------------
// Dynamic subcaption fields
// ---------------------------------------------------------------------------

export function onSubfigureLayoutChange(): void {
  const layoutSelect = document.getElementById("subfigure-layout") as HTMLSelectElement;
  const container = document.getElementById("subfigure-subcaptions-container")!;
  if (!layoutSelect || !container) return;

  const count = parseLayoutCount(layoutSelect.value);
  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "field-row";
    wrapper.style.marginBottom = "4px";

    const label = document.createElement("label");
    label.textContent = `${sublabel(i)}`;
    label.style.minWidth = "28px";
    label.style.fontSize = "12px";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "subfigure-subcaption-input";
    input.dataset.index = String(i);
    input.placeholder = "Description";

    // Pre-fill if we have a selected subfigure with existing subcaptions
    if (selectedSubfigure && selectedSubfigure.subcaptions && selectedSubfigure.subcaptions[i]) {
      // Strip the "(x) " prefix if present
      const raw = selectedSubfigure.subcaptions[i];
      const prefixPattern = /^\([a-z]\)\s*/;
      input.value = raw.replace(prefixPattern, "");
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  }
}

// ---------------------------------------------------------------------------
// Selection handling
// ---------------------------------------------------------------------------

export function onSubfigureSelection(subfigure: any, autoNavigate: boolean = false): void {
  const hadSubfigure = !!selectedSubfigure;
  const hasSubfigure = !!subfigure;
  selectedSubfigure = subfigure || null;

  const status = document.getElementById("subfigure-selected-status")!;
  const captionInput = document.getElementById("subfigure-caption") as HTMLInputElement;
  const prefixSelect = document.getElementById("subfigure-label-prefix") as HTMLSelectElement;
  const layoutSelect = document.getElementById("subfigure-layout") as HTMLSelectElement;
  const cellWidthInput = document.getElementById("subfigure-cell-width") as HTMLInputElement;
  const cellHeightInput = document.getElementById("subfigure-cell-height") as HTMLInputElement;
  const updateBtn = document.getElementById("subfigure-update-btn") as HTMLButtonElement;
  const deleteBtn = document.getElementById("subfigure-delete-btn") as HTMLButtonElement;

  if (!selectedSubfigure) {
    status.textContent = t("subfigureSelectedEmpty");
    status.className = "status";
    updateBtn.disabled = true;
    deleteBtn.disabled = true;
    return;
  }

  status.textContent = selectedSubfigure.name || "Subfigure";
  status.className = "status active";
  captionInput.value = selectedSubfigure.caption || "";
  prefixSelect.value = selectedSubfigure.labelPrefix || "Figure";
  layoutSelect.value = selectedSubfigure.layout || "2x2";
  updateBtn.disabled = false;
  deleteBtn.disabled = false;

  // Rebuild subcaption fields to match current layout
  onSubfigureLayoutChange();

  if (autoNavigate && hasSubfigure && !hadSubfigure) {
    if (state.currentModule !== "components" ||
        !state.activeOverlay ||
        state.activeOverlay.pageId !== "subfigure") {
      openOverlayPage("components", "subfigure");
      toast("subfigures", t("subfigureAutoOpened"), "info");
    }
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function insertSubfigure(): void {
  const captionInput = document.getElementById("subfigure-caption") as HTMLInputElement;
  const prefixSelect = document.getElementById("subfigure-label-prefix") as HTMLSelectElement;
  const layoutSelect = document.getElementById("subfigure-layout") as HTMLSelectElement;
  const cellWidthInput = document.getElementById("subfigure-cell-width") as HTMLInputElement;
  const cellHeightInput = document.getElementById("subfigure-cell-height") as HTMLInputElement;

  const layout = layoutSelect.value;
  const count = parseLayoutCount(layout);

  // Collect subcaptions from dynamic inputs
  const subcaptions: string[] = [];
  const inputs = document.querySelectorAll(".subfigure-subcaption-input") as NodeListOf<HTMLInputElement>;
  for (let i = 0; i < inputs.length; i++) {
    subcaptions.push(inputs[i].value.trim());
  }

  // Fill remaining with defaults if fewer inputs than cells
  while (subcaptions.length < count) {
    subcaptions.push("Description");
  }

  send("insert-subfigure", {
    layout,
    caption: captionInput.value.trim(),
    labelPrefix: prefixSelect.value,
    subcaptions,
    cellWidth: parseInt(cellWidthInput.value, 10) || 200,
    cellHeight: parseInt(cellHeightInput.value, 10) || 150,
  });
}

export function updateSubfigure(): void {
  if (!selectedSubfigure) return;

  const captionInput = document.getElementById("subfigure-caption") as HTMLInputElement;

  // Collect subcaptions from dynamic inputs
  const subcaptions: string[] = [];
  const inputs = document.querySelectorAll(".subfigure-subcaption-input") as NodeListOf<HTMLInputElement>;
  for (let i = 0; i < inputs.length; i++) {
    subcaptions.push(inputs[i].value.trim());
  }

  send("update-subfigure", {
    nodeId: selectedSubfigure.nodeId,
    caption: captionInput.value.trim(),
    subcaptions,
  });
}

export function deleteSubfigure(): void {
  if (!selectedSubfigure) return;
  if (!confirm(t("subfigureDeleteConfirm"))) return;

  send("delete-subfigure", { nodeId: selectedSubfigure.nodeId });
}

export function applySubfigureNumbering(): void {
  const scope = (document.getElementById("subfigure-numbering-scope") as HTMLSelectElement).value;
  send("apply-subfigure-numbering", { scope });
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

export function onSubfigureInserted(message: any): void {
  if (message && message.subfigure) {
    onSubfigureSelection(message.subfigure);
  }
  openOverlayPage("components", "subfigure");
  toast("subfigures", t("subfigureInserted"), "success");
}

export function onSubfigureUpdated(message: any): void {
  if (message && message.subfigure) {
    onSubfigureSelection(message.subfigure);
  }
  toast("subfigures", t("subfigureUpdated"), "success");
}

export function onSubfigureDeleted(): void {
  onSubfigureSelection(null);
  toast("subfigures", t("subfigureDeleted"), "success");
}

export function onSubfigureNumberingApplied(message: any): void {
  toast("subfigures", t("subfigureNumberingApplied", { count: message.count }), "success");
}
