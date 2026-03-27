// ---------------------------------------------------------------------------
// Navigation functions -- extracted from ui.html
// ---------------------------------------------------------------------------

import { state, defaultModulePages } from "./state";

// These will be provided by a future utils.ts / i18n.ts or are assumed
// globally available in the UI runtime.  Declare them so the file compiles.
declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function esc(value: string): string;
declare function getMessages(): Record<string, string>;
declare function getTemplateById(templateId: string | null): any;
declare function getPageName(pageId: string): string;

// Forward-declared cross-module helpers (will live in their own modules)
declare function renderSourceRules(): void;
declare function renderSyncStep(): void;
declare function renderBindNote(): void;
declare function setTemplateSummary(): void;
declare function onEquationSelection(equation: any): void;
declare function renderEquationInsertPreview(): void;
declare function refreshTemplatePanels(): void;
declare function updateOverview(): void;
declare function cloneSourceRules(variables: any[], template: any): any[];
declare function renderStaticLanguage(): void;
declare function setText(id: string, key: string): void;
declare function applyLanguage(): void;

// ---------------------------------------------------------------------------
// setModule  (ui.html ~line 2571)
// ---------------------------------------------------------------------------
export function setModule(moduleId: string): void {
  if (!confirmDiscardSourceDrafts(moduleId, null)) {
    return;
  }
  state.currentModule = moduleId;
  state.activeOverlay = null;
  renderModuleShell();
}

// ---------------------------------------------------------------------------
// openOverlayPage  (ui.html ~line 2580)
// ---------------------------------------------------------------------------
export function openOverlayPage(moduleId: string, pageId: string): void {
  if (!confirmDiscardSourceDrafts(moduleId, pageId)) {
    return;
  }
  state.currentModule = moduleId;
  state.activeOverlay = {
    moduleId: moduleId,
    pageId: pageId,
  };
  if (moduleId === "deck" && (pageId === "sources" || pageId === "sync")) {
    requestPages(true);
  }
  renderModuleShell();
  setTimeout(function () {
    var focusTargetId = "";
    if (moduleId === "equations" && pageId === "insert") focusTargetId = "equation-input";
    if (moduleId === "equations" && pageId === "selected") focusTargetId = "equation-selected-input";
    if (moduleId === "deck" && pageId === "template") focusTargetId = "tpl-name";
    if (moduleId === "deck" && pageId === "sources") focusTargetId = "source-name-input";
    if (moduleId === "components" && pageId === "theorem") focusTargetId = "theorem-type-select";
    if (moduleId === "components" && pageId === "table") focusTargetId = "table-caption-input";
    if (moduleId === "components" && pageId === "crossref") focusTargetId = "crossref-target-kind";

    if (focusTargetId) {
      var focusTarget = document.getElementById(focusTargetId) as HTMLInputElement | null;
      if (focusTarget && !focusTarget.disabled) {
        focusTarget.focus();
      }
    }
  }, 0);
}

// ---------------------------------------------------------------------------
// closeOverlayPage  (ui.html ~line 2609)
// ---------------------------------------------------------------------------
export function closeOverlayPage(): void {
  if (!confirmDiscardSourceDrafts(state.currentModule, null)) {
    return;
  }
  state.activeOverlay = null;
  renderModuleShell();
}

// ---------------------------------------------------------------------------
// requestPages  (ui.html ~line 2617)
// ---------------------------------------------------------------------------
export function requestPages(force?: boolean): void {
  if (!state.activeTemplateId) return;
  if (force) {
    state.pagesCache = null;
  }
  send("get-pages", { templateId: state.activeTemplateId });
}

// ---------------------------------------------------------------------------
// setSourcesDirty  (ui.html ~line 2625)
// ---------------------------------------------------------------------------
export function setSourcesDirty(isDirty: boolean): void {
  state.editingSourcesDirty = !!isDirty;
}

// ---------------------------------------------------------------------------
// discardSourceDrafts  (ui.html ~line 2671)
// ---------------------------------------------------------------------------
export function discardSourceDrafts(): void {
  const template = getTemplateById(state.activeTemplateId);
  state.editingSources = template ? cloneSourceRules(template.variables || [], template) : [];
  state.pendingSource = null;
  state.lastSourceCandidateError = "";
  setSourcesDirty(false);
  renderBindNote();
  renderSourceRules();
}

// ---------------------------------------------------------------------------
// confirmDiscardSourceDrafts  (ui.html ~line 2681)
// ---------------------------------------------------------------------------
export function confirmDiscardSourceDrafts(nextModuleId: string, nextPageId: string | null): boolean {
  const currentIsSources = !!(state.activeOverlay && state.activeOverlay.moduleId === "deck" && state.activeOverlay.pageId === "sources");
  if (!state.editingSourcesDirty || !currentIsSources) {
    return true;
  }

  if (nextModuleId === "deck" && nextPageId === "sources") {
    return true;
  }

  if (!confirm(t("discardUnsavedSourcesConfirm"))) {
    return false;
  }

  discardSourceDrafts();
  return true;
}

