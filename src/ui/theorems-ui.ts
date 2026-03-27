// ---------------------------------------------------------------------------
// Theorem UI functions — insert, update, delete, numbering
// ---------------------------------------------------------------------------

import { state } from "./state";

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function openOverlayPage(moduleId: string, pageId: string): void;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let selectedTheorem: any = null;

// ---------------------------------------------------------------------------
// Selection handling
// ---------------------------------------------------------------------------

export function onTheoremSelection(theorem: any, autoNavigate: boolean = false): void {
  const hadTheorem = !!selectedTheorem;
  const hasTheorem = !!theorem;
  selectedTheorem = theorem || null;

  const status = document.getElementById("theorem-selected-status")!;
  const typeSelect = document.getElementById("theorem-type-select") as HTMLSelectElement;
  const titleInput = document.getElementById("theorem-title-input") as HTMLInputElement;
  const bodyInput = document.getElementById("theorem-body-input") as HTMLTextAreaElement;
  const updateBtn = document.getElementById("theorem-update-btn") as HTMLButtonElement;
  const deleteBtn = document.getElementById("theorem-delete-btn") as HTMLButtonElement;

  if (!selectedTheorem) {
    status.textContent = t("theoremSelectedEmpty");
    status.className = "status";
    updateBtn.disabled = true;
    deleteBtn.disabled = true;
    return;
  }

  status.textContent = selectedTheorem.name || "Theorem";
  status.className = "status active";
  typeSelect.value = selectedTheorem.theoremType || "theorem";
  titleInput.value = selectedTheorem.theoremTitle || "";
  bodyInput.value = selectedTheorem.theoremBody || "";
  updateBtn.disabled = false;
  deleteBtn.disabled = false;

  if (autoNavigate && hasTheorem && !hadTheorem) {
    if (state.currentModule !== "components" ||
        !state.activeOverlay ||
        state.activeOverlay.pageId !== "theorem") {
      openOverlayPage("components", "theorem");
      toast("theorems", t("theoremAutoOpened"), "info");
    }
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function insertTheorem(): void {
  const typeSelect = document.getElementById("theorem-type-select") as HTMLSelectElement;
  const titleInput = document.getElementById("theorem-title-input") as HTMLInputElement;
  const bodyInput = document.getElementById("theorem-body-input") as HTMLTextAreaElement;

  send("insert-theorem", {
    theoremType: typeSelect.value,
    theoremTitle: titleInput.value.trim(),
    theoremBody: bodyInput.value.trim(),
  });
}

export function updateTheorem(): void {
  if (!selectedTheorem) return;
  const titleInput = document.getElementById("theorem-title-input") as HTMLInputElement;
  const bodyInput = document.getElementById("theorem-body-input") as HTMLTextAreaElement;

  send("update-theorem", {
    nodeId: selectedTheorem.nodeId,
    theoremTitle: titleInput.value.trim(),
    theoremBody: bodyInput.value.trim(),
  });
}

export function deleteTheorem(): void {
  if (!selectedTheorem) return;
  if (!confirm(t("theoremDeleteConfirm"))) return;

  send("delete-theorem", { nodeId: selectedTheorem.nodeId });
}

export function applyTheoremNumbering(): void {
  const scope = (document.getElementById("theorem-numbering-scope") as HTMLSelectElement).value;
  send("apply-theorem-numbering", { scope });
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

export function onTheoremInserted(message: any): void {
  if (message && message.theorem) {
    onTheoremSelection(message.theorem);
  }
  openOverlayPage("components", "theorem");
  toast("theorems", t("theoremInserted"), "success");
}

export function onTheoremUpdated(message: any): void {
  if (message && message.theorem) {
    onTheoremSelection(message.theorem);
  }
  toast("theorems", t("theoremUpdated"), "success");
}

export function onTheoremDeleted(): void {
  onTheoremSelection(null);
  toast("theorems", t("theoremDeleted"), "success");
}

export function onTheoremNumberingApplied(message: any): void {
  toast("theorems", t("theoremNumberingApplied", { count: message.count }), "success");
}
