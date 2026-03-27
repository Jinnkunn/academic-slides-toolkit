// ---------------------------------------------------------------------------
// Table UI functions — insert, update, delete, numbering
// ---------------------------------------------------------------------------

import { state } from "./state";

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function openOverlayPage(moduleId: string, pageId: string): void;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let selectedTable: any = null;

// ---------------------------------------------------------------------------
// Selection handling
// ---------------------------------------------------------------------------

export function onTableSelection(table: any, autoNavigate: boolean = false): void {
  const hadTable = !!selectedTable;
  const hasTable = !!table;
  selectedTable = table || null;

  const status = document.getElementById("table-selected-status")!;
  const captionInput = document.getElementById("table-caption-input") as HTMLInputElement;
  const prefixSelect = document.getElementById("table-label-prefix") as HTMLSelectElement;
  const rowsInput = document.getElementById("table-rows") as HTMLInputElement;
  const colsInput = document.getElementById("table-cols") as HTMLInputElement;
  const updateBtn = document.getElementById("table-update-btn") as HTMLButtonElement;
  const deleteBtn = document.getElementById("table-delete-btn") as HTMLButtonElement;

  if (!selectedTable) {
    status.textContent = t("tableSelectedEmpty");
    status.className = "status";
    updateBtn.disabled = true;
    deleteBtn.disabled = true;
    return;
  }

  status.textContent = selectedTable.name || "Table";
  status.className = "status active";
  captionInput.value = selectedTable.caption || "";
  prefixSelect.value = selectedTable.labelPrefix || "Table";
  rowsInput.value = String(selectedTable.rows || 3);
  colsInput.value = String(selectedTable.cols || 3);
  updateBtn.disabled = false;
  deleteBtn.disabled = false;

  if (autoNavigate && hasTable && !hadTable) {
    if (state.currentModule !== "components" ||
        !state.activeOverlay ||
        state.activeOverlay.pageId !== "table") {
      openOverlayPage("components", "table");
      toast("tables", t("tableAutoOpened"), "info");
    }
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function insertTable(): void {
  const captionInput = document.getElementById("table-caption-input") as HTMLInputElement;
  const prefixSelect = document.getElementById("table-label-prefix") as HTMLSelectElement;
  const rowsInput = document.getElementById("table-rows") as HTMLInputElement;
  const colsInput = document.getElementById("table-cols") as HTMLInputElement;

  send("insert-table", {
    caption: captionInput.value.trim(),
    labelPrefix: prefixSelect.value,
    rows: parseInt(rowsInput.value, 10) || 3,
    cols: parseInt(colsInput.value, 10) || 3,
  });
}

export function updateTableCaption(): void {
  if (!selectedTable) return;
  const captionInput = document.getElementById("table-caption-input") as HTMLInputElement;

  send("update-table-caption", {
    nodeId: selectedTable.nodeId,
    caption: captionInput.value.trim(),
  });
}

export function deleteTable(): void {
  if (!selectedTable) return;
  if (!confirm(t("tableDeleteConfirm"))) return;

  send("delete-table", { nodeId: selectedTable.nodeId });
}

export function applyTableNumbering(): void {
  const scope = (document.getElementById("table-numbering-scope") as HTMLSelectElement).value;
  send("apply-table-numbering", { scope });
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

export function onTableInserted(message: any): void {
  if (message && message.table) {
    onTableSelection(message.table);
  }
  openOverlayPage("components", "table");
  toast("tables", t("tableInserted"), "success");
}

export function onTableUpdated(message: any): void {
  if (message && message.table) {
    onTableSelection(message.table);
  }
  toast("tables", t("tableUpdated"), "success");
}

export function onTableDeleted(): void {
  onTableSelection(null);
  toast("tables", t("tableDeleted"), "success");
}

export function onTableNumberingApplied(message: any): void {
  toast("tables", t("tableNumberingApplied", { count: message.count }), "success");
}
