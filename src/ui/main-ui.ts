// UI entry point — wires all modules together and exposes globals for onclick handlers

import { setModule, openOverlayPage, closeOverlayPage, requestPages, renderModuleShell, refreshTemplatePanelsImpl } from "./navigation";
import { renderEquationInsertPreview, renderEquationSelectedPreview, insertEquation, updateSelectedEquation, deleteSelectedEquation, applyEquationNumbering, clearEquationNumbering, onEquationSelection, onEquationInserted, onEquationUpdated, onEquationDeleted, onEquationNumberingApplied, onEquationNumberingCleared, initSnippets } from "./equations-ui";
import {
  updateTemplateSelector, updateOverviewImpl, onSelection, saveTemplate, onActiveTemplateChange, onTemplates,
  onTemplateSaved, onTemplateKindChange, onLayoutAreaChange, setTemplateSummary, onTotalModeChange, toggleIndicator,
  checkVarCandidate, onVarCandidate, confirmAddSource, cancelAddSource, saveSources,
  renderSourceRules, addRange, deleteRange, deleteSourceRule, updateRange,
  renderSyncStep, onExcludeChange, saveSyncSettings,
  applySelectedTemplate, syncSelectedTemplate, removeSelectedTemplateInstances, deleteSelectedTemplate,
  onPagesReceived, onConfigSaved, onApplyComplete, onSyncComplete, onVariablesSaved, onSyncStartNumberInput,
  renderBindNote
} from "./deck-ui";
import { applySettings, saveSettings, onSettingsReceived, onSettingsSaved } from "./settings-ui";
import { onFigureSelection, insertFigure, updateFigureCaption, deleteFigure, applyFigureNumbering, onFigureInserted, onFigureUpdated, onFigureDeleted, onFigureNumberingApplied } from "./figures-ui";
import { onTheoremSelection, insertTheorem, updateTheorem, deleteTheorem, applyTheoremNumbering, onTheoremInserted, onTheoremUpdated, onTheoremDeleted, onTheoremNumberingApplied } from "./theorems-ui";
import { onTableSelection, insertTable, updateTableCaption, deleteTable, applyTableNumbering, onTableInserted, onTableUpdated, onTableDeleted, onTableNumberingApplied } from "./tables-ui";
import { insertCrossref, updateAllCrossrefs, onCrossrefInserted, onCrossrefsUpdated, onCrossrefTargetKindChange, updateCrossrefPreview, initCrossrefUI } from "./crossrefs-ui";
import { send, toast, getErrorToastScope, localizeBackendMessage } from "./utils";
import { t, applyLanguage } from "./i18n";

// Expose all functions referenced by inline onclick/onchange/oninput handlers in HTML
Object.assign(window, {
  // Navigation
  setModule,
  openOverlayPage,
  closeOverlayPage,

  // Deck — template
  saveTemplate,
  onActiveTemplateChange,
  onTemplateKindChange,
  onLayoutAreaChange,
  setTemplateSummary,
  onTotalModeChange,
  toggleIndicator,

  // Deck — sources
  checkVarCandidate,
  confirmAddSource,
  cancelAddSource,
  saveSources,
  addRange,
  deleteRange,
  deleteSourceRule,
  updateRange,

  // Deck — sync
  onExcludeChange,
  onSyncStartNumberInput,
  saveSyncSettings,
  applySelectedTemplate,
  syncSelectedTemplate,
  removeSelectedTemplateInstances,
  deleteSelectedTemplate,

  // Equations
  renderEquationInsertPreview,
  renderEquationSelectedPreview,
  insertEquation,
  updateSelectedEquation,
  deleteSelectedEquation,
  applyEquationNumbering,
  clearEquationNumbering,

  // Figures
  insertFigure,
  updateFigureCaption,
  deleteFigure,
  applyFigureNumbering,

  // Theorems
  insertTheorem,
  updateTheorem,
  deleteTheorem,
  applyTheoremNumbering,

  // Tables
  insertTable,
  updateTableCaption,
  deleteTable,
  applyTableNumbering,

  // Cross-references
  insertCrossref,
  updateAllCrossrefs,
  onCrossrefTargetKindChange,
  updateCrossrefPreview,

  // Settings
  saveSettings,

  // Utilities
  send,
});

