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
import { postError } from "./errors";
import { getStorage } from "./storage";
import { normalizeSettings } from "./normalize";
import { ensureAllPagesLoaded, listPages } from "./slides";

const RUNTIME_VERSION = "dev-20250318-01";

figma.showUI(__html__, {
  width: 360,
  height: 640,
  title: "Academic Slides Toolkit · " + RUNTIME_VERSION,
});

async function handleGetPages(message: any): Promise<void> {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = message.templateId ? storage.templates[message.templateId] : null;

  figma.ui.postMessage({
    type: "pages",
    templateId: message.templateId || null,
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

async function handleSaveSettings(message: any): Promise<void> {
  const storage = await getStorage();
  storage.settings = normalizeSettings(message && message.settings);
  const { saveStorage } = await import("./storage");
  await saveStorage(storage);

  figma.ui.postMessage({
    type: "settings-saved",
    settings: normalizeSettings(storage.settings),
  });
}

figma.ui.onmessage = async (message: any) => {
  try {
    switch (message.type) {
      case "get-settings":
        await handleGetSettings();
        break;
      case "save-settings":
        await handleSaveSettings(message);
        break;
      case "get-selection": {
        const sel = figma.currentPage.selection;
        const selNode = sel.length > 0 ? sel[0] : null;
        const figRoot = selNode ? findFigureRoot(selNode) : null;
        const thmRoot = selNode ? findTheoremRoot(selNode) : null;
        const tblRoot = selNode ? findTableRoot(selNode) : null;
        const citRoot = selNode ? findCitationRoot(selNode) : null;
        const chartRoot = selNode ? findChartRoot(selNode) : null;
        const subfigRoot = selNode ? findSubfigureRoot(selNode) : null;
        await handleGetSelection({
          figure: serializeFigureNode(figRoot),
          theorem: serializeTheoremNode(thmRoot),
          table: serializeTableNode(tblRoot),
          citation: serializeCitationNode(citRoot),
          chart: serializeChartNode(chartRoot),
          subfigure: serializeSubfigureNode(subfigRoot),
        });
        break;
      }
      case "get-pages":
        await handleGetPages(message);
        break;
      case "insert-equation":
        await handleInsertEquation(message);
        break;
      case "update-equation":
        await handleUpdateEquation(message);
        break;
      case "delete-equation":
        await handleDeleteEquation(message);
        break;
      case "apply-equation-numbering":
        await handleApplyEquationNumbering(message);
        break;
      case "clear-equation-numbering":
        await handleClearEquationNumbering(message);
        break;
      case "set-template":
        await handleSetTemplate(message);
        break;
      case "update-template-config":
        await handleUpdateTemplateConfig(message);
        break;
      case "apply-to-all":
        await handleApplyToAll(message);
        break;
      case "sync-all":
        await handleSyncAll(message);
        break;
      case "remove-template-instances":
        await handleRemoveTemplateInstances(message.templateId);
        break;
      case "get-templates":
        await handleGetTemplates();
        break;
      case "delete-template":
        await handleDeleteTemplate(message.templateId);
        break;
      case "check-variable-candidate":
        await handleCheckVariableCandidate(message);
        break;
      case "save-variables":
        await handleSaveVariables(message);
        break;
      case "insert-figure":
        await handleInsertFigure(message);
        break;
      case "update-figure-caption":
        await handleUpdateFigureCaption(message);
        break;
      case "delete-figure":
        await handleDeleteFigure(message);
        break;
      case "apply-figure-numbering":
        await handleApplyFigureNumbering(message);
        break;
      case "insert-theorem":
        await handleInsertTheorem(message);
        break;
      case "update-theorem":
        await handleUpdateTheorem(message);
        break;
      case "delete-theorem":
        await handleDeleteTheorem(message);
        break;
      case "apply-theorem-numbering":
        await handleApplyTheoremNumbering(message);
        break;
      case "insert-table":
        await handleInsertTable(message);
        break;
      case "update-table-caption":
        await handleUpdateTableCaption(message);
        break;
      case "delete-table":
        await handleDeleteTable(message);
        break;
      case "apply-table-numbering":
        await handleApplyTableNumbering(message);
        break;
      case "insert-crossref":
        await handleInsertCrossref(message);
        break;
      case "update-all-crossrefs":
        await handleUpdateAllCrossrefs(message);
        break;
      case "run-consistency-check":
        await handleRunConsistencyCheck(message);
        break;
      case "auto-fix-issue":
        await handleAutoFixIssue(message);
        break;
      case "auto-fix-all":
        await handleAutoFixAll(message);
        break;
      case "focus-node":
        handleFocusNode(message);
        break;
      // References & Citations
      case "get-references":
        await handleGetReferences(message);
        break;
      case "add-reference":
        await handleAddReference(message);
        break;
      case "import-bibtex":
        await handleImportBibtex(message);
        break;
      case "delete-reference":
        await handleDeleteReference(message);
        break;
      case "insert-citation":
        await handleInsertCitation(message);
        break;
      case "update-all-citations":
        await handleUpdateAllCitations(message);
        break;
      case "generate-bib-slide":
        await handleGenerateBibliographySlide(message);
        break;
      // Charts
      case "insert-chart":
        await handleInsertChart(message);
        break;
      case "delete-chart":
        await handleDeleteChart(message);
        break;
      // Subfigures
      case "insert-subfigure":
        await handleInsertSubfigure(message);
        break;
      case "update-subfigure":
        await handleUpdateSubfigure(message);
        break;
      case "delete-subfigure":
        await handleDeleteSubfigure(message);
        break;
      case "apply-subfigure-numbering":
        await handleApplySubfigureNumbering(message);
        break;
      // Slide Templates
      case "insert-slide-template":
        await handleInsertSlideTemplate(message);
        break;
      // Speaker Cues & Time Budget
      case "get-speaker-cues":
        await handleGetSpeakerCues(message);
        break;
      case "set-speaker-cue":
        await handleSetSpeakerCue(message);
        break;
      case "clear-all-cues":
        await handleClearAllCues(message);
        break;
      case "auto-estimate-all":
        await handleAutoEstimateAll(message);
        break;
      case "generate-time-budget-slide":
        await handleInsertTimeBudgetSlide(message);
        break;
      // Appendix
      case "insert-appendix-divider":
        await handleInsertAppendixDivider(message);
        break;
      case "insert-backup-link":
        await handleInsertBackupLink(message);
        break;
      case "insert-back-to-main-link":
        await handleInsertBackToMainLink(message);
        break;
      case "get-appendix-info":
        await handleGetAppendixInfo(message);
        break;
      case "reorder-appendix":
        await handleReorderAppendix(message);
        break;
      case "update-all-appendix-links":
        await handleUpdateAllAppendixLinks(message);
        break;
      default:
        break;
    }
  } catch (error: any) {
    const errorKey = error && error.errorKey ? error.errorKey : "";
    const errorVars = error && error.errorVars ? error.errorVars : {};
    postError(
      `操作失败：${error && error.message ? error.message : String(error)}`,
      errorKey || "errorOperationFailed",
      errorVars,
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
