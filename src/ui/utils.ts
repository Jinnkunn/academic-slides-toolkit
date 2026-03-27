// ---------------------------------------------------------------------------
// UI utility functions – extracted from ui.html (lines ~3033-3113, 2629-2760)
// ---------------------------------------------------------------------------

import { state } from "./state";
import { getMessages, t } from "./i18n";

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/** Send a typed message to the Figma plugin backend. */
export function send(type: string, extra?: Record<string, any>): void {
  const pluginMessage: Record<string, any> = { type };
  if (extra) {
    for (const key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) {
        pluginMessage[key] = extra[key];
      }
    }
  }
  parent.postMessage({ pluginMessage }, "*");
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

/** Show a transient toast message inside the panel identified by `scope`. */
export function toast(scope: string, message: string, type?: string): void {
  const element = document.getElementById("toast-" + scope) as HTMLElement | null;
  if (!element) return;

  element.textContent = message;
  element.className = "toast show " + (type || "info");
  clearTimeout((element as any)._timer);
  (element as any)._timer = setTimeout(function () {
    element.classList.remove("show");
  }, 3800);
}

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

/** Look up a template object by its id. */
export function getTemplateById(templateId: string | null): any {
  for (let index = 0; index < state.allTemplates.length; index++) {
    if (state.allTemplates[index].id === templateId) {
      return state.allTemplates[index];
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

/** Return the human-readable name of a page given its id. */
export function getPageName(pageId: string): string {
  const pages = state.pagesCache || [];
  for (let index = 0; index < pages.length; index++) {
    if (pages[index].id === pageId) return pages[index].name;
  }
  return "";
}

/** Return the zero-based index of a page given its id, or -1 if not found. */
export function getPageIndex(pageId: string): number {
  const pages = state.pagesCache || [];
  for (let index = 0; index < pages.length; index++) {
    if (pages[index].id === pageId) return pages[index].index;
  }
  return -1;
}

/** Return a user-friendly label for a page, e.g. "Slide 3 · My Page". */
export function describePage(pageId: string): string {
  const name = getPageName(pageId);
  const index = getPageIndex(pageId);
  if (!name) return t("sourceMissingPage");
  return t("slideLabel", { index: index + 1, name });
}

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

/** Return the localised label for a template kind (header / footer / custom). */
export function getTemplateKindLabel(kind: string): string {
  if (kind === "header") return t("templateKindHeader");
  if (kind === "footer") return t("templateKindFooter");
  return t("templateKindCustom");
}

/** Return the localised label for a placement mode. */
export function getPlacementLabel(mode: string): string {
  if (mode === "top-left") return t("placementTopLeft");
  if (mode === "top-center") return t("placementTopCenter");
  if (mode === "top-right") return t("placementTopRight");
  if (mode === "bottom-left") return t("placementBottomLeft");
  if (mode === "bottom-center") return t("placementBottomCenter");
  if (mode === "bottom-right") return t("placementBottomRight");
  return t("placementCustom");
}

/** Return the default placement for a given template kind. */
export function getDefaultPlacementForKind(kind: string): string {
  if (kind === "header") return "top-center";
  if (kind === "footer") return "bottom-center";
  return "custom";
}

/** Return the localised label for a layout area. */
export function getLayoutAreaLabel(area: string): string {
  return area === "safe-area" ? t("layoutAreaSafeArea") : t("layoutAreaSlide");
}

// ---------------------------------------------------------------------------
// Backend message localisation
// ---------------------------------------------------------------------------

/**
 * Attempt to translate a backend error message.  If an explicit `errorKey`
 * is provided and exists in the current message catalogue it is used;
 * otherwise the raw `message` string is returned (with a small fixup when
 * running in en-US mode and the string carries the Chinese prefix).
 */
export function localizeBackendMessage(
  message: string,
  errorKey?: string,
  errorVars?: Record<string, string | number>,
): string {
  if (errorKey) {
    const messages = getMessages();
    if (Object.prototype.hasOwnProperty.call(messages, errorKey)) {
      return t(errorKey, errorVars || {});
    }
  }

  const raw = String(message || "");
  if (!raw) return raw;
  if (state.currentLanguage !== "en-US") return raw;

  if (raw.indexOf("\u64cd\u4f5c\u5931\u8d25\uff1a") === 0) {
    // "操作失败：" prefix
    return t("errorOperationFailed") + ": " + localizeBackendMessage(raw.slice(5), "", {});
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Toast scope helpers
// ---------------------------------------------------------------------------

/** Determine which toast container to target for generic errors. */
export function getErrorToastScope(): string {
  if (state.activeOverlay) {
    if (
      state.activeOverlay.moduleId === "deck" &&
      (state.activeOverlay.pageId === "template" ||
        state.activeOverlay.pageId === "sources" ||
        state.activeOverlay.pageId === "sync")
    ) {
      return state.activeOverlay.pageId;
    }
    if (state.activeOverlay.moduleId === "equations") return getEquationToastScope();
  }
  if (state.currentModule === "equations") return getEquationToastScope();
  if (state.currentModule === "settings") return "settings";
  if (state.currentModule === "deck") return "sync";
  return "sync";
}

/** Determine which toast container to target for equation-related messages. */
export function getEquationToastScope(): string {
  if (state.activeOverlay && state.activeOverlay.moduleId === "equations") {
    if (state.activeOverlay.pageId === "selected") return "equations-selected";
    if (state.activeOverlay.pageId === "numbering") return "equations-numbering";
    if (state.activeOverlay.pageId === "insert") return "equations";
  }
  return "equations-overview";
}
