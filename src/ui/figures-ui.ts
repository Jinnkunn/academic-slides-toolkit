// ---------------------------------------------------------------------------
// Figure UI functions — insert, update, delete, numbering
// ---------------------------------------------------------------------------

import { state } from "./state";

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function openOverlayPage(moduleId: string, pageId: string): void;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let selectedFigure: any = null;

// ---------------------------------------------------------------------------
// Selection handling
// ---------------------------------------------------------------------------

export function onFigureSelection(figure: any, autoNavigate: boolean = false): void {
  const hadFigure = !!selectedFigure;
  const hasFigure = !!figure;
  selectedFigure = figure || null;

  const status = document.getElementById("figure-selected-status")!;
  const captionInput = document.getElementById("figure-caption-input") as HTMLInputElement;
  const prefixSelect = document.getElementById("figure-label-prefix") as HTMLSelectElement;
  const widthInput = document.getElementById("figure-width") as HTMLInputElement;
  const heightInput = document.getElementById("figure-height") as HTMLInputElement;
  const updateBtn = document.getElementById("figure-update-btn") as HTMLButtonElement;
  const deleteBtn = document.getElementById("figure-delete-btn") as HTMLButtonElement;

  if (!selectedFigure) {
    status.textContent = t("figureSelectedEmpty");
    status.className = "status";
    updateBtn.disabled = true;
    deleteBtn.disabled = true;
    return;
  }

  status.textContent = selectedFigure.name || "Figure";
  status.className = "status active";
  captionInput.value = selectedFigure.caption || "";
  prefixSelect.value = selectedFigure.labelPrefix || "Figure";
  widthInput.value = String(selectedFigure.width || 400);
  heightInput.value = String(selectedFigure.height || 300);
  updateBtn.disabled = false;
  deleteBtn.disabled = false;

  if (autoNavigate && hasFigure && !hadFigure) {
    if (state.currentModule !== "components" ||
        !state.activeOverlay ||
        state.activeOverlay.pageId !== "figure") {
      openOverlayPage("components", "figure");
      toast("figures", t("figureAutoOpened"), "info");
    }
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function insertFigure(): void {
  const captionInput = document.getElementById("figure-caption-input") as HTMLInputElement;
  const prefixSelect = document.getElementById("figure-label-prefix") as HTMLSelectElement;
  const widthInput = document.getElementById("figure-width") as HTMLInputElement;
  const heightInput = document.getElementById("figure-height") as HTMLInputElement;

  send("insert-figure", {
    caption: captionInput.value.trim(),
    labelPrefix: prefixSelect.value,
    width: parseInt(widthInput.value, 10) || 400,
    height: parseInt(heightInput.value, 10) || 300,
  });
}

export function updateFigureCaption(): void {
  if (!selectedFigure) return;
  const captionInput = document.getElementById("figure-caption-input") as HTMLInputElement;

  send("update-figure-caption", {
    nodeId: selectedFigure.nodeId,
    caption: captionInput.value.trim(),
  });
}

export function deleteFigure(): void {
  if (!selectedFigure) return;
  if (!confirm(t("figureDeleteConfirm"))) return;

  send("delete-figure", { nodeId: selectedFigure.nodeId });
}

export function applyFigureNumbering(): void {
  const scope = (document.getElementById("figure-numbering-scope") as HTMLSelectElement).value;
  send("apply-figure-numbering", { scope });
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

export function onFigureInserted(message: any): void {
  if (message && message.figure) {
    onFigureSelection(message.figure);
  }
  openOverlayPage("components", "figure");
  toast("figures", t("figureInserted"), "success");
}

export function onFigureUpdated(message: any): void {
  if (message && message.figure) {
    onFigureSelection(message.figure);
  }
  toast("figures", t("figureUpdated"), "success");
}

export function onFigureDeleted(): void {
  onFigureSelection(null);
  toast("figures", t("figureDeleted"), "success");
}

export function onFigureNumberingApplied(message: any): void {
  toast("figures", t("figureNumberingApplied", { count: message.count }), "success");
}
