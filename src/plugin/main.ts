/// <reference types="@figma/plugin-typings" />

import { handleGetSelection, handleInsertEquation, handleUpdateEquation, handleDeleteEquation, handleApplyEquationNumbering, handleClearEquationNumbering } from "./equations";
import { handleSetTemplate, handleUpdateTemplateConfig, handleApplyToAll, handleSyncAll, handleRemoveTemplateInstances, handleGetTemplates, handleDeleteTemplate, handleCheckVariableCandidate, handleSaveVariables } from "./templates";
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
      case "get-selection":
        await handleGetSelection();
        break;
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

figma.on("selectionchange", () => { handleGetSelection(); });

handleGetSelection();
handleGetTemplates();