// ---------------------------------------------------------------------------
// refreshTemplatePanels  (ui.html ~line 2699)
// ---------------------------------------------------------------------------
export function refreshTemplatePanelsImpl(): void {
  const template = getTemplateById(state.activeTemplateId);
  const sourceStatus = document.getElementById("source-status");
  const sourceBindBox = document.getElementById("source-bind-box");
  const saveSourcesButton = document.getElementById("save-sources-btn");
  const syncSettings = document.getElementById("sync-settings");

  if (!template) {
    if (sourceStatus) {
      sourceStatus.textContent = t("sourceEmpty");
      sourceStatus.className = "status";
    }
    if (sourceBindBox) sourceBindBox.style.display = "none";
    if (saveSourcesButton) saveSourcesButton.style.display = "none";
    if (syncSettings) syncSettings.style.display = "none";
    return;
  }

  if (sourceStatus) {
    sourceStatus.textContent = t("sourceActive", { name: template.name });
    sourceStatus.className = "status active";
  }
  if (sourceBindBox) sourceBindBox.style.display = "grid";
  if (saveSourcesButton) saveSourcesButton.style.display = "block";
  if (syncSettings) syncSettings.style.display = "grid";
}

// ---------------------------------------------------------------------------
// updateModuleContext  (ui.html ~line 2762)
// ---------------------------------------------------------------------------
export function updateModuleContext(): void {
  var label = document.getElementById("module-context-label");
  var detail = document.getElementById("module-context-detail");
  if (!label || !detail) return;

  var moduleTab = document.getElementById("module-tab-" + state.currentModule);
  var moduleText = moduleTab ? moduleTab.textContent!.trim() : state.currentModule;
  var detailId = state.activeOverlay
    ? state.activeOverlay.moduleId + "-subnav-" + state.activeOverlay.pageId
    : state.currentModule + "-subnav-" + defaultModulePages[state.currentModule];
  var detailButton = document.getElementById(detailId);
  var detailText = detailButton ? detailButton.textContent!.trim() : "";

  label.textContent = moduleText;
  detail.textContent = detailText;
}

// ---------------------------------------------------------------------------
// renderModuleShell  (ui.html ~line 2779)
// ---------------------------------------------------------------------------
export function renderModuleShell(): void {
  document.documentElement.style.setProperty(
    "--overlay-top",
    (document.querySelector(".topbar") as HTMLElement).offsetHeight + "px"
  );
  const modules = ["deck", "equations", "components", "assets", "settings"];

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const moduleId = modules[moduleIndex];
    const moduleTab = document.getElementById("module-tab-" + moduleId);
    const moduleView = document.getElementById("module-view-" + moduleId);
    if (moduleTab) moduleTab.classList.toggle("active", moduleId === state.currentModule);
    if (moduleView) moduleView.classList.toggle("is-hidden", moduleId !== state.currentModule);
  }

  const pageConfig: Record<string, string[]> = {
    deck: ["overview", "template", "sources", "sync"],
    equations: ["overview", "insert", "selected", "numbering"],
    components: ["library", "figure", "theorem", "table", "crossref"],
    assets: ["references", "charts", "captions"],
    settings: ["language"],
  };

  const backdrop = document.getElementById("overlay-backdrop")!;
  backdrop.classList.toggle("is-hidden", !state.activeOverlay);

  for (const moduleId in pageConfig) {
    if (!Object.prototype.hasOwnProperty.call(pageConfig, moduleId)) continue;
    const pages = pageConfig[moduleId];
    const activePage = defaultModulePages[moduleId];

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageId = pages[pageIndex];
      const page = document.getElementById(moduleId + "-page-" + pageId);
      const button = document.getElementById(moduleId + "-subnav-" + pageId);
      const isOverlayPage = state.activeOverlay && state.activeOverlay.moduleId === moduleId && state.activeOverlay.pageId === pageId;
      const isDefaultPage = !state.activeOverlay && moduleId === state.currentModule && pageId === activePage;
      const isVisible = isDefaultPage || isOverlayPage;

      if (page) {
        page.classList.toggle("is-hidden", !isVisible);
        page.classList.toggle("overlay-open", !!isOverlayPage);
      }
      if (button) {
        button.classList.toggle("active", !!(isDefaultPage || isOverlayPage));
      }
    }
  }

  updateModuleContext();
}

// ---------------------------------------------------------------------------
// renderLayoutAreaControls  (ui.html ~line 3254)
// ---------------------------------------------------------------------------
export function renderLayoutAreaControls(): void {
  const wrap = document.getElementById("layout-safe-area-wrap");
  if (!wrap) return;
  const select = document.getElementById("tpl-layout-area") as HTMLSelectElement | null;
  const area = select ? (select.value || "slide") : "slide";
  wrap.style.display = area === "safe-area" ? "grid" : "none";
}
