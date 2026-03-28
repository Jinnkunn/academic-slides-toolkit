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
import { exportBeamer, onExportComplete } from "./export-ui";
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

  // Export
  exportBeamer,

  // Utilities
  send,
});

// Also expose callback functions that navigation/applyLanguage may call via window
(window as any).updateOverview = updateOverviewImpl;
(window as any).refreshTemplatePanels = refreshTemplatePanelsImpl;
(window as any).renderSourceRules = renderSourceRules;
(window as any).renderSyncStep = renderSyncStep;
(window as any).renderBindNote = renderBindNote;

// ── Response table — registry replaces the 61-case switch ───────────────

type ResponseHandler = (message: any) => void;

const responses: Record<string, ResponseHandler> = {
  // Selection & Navigation
  "selection": (m) => {
    onSelection(m.node);
    onEquationSelection(m.equation, true);
    onFigureSelection(m.figure, true);
    onTheoremSelection(m.theorem, true);
    onTableSelection(m.table, true);
    onChartSelection(m.chart, true);
    onSubfigureSelection(m.subfigure, true);
  },
  "pages":                      (m) => onPagesReceived(m),
  // Settings
  "settings":                   (m) => onSettingsReceived(m),
  "settings-saved":             (m) => onSettingsSaved(m),
  // Templates
  "templates":                  (m) => onTemplates(m.templates),
  "template-saved":             (m) => onTemplateSaved(m),
  "config-saved":               () => onConfigSaved(),
  "apply-complete":             (m) => onApplyComplete(m),
  "sync-complete":              (m) => onSyncComplete(m),
  "remove-complete":            (m) => { toast("sync", t("removedTemplateInstancesDone", { count: m.removed }), "success"); send("get-templates"); },
  "variable-candidate":         (m) => onVarCandidate(m),
  "variables-saved":            () => onVariablesSaved(),
  // Equations
  "equation-inserted":          (m) => onEquationInserted(m),
  "equation-updated":           (m) => onEquationUpdated(m),
  "equation-deleted":           () => onEquationDeleted(),
  "equation-numbering-applied": (m) => onEquationNumberingApplied(m),
  "equation-numbering-cleared": (m) => onEquationNumberingCleared(m),
  // Figures
  "figure-inserted":            (m) => onFigureInserted(m),
  "figure-updated":             (m) => onFigureUpdated(m),
  "figure-deleted":             () => onFigureDeleted(),
  "figure-numbering-applied":   (m) => onFigureNumberingApplied(m),
  // Theorems
  "theorem-inserted":           (m) => onTheoremInserted(m),
  "theorem-updated":            (m) => onTheoremUpdated(m),
  "theorem-deleted":            () => onTheoremDeleted(),
  "theorem-numbering-applied":  (m) => onTheoremNumberingApplied(m),
  // Tables
  "table-inserted":             (m) => onTableInserted(m),
  "table-updated":              (m) => onTableUpdated(m),
  "table-deleted":              () => onTableDeleted(),
  "table-numbering-applied":    (m) => onTableNumberingApplied(m),
  // Cross-references
  "crossref-inserted":          (m) => onCrossrefInserted(m),
  "crossrefs-updated":          (m) => onCrossrefsUpdated(m),
  // Consistency
  "consistency-results":        (m) => onConsistencyResults(m),
  "issue-fixed":                (m) => onIssueFixed(m),
  "all-fixed":                  (m) => onAllFixed(m),
  // References & Citations
  "references-loaded":          (m) => onReferencesLoaded(m),
  "reference-added":            (m) => onReferenceAdded(m),
  "bibtex-imported":            (m) => onBibtexImported(m),
  "reference-deleted":          (m) => onReferenceDeleted(m),
  "citation-inserted":          (m) => onCitationInserted(m),
  "citations-updated":          (m) => onCitationsUpdated(m),
  "bib-slide-generated":        (m) => onBibSlideGenerated(m),
  // Charts
  "chart-inserted":             (m) => onChartInserted(m),
  "chart-deleted":              () => onChartDeleted(),
  // Subfigures
  "subfigure-inserted":         (m) => onSubfigureInserted(m),
  "subfigure-updated":          (m) => onSubfigureUpdated(m),
  "subfigure-deleted":          () => onSubfigureDeleted(),
  "subfigure-numbering-applied":(m) => onSubfigureNumberingApplied(m),
  // Slide Templates
  "slide-template-inserted":    (m) => onSlideTemplateInserted(m),
  // Speaker Cues
  "speaker-cues-loaded":        (m) => onSpeakerCuesLoaded(m),
  "speaker-cue-saved":          (m) => onSpeakerCueSaved(m),
  "auto-estimate-complete":     (m) => onAutoEstimateComplete(m),
  "speaker-cues-cleared":       (m) => onCuesCleared(m),
  "time-budget-slide-generated":(m) => onTimeBudgetGenerated(m),
  // Appendix
  "appendix-info":              (m) => onAppendixInfoLoaded(m),
  "appendix-divider-inserted":  (m) => onAppendixDividerInserted(m),
  "backup-link-inserted":       (m) => onBackupLinkInserted(m),
  "back-link-inserted":         (m) => onBackLinkInserted(m),
  "appendix-links-updated":     (m) => onAppendixLinksUpdated(m),
  "appendix-reordered":         (m) => onAppendixReordered(m),
  // Export
  "export-complete":            (m) => onExportComplete(m),
  // System
  "error":                      (m) => toast(getErrorToastScope(), localizeBackendMessage(m.message, m.errorKey, m.errorVars), "error"),
  "progress":                   (m) => toast(getErrorToastScope(), t("progressMessage", { current: m.current + 1, total: m.total }), "info"),
};

// ── Dispatcher ──────────────────────────────────────────────────────────

window.onmessage = (event: MessageEvent) => {
  const message = event.data?.pluginMessage || event.data;
  if (!message?.type) return;
  const handler = responses[message.type];
  if (handler) handler(message);
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