// Also expose callback functions that navigation/applyLanguage may call via window
(window as any).updateOverview = updateOverviewImpl;
(window as any).refreshTemplatePanels = refreshTemplatePanelsImpl;
(window as any).renderSourceRules = renderSourceRules;
(window as any).renderSyncStep = renderSyncStep;
(window as any).renderBindNote = renderBindNote;

// Message handler
window.onmessage = (event: MessageEvent) => {
  const message = event.data?.pluginMessage || event.data;
  if (!message || !message.type) return;

  switch (message.type) {
    case "selection":
      onSelection(message.node);
      onEquationSelection(message.equation, true);
      onFigureSelection(message.figure, true);
      onTheoremSelection(message.theorem, true);
      onTableSelection(message.table, true);
      break;
    case "templates":
      onTemplates(message.templates);
      break;
    case "template-saved":
      onTemplateSaved(message);
      break;
    case "pages":
      onPagesReceived(message);
      break;
    case "settings":
      onSettingsReceived(message);
      break;
    case "settings-saved":
      onSettingsSaved(message);
      break;
    case "config-saved":
      onConfigSaved();
      break;
    case "apply-complete":
      onApplyComplete(message);
      break;
    case "sync-complete":
      onSyncComplete(message);
      break;
    case "remove-complete":
      toast("sync", t("removedTemplateInstancesDone", { count: message.removed }), "success");
      send("get-templates");
      break;
    case "variable-candidate":
      onVarCandidate(message);
      break;
    case "variables-saved":
      onVariablesSaved();
      break;
    case "equation-inserted":
      onEquationInserted(message);
      break;
    case "equation-updated":
      onEquationUpdated(message);
      break;
    case "equation-deleted":
      onEquationDeleted();
      break;
    case "equation-numbering-applied":
      onEquationNumberingApplied(message);
      break;
    case "equation-numbering-cleared":
      onEquationNumberingCleared(message);
      break;
    case "figure-inserted":
      onFigureInserted(message);
      break;
    case "figure-updated":
      onFigureUpdated(message);
      break;
    case "figure-deleted":
      onFigureDeleted();
      break;
    case "figure-numbering-applied":
      onFigureNumberingApplied(message);
      break;
    case "theorem-inserted":
      onTheoremInserted(message);
      break;
    case "theorem-updated":
      onTheoremUpdated(message);
      break;
    case "theorem-deleted":
      onTheoremDeleted();
      break;
    case "theorem-numbering-applied":
      onTheoremNumberingApplied(message);
      break;
    case "table-inserted":
      onTableInserted(message);
      break;
    case "table-updated":
      onTableUpdated(message);
      break;
    case "table-deleted":
      onTableDeleted();
      break;
    case "table-numbering-applied":
      onTableNumberingApplied(message);
      break;
    case "crossref-inserted":
      onCrossrefInserted(message);
      break;
    case "crossrefs-updated":
      onCrossrefsUpdated(message);
      break;
    case "error":
      toast(getErrorToastScope(), localizeBackendMessage(message.message, message.errorKey, message.errorVars), "error");
      break;
    case "progress":
      toast(getErrorToastScope(), t("progressMessage", { current: message.current + 1, total: message.total }), "info");
      break;
    default:
      break;
  }
};

// Initialize
send("get-selection");
send("get-templates");
send("get-settings");
initSnippets();
initCrossrefUI();

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeOverlayPage();
  }
});

window.addEventListener("mathjax-ready", () => {
  renderEquationInsertPreview();
  renderEquationSelectedPreview();
});

window.addEventListener("mathjax-error", () => {
  toast("template", t("mathjaxLoadFailed"), "error");
});
