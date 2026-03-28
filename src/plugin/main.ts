/// <reference types="@figma/plugin-typings" />

import { handleGetSelection, handleInsertEquation, handleUpdateEquation, handleDeleteEquation, handleApplyEquationNumbering, handleClearEquationNumbering } from "./equations";
import { handleSetTemplate, handleUpdateTemplateConfig, handleApplyToAll, handleSyncAll, handleRemoveTemplateInstances, handleGetTemplates, handleDeleteTemplate, handleCheckVariableCandidate, handleSaveVariables } from "./templates";
import { handleInsertFigure, handleUpdateFigureCaption, handleDeleteFigure, handleApplyFigureNumbering, findFigureRoot, serializeFigureNode } from "./figures";
import { handleInsertTheorem, handleUpdateTheorem, handleDeleteTheorem, handleApplyTheoremNumbering, findTheoremRoot, serializeTheoremNode } from "./theorems";
import { handleInsertTable, handleUpdateTableCaption, handleDeleteTable, handleApplyTableNumbering, findTableRoot, serializeTableNode } from "./tables";
import { handleInsertCrossref, handleUpdateAllCrossrefs } from "./crossrefs";
import { handleGetReferences, handleAddReference, handleImportBibtex, handleDeleteReference, handleInsertCitation, handleUpdateAllCitations, handleGenerateBibliographySlide, findCitationRoot, serializeCitationNode } from "./references";
import { handleInsertChart, handleDeleteChart, findChartRoot, serializeChartNode } from "./charts";
import { handleInsertSubfigure, handleUpdateSubfigure, handleDeleteSubfigure, handleApplySubfigureNumbering, findSubfigureRoot, serializeSubfigureNode } from "./subfigures";
import { handleInsertSlideTemplate } from "./slide-templates";
import { handleRunConsistencyCheck, handleAutoFixIssue, handleAutoFixAll, handleFocusNode } from "./consistency";
import { handleGetSpeakerCues, handleSetSpeakerCue, handleClearAllCues, handleAutoEstimateAll, handleInsertTimeBudgetSlide } from "./speaker-cues";
import { handleInsertAppendixDivider, handleInsertBackupLink, handleInsertBackToMainLink, handleGetAppendixInfo, handleReorderAppendix, handleUpdateAllAppendixLinks } from "./appendix";
import { handleExportBeamer } from "./export-beamer";
import { postError } from "./errors";
import { getStorage, saveStorage } from "./storage";
import { normalizeSettings } from "./normalize";
import { ensureAllPagesLoaded, listPages } from "./slides";
import type { PluginMessage } from "../shared/messages";

const RUNTIME_VERSION = "dev-20250318-01";

figma.showUI(__html__, {
  width: 360,
  height: 640,
  title: "Academic Slides Toolkit · " + RUNTIME_VERSION,
});

// ── Local handlers ──────────────────────────────────────────────────────

async function handleGetPages(message: PluginMessage): Promise<void> {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const tid = "templateId" in message ? (message as any).templateId : null;
  const template = tid ? storage.templates[tid] : null;

  figma.ui.postMessage({
    type: "pages",
    templateId: tid || null,
    sourcePageId: template ? template.pageId : null,
    pages: listPages(),
  });
}

async function handleGetSettings(): Promise<void> {
  const storage = await getStorage();
  figma.ui.postMessage({
    type: "settings",
    settings: normalizeSettings(storage.settings),
  });
}

async function handleSaveSettings(message: PluginMessage): Promise<void> {
  const storage = await getStorage();
  storage.settings = normalizeSettings("settings" in message ? (message as any).settings : undefined);
  await saveStorage(storage);

  figma.ui.postMessage({
    type: "settings-saved",
    settings: normalizeSettings(storage.settings),
  });
}

async function handleGetSelectionCmd(): Promise<void> {
  const sel = figma.currentPage.selection;
  const selNode = sel.length > 0 ? sel[0] : null;
  await handleGetSelection({
    figure: serializeFigureNode(selNode ? findFigureRoot(selNode) : null),
    theorem: serializeTheoremNode(selNode ? findTheoremRoot(selNode) : null),
    table: serializeTableNode(selNode ? findTableRoot(selNode) : null),
    citation: serializeCitationNode(selNode ? findCitationRoot(selNode) : null),
    chart: serializeChartNode(selNode ? findChartRoot(selNode) : null),
    subfigure: serializeSubfigureNode(selNode ? findSubfigureRoot(selNode) : null),
  });
}

// ── Command table — registry replaces the 56-case switch ────────────────

type CommandHandler = (message: PluginMessage) => Promise<void> | void;

