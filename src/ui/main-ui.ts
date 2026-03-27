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
import { runConsistencyCheck, autoFixIssue, autoFixAll, highlightIssueNode, onConsistencyResults, onIssueFixed, onAllFixed } from "./consistency-ui";
import { loadReferences, addReference, importBibtex, deleteReference, insertCitation, updateAllCitations, generateBibSlide, onReferencesLoaded, onReferenceAdded, onBibtexImported, onReferenceDeleted, onCitationInserted, onCitationsUpdated, onBibSlideGenerated, initReferencesUI } from "./references-ui";
import { insertChart, deleteChart, onChartSelection, onChartInserted, onChartDeleted, initChartUI } from "./charts-ui";
import { insertSubfigure, updateSubfigure, deleteSubfigure, applySubfigureNumbering, onSubfigureSelection, onSubfigureInserted, onSubfigureUpdated, onSubfigureDeleted, onSubfigureNumberingApplied, onSubfigureLayoutChange } from "./subfigures-ui";
import { insertSlideTemplate, onSlideTemplateInserted } from "./slide-templates-ui";
import { loadSpeakerCues, saveSpeakerCue, autoEstimateAll, clearAllCues, generateTimeBudgetSlide, onSpeakerCuesLoaded, onSpeakerCueSaved, onAutoEstimateComplete, onCuesCleared, onTimeBudgetGenerated, initSpeakerCuesUI } from "./speaker-cues-ui";
import { loadAppendixInfo, insertAppendixDivider, insertBackupLink, insertBackToMainLink, updateAllAppendixLinks, onAppendixInfoLoaded, onAppendixDividerInserted, onBackupLinkInserted, onBackLinkInserted, onAppendixLinksUpdated, onAppendixReordered, initAppendixUI } from "./appendix-ui";
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

  // Consistency
  runConsistencyCheck,
  autoFixIssue,
  autoFixAll,
  highlightIssueNode,

  // References & Citations
  loadReferences,
  addReference,
  importBibtex,
  deleteReference,
  insertCitation,
  updateAllCitations,
  generateBibSlide,

  // Charts
  insertChart,
  deleteChart,

  // Subfigures
  insertSubfigure,
  updateSubfigure,
  deleteSubfigure,
  applySubfigureNumbering,
  onSubfigureLayoutChange,

  // Slide Templates
  insertSlideTemplate,

  // Speaker Cues
  loadSpeakerCues,
  saveSpeakerCue,
  autoEstimateAll,
  clearAllCues,
  generateTimeBudgetSlide,

  // Appendix
  loadAppendixInfo,
  insertAppendixDivider,
  insertBackupLink,
  insertBackToMainLink,
  updateAllAppendixLinks,

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
      onChartSelection(message.chart, true);
      onSubfigureSelection(message.subfigure, true);
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
    case "consistency-results":
      onConsistencyResults(message);
      break;
    case "issue-fixed":
      onIssueFixed(message);
      break;
    case "all-fixed":
      onAllFixed(message);
      break;
    // References & Citations
    case "references-loaded":
      onReferencesLoaded(message);
      break;
    case "reference-added":
      onReferenceAdded(message);
      break;
    case "bibtex-imported":
      onBibtexImported(message);
      break;
    case "reference-deleted":
      onReferenceDeleted(message);
      break;
    case "citation-inserted":
      onCitationInserted(message);
      break;
    case "citations-updated":
      onCitationsUpdated(message);
      break;
    case "bib-slide-generated":
      onBibSlideGenerated(message);
      break;
    // Charts
    case "chart-inserted":
      onChartInserted(message);
      break;
    case "chart-deleted":
      onChartDeleted();
      break;
    // Subfigures
    case "subfigure-inserted":
      onSubfigureInserted(message);
      break;
    case "subfigure-updated":
      onSubfigureUpdated(message);
      break;
    case "subfigure-deleted":
      onSubfigureDeleted();
      break;
    case "subfigure-numbering-applied":
      onSubfigureNumberingApplied(message);
      break;
    // Slide Templates
    case "slide-template-inserted":
      onSlideTemplateInserted(message);
      break;
    // Speaker Cues
    case "speaker-cues-loaded":
      onSpeakerCuesLoaded(message);
      break;
    case "speaker-cue-saved":
      onSpeakerCueSaved(message);
      break;
    case "auto-estimate-complete":
      onAutoEstimateComplete(message);
      break;
    case "speaker-cues-cleared":
      onCuesCleared(message);
      break;
    case "time-budget-slide-generated":
      onTimeBudgetGenerated(message);
      break;
    // Appendix
    case "appendix-info":
      onAppendixInfoLoaded(message);
      break;
    case "appendix-divider-inserted":
      onAppendixDividerInserted(message);
      break;
    case "backup-link-inserted":
      onBackupLinkInserted(message);
      break;
    case "back-link-inserted":
      onBackLinkInserted(message);
      break;
    case "appendix-links-updated":
      onAppendixLinksUpdated(message);
      break;
    case "appendix-reordered":
      onAppendixReordered(message);
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
initReferencesUI();
initChartUI();
initSpeakerCuesUI();
initAppendixUI();

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