const commands: Record<string, CommandHandler> = {
  // Settings
  "get-settings":              () => handleGetSettings(),
  "save-settings":             (m) => handleSaveSettings(m),
  "get-selection":             () => handleGetSelectionCmd(),
  "get-pages":                 (m) => handleGetPages(m),
  // Equations
  "insert-equation":           (m) => handleInsertEquation(m),
  "update-equation":           (m) => handleUpdateEquation(m),
  "delete-equation":           (m) => handleDeleteEquation(m),
  "apply-equation-numbering":  (m) => handleApplyEquationNumbering(m),
  "clear-equation-numbering":  (m) => handleClearEquationNumbering(m),
  // Templates
  "set-template":              (m) => handleSetTemplate(m),
  "update-template-config":    (m) => handleUpdateTemplateConfig(m),
  "apply-to-all":              (m) => handleApplyToAll(m),
  "sync-all":                  (m) => handleSyncAll(m),
  "remove-template-instances": (m) => handleRemoveTemplateInstances((m as any).templateId),
  "get-templates":             () => handleGetTemplates(),
  "delete-template":           (m) => handleDeleteTemplate((m as any).templateId),
  "check-variable-candidate":  (m) => handleCheckVariableCandidate(m),
  "save-variables":            (m) => handleSaveVariables(m),
  // Figures
  "insert-figure":             (m) => handleInsertFigure(m),
  "update-figure-caption":     (m) => handleUpdateFigureCaption(m),
  "delete-figure":             (m) => handleDeleteFigure(m),
  "apply-figure-numbering":    (m) => handleApplyFigureNumbering(m),
  // Theorems
  "insert-theorem":            (m) => handleInsertTheorem(m),
  "update-theorem":            (m) => handleUpdateTheorem(m),
  "delete-theorem":            (m) => handleDeleteTheorem(m),
  "apply-theorem-numbering":   (m) => handleApplyTheoremNumbering(m),
  // Tables
  "insert-table":              (m) => handleInsertTable(m),
  "update-table-caption":      (m) => handleUpdateTableCaption(m),
  "delete-table":              (m) => handleDeleteTable(m),
  "apply-table-numbering":     (m) => handleApplyTableNumbering(m),
  // Cross-references
  "insert-crossref":           (m) => handleInsertCrossref(m),
  "update-all-crossrefs":      (m) => handleUpdateAllCrossrefs(m),
  // Consistency
  "run-consistency-check":     (m) => handleRunConsistencyCheck(m),
  "auto-fix-issue":            (m) => handleAutoFixIssue(m),
  "auto-fix-all":              (m) => handleAutoFixAll(m),
  "focus-node":                (m) => handleFocusNode(m),
  // References & Citations
  "get-references":            (m) => handleGetReferences(m),
  "add-reference":             (m) => handleAddReference(m),
  "import-bibtex":             (m) => handleImportBibtex(m),
  "delete-reference":          (m) => handleDeleteReference(m),
  "insert-citation":           (m) => handleInsertCitation(m),
  "update-all-citations":      (m) => handleUpdateAllCitations(m),
  "generate-bib-slide":        (m) => handleGenerateBibliographySlide(m),
  // Charts
  "insert-chart":              (m) => handleInsertChart(m),
  "delete-chart":              (m) => handleDeleteChart(m),
  // Subfigures
  "insert-subfigure":          (m) => handleInsertSubfigure(m),
  "update-subfigure":          (m) => handleUpdateSubfigure(m),
  "delete-subfigure":          (m) => handleDeleteSubfigure(m),
  "apply-subfigure-numbering": (m) => handleApplySubfigureNumbering(m),
  // Slide Templates
  "insert-slide-template":     (m) => handleInsertSlideTemplate(m),
  // Speaker Cues
  "get-speaker-cues":          (m) => handleGetSpeakerCues(m),
  "set-speaker-cue":           (m) => handleSetSpeakerCue(m),
  "clear-all-cues":            (m) => handleClearAllCues(m),
  "auto-estimate-all":         (m) => handleAutoEstimateAll(m),
  "generate-time-budget-slide":(m) => handleInsertTimeBudgetSlide(m),
  // Appendix
  "insert-appendix-divider":   (m) => handleInsertAppendixDivider(m),
  "insert-backup-link":        (m) => handleInsertBackupLink(m),
  "insert-back-to-main-link":  (m) => handleInsertBackToMainLink(m),
  "get-appendix-info":         (m) => handleGetAppendixInfo(m),
  "reorder-appendix":          (m) => handleReorderAppendix(m),
  "update-all-appendix-links": (m) => handleUpdateAllAppendixLinks(m),
  // Export
  "export-beamer":             (m) => handleExportBeamer(m),
};

// ── Dispatcher ──────────────────────────────────────────────────────────

figma.ui.onmessage = async (message: PluginMessage) => {
  try {
    const handler = commands[message.type];
    if (handler) await handler(message);
  } catch (error: unknown) {
    const err = error as { message?: string; errorKey?: string; errorVars?: Record<string, string> };
    postError(
      `操作失败：${err.message || String(error)}`,
      err.errorKey || "errorOperationFailed",
      err.errorVars || {},
    );
    console.error("[AcademicSlides]", error);
  }
};

figma.on("selectionchange", () => {
  const sel = figma.currentPage.selection;
  const selNode = sel.length > 0 ? sel[0] : null;
  handleGetSelection({
    figure: serializeFigureNode(selNode ? findFigureRoot(selNode) : null),
    theorem: serializeTheoremNode(selNode ? findTheoremRoot(selNode) : null),
    table: serializeTableNode(selNode ? findTableRoot(selNode) : null),
    citation: serializeCitationNode(selNode ? findCitationRoot(selNode) : null),
    chart: serializeChartNode(selNode ? findChartRoot(selNode) : null),
    subfigure: serializeSubfigureNode(selNode ? findSubfigureRoot(selNode) : null),
  });
});

handleGetSelection();
handleGetTemplates();
