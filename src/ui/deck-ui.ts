// ---------------------------------------------------------------------------
// Deck UI functions -- extracted from ui.html  (LARGEST module)
// ---------------------------------------------------------------------------

import { state } from "./state";

// Declared helpers from utils / i18n (not yet extracted into their own modules)
declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function esc(value: string): string;
declare function escJs(value: string): string;
declare function getTemplateById(templateId: string | null): any;
declare function getPageName(pageId: string): string;
declare function getPageIndex(pageId: string): number;
declare function describePage(pageId: string): string;
declare function getTemplateKindLabel(kind: string): string;
declare function getPlacementLabel(mode: string): string;
declare function getDefaultPlacementForKind(kind: string): string;
declare function getLayoutAreaLabel(area: string): string;
declare function localizeBackendMessage(message: string, errorKey: string, errorVars: Record<string, any>): string;

// Forward-declared cross-module helpers
declare function openOverlayPage(moduleId: string, pageId: string): void;
declare function requestPages(force?: boolean): void;
declare function setSourcesDirty(isDirty: boolean): void;
declare function discardSourceDrafts(): void;
declare function renderModuleShell(): void;
declare function renderLayoutAreaControls(): void;
declare function refreshTemplatePanelsImpl(): void;
declare function updateOverview(): void;

// ---------------------------------------------------------------------------
// updateTemplateSelector  (ui.html ~line 3115)
// ---------------------------------------------------------------------------
export function updateTemplateSelector(): void {
  const select = document.getElementById("active-template-select") as HTMLSelectElement;
  const previous = select.value;
  let options = "<option value=\"\">" + esc(t("selectTemplate")) + "</option>";

  for (let index = 0; index < state.allTemplates.length; index++) {
    const template = state.allTemplates[index];
    options += "<option value=\"" + template.id + "\">"
      + esc("[" + getTemplateKindLabel(template.templateKind) + "] " + template.name)
      + "</option>";
  }

  select.innerHTML = options;

  if (state.activeTemplateId && getTemplateById(state.activeTemplateId)) {
    select.value = state.activeTemplateId;
  } else if (previous && getTemplateById(previous)) {
    state.activeTemplateId = previous;
    select.value = previous;
  } else if (state.allTemplates.length === 1) {
    state.activeTemplateId = state.allTemplates[0].id;
    select.value = state.activeTemplateId!;
  } else {
    state.activeTemplateId = null;
  }
}

// ---------------------------------------------------------------------------
// updateOverview  (ui.html ~line 3142)
// ---------------------------------------------------------------------------
export function updateOverviewImpl(): void {
  const template = getTemplateById(state.activeTemplateId);
  const pages = state.pagesCache || [];
  const total = pages.length;
  let targets = 0;

  if (template) {
    const excludedIds = new Set(getCurrentExcludedPageIds(template));
    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      if (page.id !== template.pageId && !excludedIds.has(page.id)) {
        targets += 1;
      }
    }
  }

  document.getElementById("meta-total")!.textContent = String(total);
  document.getElementById("meta-template")!.textContent = template ? String(getPageIndex(template.pageId) + 1 || "-") : "-";
  document.getElementById("meta-rules")!.textContent = template ? String((template.variables || []).length) : "0";
  document.getElementById("meta-targets")!.textContent = String(targets);

  const statusEl = document.getElementById("overview-status")!;
  if (!template) {
    statusEl.textContent = t("overviewEmpty");
    statusEl.className = "status";
    return;
  }

  statusEl.textContent = t("overviewActive", {
    kind: getTemplateKindLabel(template.templateKind),
    name: template.name,
    page: describePage(template.pageId),
    count: targets,
  });
  statusEl.className = "status active";
}

// ---------------------------------------------------------------------------
// findNodeInTree  (ui.html ~line 3179)
// ---------------------------------------------------------------------------
export function findNodeInTree(node: any, nodeId: string): any {
  if (!node) return null;
  if (node.id === nodeId) return node;
  if (!node.children) return null;

  for (let index = 0; index < node.children.length; index++) {
    const found = findNodeInTree(node.children[index], nodeId);
    if (found) return found;
  }
  return null;
}

// ---------------------------------------------------------------------------
// hasTextNode  (ui.html ~line 3191)
// ---------------------------------------------------------------------------
export function hasTextNode(node: any): boolean {
  if (!node) return false;
  if (node.type === "TEXT") return true;
  if (!node.children) return false;

  for (let index = 0; index < node.children.length; index++) {
    if (hasTextNode(node.children[index])) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// renderTree  (ui.html ~line 3202)
// ---------------------------------------------------------------------------
export function renderTree(node: any, depth: number): string {
  const isSelectable = node.type === "TEXT";
  const isSelected = node.id === state.selectedIndicId;
  const action = isSelectable ? "onclick=\"toggleIndicator('" + escJs(node.id) + "')\"" : "";

  let html = ""
    + "<button class=\"tree-item "
    + (isSelectable ? "selectable" : "disabled")
    + (isSelected ? " selected" : "")
    + "\" style=\"padding-left:" + (12 + depth * 14) + "px;\" " + action + " type=\"button\">"
    + "<span class=\"tree-type\">" + esc(node.type.slice(0, 5)) + "</span>"
    + "<span class=\"tree-name\">" + esc(node.name) + "</span>"
    + (isSelectable ? "<span class=\"tree-tag\">TEXT</span>" : "")
    + "</button>";

  if (node.children) {
    for (let index = 0; index < node.children.length; index++) {
      html += renderTree(node.children[index], depth + 1);
    }
  }

  return html;
}

// ---------------------------------------------------------------------------
// refreshSetupTree  (ui.html ~line 3226)
// ---------------------------------------------------------------------------
export function refreshSetupTree(): void {
  document.getElementById("node-tree")!.innerHTML = state.selectedNodeData ? renderTree(state.selectedNodeData, 0) : "";
}

// ---------------------------------------------------------------------------
// getCurrentTemplateKind  (ui.html ~line 3230)
// ---------------------------------------------------------------------------
export function getCurrentTemplateKind(): string {
  const select = document.getElementById("tpl-kind") as HTMLSelectElement | null;
  return select ? (select.value || "custom") : "custom";
}

// ---------------------------------------------------------------------------
// getCurrentPlacementMode  (ui.html ~line 3235)
// ---------------------------------------------------------------------------
export function getCurrentPlacementMode(): string {
  const select = document.getElementById("tpl-placement") as HTMLSelectElement | null;
  return select ? (select.value || "custom") : "custom";
}

// ---------------------------------------------------------------------------
// getCurrentLayoutArea  (ui.html ~line 3240)
// ---------------------------------------------------------------------------
export function getCurrentLayoutArea(): string {
  const select = document.getElementById("tpl-layout-area") as HTMLSelectElement | null;
  return select ? (select.value || "slide") : "slide";
}

// ---------------------------------------------------------------------------
// getCurrentSafeArea  (ui.html ~line 3245)
// ---------------------------------------------------------------------------
export function getCurrentSafeArea(): { top: number; right: number; bottom: number; left: number } {
  return {
    top: Math.max(0, parseInt((document.getElementById("safe-area-top") as HTMLInputElement).value, 10) || 0),
    right: Math.max(0, parseInt((document.getElementById("safe-area-right") as HTMLInputElement).value, 10) || 0),
    bottom: Math.max(0, parseInt((document.getElementById("safe-area-bottom") as HTMLInputElement).value, 10) || 0),
    left: Math.max(0, parseInt((document.getElementById("safe-area-left") as HTMLInputElement).value, 10) || 0),
  };
}

// ---------------------------------------------------------------------------
// onTemplateKindChange  (ui.html ~line 3260)
// ---------------------------------------------------------------------------
export function onTemplateKindChange(): void {
  const placementSelect = document.getElementById("tpl-placement") as HTMLSelectElement | null;
  if (placementSelect) {
    placementSelect.value = getDefaultPlacementForKind(getCurrentTemplateKind());
  }
  renderLayoutAreaControls();
  setTemplateSummary();
}

// ---------------------------------------------------------------------------
// onLayoutAreaChange  (ui.html ~line 3269)
// ---------------------------------------------------------------------------
export function onLayoutAreaChange(): void {
  renderLayoutAreaControls();
  setTemplateSummary();
}

// ---------------------------------------------------------------------------
// setTemplateSummary  (ui.html ~line 3274)
// ---------------------------------------------------------------------------
export function setTemplateSummary(): void {
  const summary = document.getElementById("template-summary")!;
  const kind = getTemplateKindLabel(getCurrentTemplateKind());
  const placement = getPlacementLabel(getCurrentPlacementMode());
  const area = getLayoutAreaLabel(getCurrentLayoutArea());
  if (!state.selectedNodeId) {
    summary.textContent = t("templateSummaryDefault", { kind: kind, placement: placement, area: area });
    return;
  }

  if (state.selectedIndicId) {
    const node = findNodeInTree(state.selectedNodeData, state.selectedIndicId);
    summary.textContent = t("templateSummaryWithNumber", {
      kind: kind,
      placement: placement,
      area: area,
      name: node ? node.name : "TEXT",
    });
  } else {
    summary.textContent = t("templateSummaryWithoutNumber", {
      kind: kind,
      placement: placement,
      area: area,
    });
  }
}

// ---------------------------------------------------------------------------
// applyTemplateConfigToForm  (ui.html ~line 3301)
// ---------------------------------------------------------------------------
export function applyTemplateConfigToForm(template: any, fallbackName: string): void {
  const nameInput = document.getElementById("tpl-name") as HTMLInputElement;
  const kindSelect = document.getElementById("tpl-kind") as HTMLSelectElement;
  const placementSelect = document.getElementById("tpl-placement") as HTMLSelectElement;
  const layoutAreaSelect = document.getElementById("tpl-layout-area") as HTMLSelectElement;
  const pageFormat = document.getElementById("page-fmt") as HTMLSelectElement;
  const totalMode = document.getElementById("total-mode") as HTMLSelectElement;
  const customTotal = document.getElementById("custom-total") as HTMLInputElement;
  const customTotalWrap = document.getElementById("custom-total-wrap")!;
  const safeArea = template && template.layoutFrame && template.layoutFrame.safeArea
    ? template.layoutFrame.safeArea
    : { top: 24, right: 32, bottom: 24, left: 32 };

  nameInput.value = template ? (template.name || fallbackName || "") : (fallbackName || "");
  kindSelect.value = template && template.templateKind ? template.templateKind : "custom";
  placementSelect.value = template && template.placement && template.placement.mode
    ? template.placement.mode
    : getDefaultPlacementForKind(kindSelect.value);
  layoutAreaSelect.value = template && template.layoutFrame && template.layoutFrame.area
    ? template.layoutFrame.area
    : "slide";
  (document.getElementById("safe-area-top") as HTMLInputElement).value = String(safeArea.top);
  (document.getElementById("safe-area-right") as HTMLInputElement).value = String(safeArea.right);
  (document.getElementById("safe-area-bottom") as HTMLInputElement).value = String(safeArea.bottom);
  (document.getElementById("safe-area-left") as HTMLInputElement).value = String(safeArea.left);
  pageFormat.value = template && template.pageFormat ? template.pageFormat : "%n";
  totalMode.value = template && template.totalMode === "custom" ? "custom" : "auto";
  customTotal.value = template && template.customTotal ? String(template.customTotal) : "10";
  customTotalWrap.style.display = totalMode.value === "custom" ? "block" : "none";
  renderLayoutAreaControls();
}

// ---------------------------------------------------------------------------
// onSelection  (ui.html ~line 3333)
// ---------------------------------------------------------------------------
export function onSelection(node: any): void {
  const empty = document.getElementById("sel-empty")!;
  const info = document.getElementById("sel-info")!;

  if (!node) {
    state.selectedNodeId = null;
    state.selectedNodeData = null;
    state.selectedIndicId = null;
    empty.style.display = "block";
    empty.textContent = t("selectionEmpty");
    info.style.display = "none";
    document.getElementById("indicator-section")!.style.display = "none";
    document.getElementById("config-section")!.style.display = "none";
    (document.getElementById("save-btn") as HTMLButtonElement).disabled = true;
    document.getElementById("node-tree")!.innerHTML = "";
    setTemplateSummary();
    return;
  }

  state.selectedNodeId = node.id;
  state.selectedNodeData = node;
  state.selectedIndicId = null;

  empty.style.display = "none";
  info.style.display = "block";
  document.getElementById("sel-name")!.textContent = node.name;
  document.getElementById("sel-type")!.textContent = node.type;
  document.getElementById("sel-id")!.textContent = t("selectionIdPrefix") + node.id.slice(0, 10) + "...";

  document.getElementById("config-section")!.style.display = "grid";
  (document.getElementById("save-btn") as HTMLButtonElement).disabled = false;

  const showIndicator = hasTextNode(node);
  document.getElementById("indicator-section")!.style.display = showIndicator ? "grid" : "none";
  applyTemplateConfigToForm(getTemplateById(state.activeTemplateId), node.name);
  document.getElementById("fmt-row")!.style.display = "none";
  document.getElementById("total-row")!.style.display = "none";

  if (showIndicator) {
    document.getElementById("ind-hint")!.textContent = t("indicatorIdle");
    document.getElementById("ind-hint")!.className = "status";
    refreshSetupTree();
  }

  setTemplateSummary();
}

// ---------------------------------------------------------------------------
// toggleIndicator  (ui.html ~line 3380)
// ---------------------------------------------------------------------------
export function toggleIndicator(nodeId: string): void {
  const node = findNodeInTree(state.selectedNodeData, nodeId);
  if (!node || node.type !== "TEXT") {
    toast("template", t("textOnlyIndicator"), "error");
    return;
  }

  state.selectedIndicId = state.selectedIndicId === nodeId ? null : nodeId;
  const hint = document.getElementById("ind-hint")!;

  if (state.selectedIndicId) {
    hint.textContent = t("indicatorSelected", { name: node.name });
    hint.className = "status active";
  } else {
    hint.textContent = t("indicatorIdle");
    hint.className = "status";
  }

  document.getElementById("fmt-row")!.style.display = state.selectedIndicId ? "grid" : "none";
  document.getElementById("total-row")!.style.display = state.selectedIndicId ? "grid" : "none";

  refreshSetupTree();
  setTemplateSummary();
}

// ---------------------------------------------------------------------------
// onTotalModeChange  (ui.html ~line 3405)
// ---------------------------------------------------------------------------
export function onTotalModeChange(): void {
  document.getElementById("custom-total-wrap")!.style.display =
    (document.getElementById("total-mode") as HTMLSelectElement).value === "custom" ? "block" : "none";
}

// ---------------------------------------------------------------------------
// saveTemplate  (ui.html ~line 3410)
// ---------------------------------------------------------------------------
export function saveTemplate(): void {
  if (!state.selectedNodeId) {
    toast("template", t("chooseTemplateNodeFirst"), "error");
    return;
  }

  const totalMode = (document.getElementById("total-mode") as HTMLSelectElement).value;
  let customTotal: number | null = null;
  if (totalMode === "custom") {
    customTotal = parseInt((document.getElementById("custom-total") as HTMLInputElement).value, 10);
    if (!customTotal || customTotal < 1) {
      toast("template", t("customTotalInvalid"), "error");
      return;
    }
  }

  send("set-template", {
    templateId: state.activeTemplateId || null,
    nodeId: state.selectedNodeId,
    pageIndicatorId: state.selectedIndicId || null,
    name: (document.getElementById("tpl-name") as HTMLInputElement).value.trim() || null,
    templateKind: getCurrentTemplateKind(),
    placementMode: getCurrentPlacementMode(),
    layoutArea: getCurrentLayoutArea(),
    safeArea: getCurrentSafeArea(),
    pageFormat: (document.getElementById("page-fmt") as HTMLSelectElement).value,
    totalMode: totalMode,
    customTotal: customTotal,
  });
}

// ---------------------------------------------------------------------------
// cloneSourceRules  (ui.html ~line 3441)
// ---------------------------------------------------------------------------
export function cloneSourceRules(variables: any[], template: any): any[] {
  const result: any[] = [];
  for (let index = 0; index < variables.length; index++) {
    const variable = variables[index];
    const nextVariable: any = {
      id: variable.id,
      name: variable.name,
      path: variable.path ? variable.path.slice() : [],
      nodeName: variable.nodeName || "",
      ranges: [],
    };

    const ranges = variable.ranges || [];
    for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex++) {
      const range = ranges[rangeIndex];
      const sourcePageId = range.sourcePageId || (template ? template.pageId : "");
      nextVariable.ranges.push({
        from: range.from,
        to: range.to,
        sourcePageId: sourcePageId,
        sourcePageName: range.sourcePageName || getPageName(sourcePageId),
        value: range.value || "",
      });
    }

    result.push(nextVariable);
  }
  return result;
}

// ---------------------------------------------------------------------------
// resetBindNote  (ui.html ~line 3471)
// ---------------------------------------------------------------------------
export function resetBindNote(): void {
  state.pendingSource = null;
  state.lastSourceCandidateError = "";
  renderBindNote();
}

// ---------------------------------------------------------------------------
// renderBindNote  (ui.html ~line 2638)
// ---------------------------------------------------------------------------
export function renderBindNote(): void {
  const note = document.getElementById("bind-note");
  const confirmBox = document.getElementById("bind-confirm");
  if (!note) return;

  if (state.pendingSource) {
    note.innerHTML = t("sourceDetected", {
      name: state.pendingSource.nodeName,
      type: state.pendingSource.nodeType,
    }).replace(
      state.pendingSource.nodeName,
      "<strong>" + esc(state.pendingSource.nodeName) + "</strong>"
    ).replace(
      state.pendingSource.nodeType,
      esc(state.pendingSource.nodeType)
    );
    note.style.color = "var(--accent-ink)";
    if (confirmBox) confirmBox.style.display = "grid";
    return;
  }

  if (state.lastSourceCandidateError) {
    note.textContent = state.lastSourceCandidateError;
    note.style.color = "var(--danger)";
    if (confirmBox) confirmBox.style.display = "none";
    return;
  }

  note.textContent = t("bindNote");
  note.style.color = "";
  if (confirmBox) confirmBox.style.display = "none";
}

// ---------------------------------------------------------------------------
// onActiveTemplateChange  (ui.html ~line 3477)
// ---------------------------------------------------------------------------
export function onActiveTemplateChange(fromTemplatesMessage: boolean): void {
  const previousTemplateId = state.activeTemplateId;
  const requestedTemplateId = fromTemplatesMessage
    ? state.activeTemplateId
    : ((document.getElementById("active-template-select") as HTMLSelectElement).value || null);

  if (!fromTemplatesMessage && previousTemplateId && requestedTemplateId !== previousTemplateId && state.editingSourcesDirty) {
    if (!confirm(t("discardUnsavedSourcesConfirm"))) {
      (document.getElementById("active-template-select") as HTMLSelectElement).value = previousTemplateId;
      return;
    }
    discardSourceDrafts();
  }

  if (!fromTemplatesMessage) {
    state.activeTemplateId = requestedTemplateId;
  } else if (state.activeTemplateId) {
    (document.getElementById("active-template-select") as HTMLSelectElement).value = state.activeTemplateId;
  }

  const template = getTemplateById(state.activeTemplateId);
  state.pendingSource = null;
  state.lastSourceCandidateError = "";
  document.getElementById("bind-confirm")!.style.display = "none";
  renderBindNote();
  state.syncDraftStartNumber = template
    ? (Number.isFinite(Number(template.pageNumberStart)) ? Number(template.pageNumberStart) : 1)
    : null;
  applyTemplateConfigToForm(template, state.selectedNodeData ? state.selectedNodeData.name : "");

  if (!template) {
    state.editingSources = [];
    setSourcesDirty(false);
    document.getElementById("source-status")!.textContent = t("sourceEmpty");
    document.getElementById("source-status")!.className = "status";
    document.getElementById("source-bind-box")!.style.display = "none";
    document.getElementById("source-rule-list")!.innerHTML = "";
    document.getElementById("save-sources-btn")!.style.display = "none";
    document.getElementById("sync-summary")!.textContent = t("syncEmpty");
    document.getElementById("sync-summary")!.className = "status";
    document.getElementById("sync-settings")!.style.display = "none";
    updateOverviewImpl();
    return;
  }

  state.editingSources = cloneSourceRules(template.variables || [], template);
  setSourcesDirty(false);

  refreshTemplatePanelsImpl();
  requestPages(true);

  renderSourceRules();
  renderSyncStep();
  updateOverviewImpl();
}

// ---------------------------------------------------------------------------
// onTemplates  (ui.html ~line 3533)
// ---------------------------------------------------------------------------
export function onTemplates(templates: any[]): void {
  state.allTemplates = templates || [];
  if (state.activeTemplateId && !getTemplateById(state.activeTemplateId)) {
    state.activeTemplateId = null;
    state.editingSources = [];
    state.pendingSource = null;
  }

  updateTemplateSelector();
  onActiveTemplateChange(true);
}

// ---------------------------------------------------------------------------
// onTemplateSaved  (ui.html ~line 3545)
// ---------------------------------------------------------------------------
export function onTemplateSaved(message: any): void {
  if (message && message.templateId) {
    state.activeTemplateId = message.templateId;
  }
  requestPages(true);
  openOverlayPage("deck", "sources");
  toast("template", message && message.mode === "updated" ? t("templateUpdated") : t("templateSaved"), "success");
}

// ---------------------------------------------------------------------------
// checkVarCandidate  (ui.html ~line 3554)
// ---------------------------------------------------------------------------
export function checkVarCandidate(): void {
  if (!state.activeTemplateId) {
    toast("sources", t("chooseTemplateFirst"), "error");
    return;
  }
  send("check-variable-candidate", { templateId: state.activeTemplateId });
}

// ---------------------------------------------------------------------------
// onVarCandidate  (ui.html ~line 3562)
// ---------------------------------------------------------------------------
export function onVarCandidate(message: any): void {
  const confirmBox = document.getElementById("bind-confirm")!;

  if (!message.isValid) {
    state.lastSourceCandidateError = localizeBackendMessage(message.reason || "\u5f53\u524d\u9009\u4e2d\u7684\u8282\u70b9\u65e0\u6548", message.reasonKey, {});
    state.pendingSource = null;
    renderBindNote();
    return;
  }

  state.lastSourceCandidateError = "";
  state.pendingSource = {
    path: message.path,
    nodeName: message.nodeName,
    nodeType: message.nodeType,
  };

  renderBindNote();
  (document.getElementById("source-name-input") as HTMLInputElement).value = message.nodeName;
  confirmBox.style.display = "grid";
}

// ---------------------------------------------------------------------------
// confirmAddSource  (ui.html ~line 3585)
// ---------------------------------------------------------------------------
export function confirmAddSource(): void {
  if (!state.pendingSource) return;

  const name = (document.getElementById("source-name-input") as HTMLInputElement).value.trim() || state.pendingSource.nodeName;
  const pathKey = JSON.stringify(state.pendingSource.path);

  for (let index = 0; index < state.editingSources.length; index++) {
    if (JSON.stringify(state.editingSources[index].path) === pathKey) {
      toast("sources", t("sourceAlreadyBound"), "error");
      return;
    }
  }

  const template = getTemplateById(state.activeTemplateId);
  const defaultSourcePageId = template ? template.pageId : "";

  state.editingSources.push({
    id: "var_" + Date.now(),
    name: name,
    path: state.pendingSource.path.slice(),
    nodeName: state.pendingSource.nodeName,
    ranges: [{
      from: 1,
      to: 5,
      sourcePageId: defaultSourcePageId,
      sourcePageName: getPageName(defaultSourcePageId),
      value: "",
    }],
  });

  state.pendingSource = null;
  setSourcesDirty(true);
  renderBindNote();
  renderSourceRules();
}

// ---------------------------------------------------------------------------
// cancelAddSource  (ui.html ~line 3621)
// ---------------------------------------------------------------------------
export function cancelAddSource(): void {
  state.pendingSource = null;
  renderBindNote();
}

// ---------------------------------------------------------------------------
// getSourceOptions  (ui.html ~line 3626)
// ---------------------------------------------------------------------------
export function getSourceOptions(selectedPageId: string): string {
  if (!state.pagesCache || !state.pagesCache.length) {
    return "<option value=\"\">" + esc(t("loadingSlides")) + "</option>";
  }

  let options = "";
  for (let index = 0; index < state.pagesCache.length; index++) {
    const page = state.pagesCache[index];
    options += "<option value=\"" + page.id + "\""
      + (page.id === selectedPageId ? " selected" : "")
      + ">" + esc(t("slideLabel", { index: page.index + 1, name: page.name })) + "</option>";
  }
  return options;
}

// ---------------------------------------------------------------------------
// renderRangeRule  (ui.html ~line 3641)
// ---------------------------------------------------------------------------
export function renderRangeRule(sourceIndex: number, rangeIndex: number, range: any): string {
  return ""
    + "<div class=\"range-card\">"
    + "<div class=\"range-grid\">"
    + "<input type=\"number\" min=\"1\" value=\"" + range.from + "\" onchange=\"updateRange(" + sourceIndex + "," + rangeIndex + ",'from',this.value)\">"
    + "<input type=\"number\" min=\"1\" value=\"" + range.to + "\" onchange=\"updateRange(" + sourceIndex + "," + rangeIndex + ",'to',this.value)\">"
    + "<select onchange=\"updateRange(" + sourceIndex + "," + rangeIndex + ",'sourcePageId',this.value)\">"
    + getSourceOptions(range.sourcePageId || "")
    + "</select>"
    + "<button class=\"range-delete\" type=\"button\" onclick=\"deleteRange(" + sourceIndex + "," + rangeIndex + ")\">&times;</button>"
    + "</div>"
    + "<div class=\"range-preview\">" + esc(t("rangePreview", {
      from: range.from,
      to: range.to,
      page: describePage(range.sourcePageId || ""),
    })) + "</div>"
    + "</div>";
}

// ---------------------------------------------------------------------------
// renderSourceRules  (ui.html ~line 3660)
// ---------------------------------------------------------------------------
export function renderSourceRules(): void {
  const container = document.getElementById("source-rule-list")!;

  if (!state.activeTemplateId) {
    container.innerHTML = "";
    return;
  }

  if (!state.editingSources.length) {
    container.innerHTML = "<div class=\"box\"><div class=\"empty\">" + esc(t("noSourceRules")) + "</div></div>";
    return;
  }

  let html = "";
  for (let index = 0; index < state.editingSources.length; index++) {
    const source = state.editingSources[index];
    html += ""
      + "<div class=\"rule-card\">"
      + "<div class=\"rule-head\">"
      + "<div>"
      + "<div class=\"rule-title\">" + esc(source.name) + "</div>"
      + "<div class=\"rule-sub\">" + esc(t("templateNode", { name: source.nodeName || "TEXT" })) + "</div>"
      + "</div>"
      + "<button class=\"btn btn-danger\" style=\"width:auto; padding:7px 10px;\" onclick=\"deleteSourceRule(" + index + ")\">" + esc(t("deleteSource")) + "</button>"
      + "</div>"
      + "<div class=\"pill-row\">"
      + "<span class=\"pill accent\">" + esc(t("rulesCount", { count: source.ranges.length })) + "</span>"
      + "<span class=\"pill\">" + esc(t("sourceSyncPill")) + "</span>"
      + "</div>"
      + "<div class=\"rule-ranges\">";

    for (let rangeIndex = 0; rangeIndex < source.ranges.length; rangeIndex++) {
      html += renderRangeRule(index, rangeIndex, source.ranges[rangeIndex]);
    }

    html += "</div>"
      + "<button class=\"btn btn-secondary\" style=\"margin-top:10px;\" onclick=\"addRange(" + index + ")\">" + esc(t("addRange")) + "</button>"
      + "</div>";
  }

  container.innerHTML = html;
}

// ---------------------------------------------------------------------------
// addRange  (ui.html ~line 3703)
// ---------------------------------------------------------------------------
export function addRange(sourceIndex: number): void {
  const ranges = state.editingSources[sourceIndex].ranges;
  const last = ranges[ranges.length - 1];
  const template = getTemplateById(state.activeTemplateId);
  const fallbackPageId = (last && last.sourcePageId) || (template ? template.pageId : "");
  const from = last ? Number(last.to) + 1 : 1;

  ranges.push({
    from: from,
    to: from + 4,
    sourcePageId: fallbackPageId,
    sourcePageName: getPageName(fallbackPageId),
    value: "",
  });
  setSourcesDirty(true);
  renderSourceRules();
}

// ---------------------------------------------------------------------------
// deleteRange  (ui.html ~line 3721)
// ---------------------------------------------------------------------------
export function deleteRange(sourceIndex: number, rangeIndex: number): void {
  state.editingSources[sourceIndex].ranges.splice(rangeIndex, 1);
  setSourcesDirty(true);
  renderSourceRules();
}

// ---------------------------------------------------------------------------
// deleteSourceRule  (ui.html ~line 3727)
// ---------------------------------------------------------------------------
export function deleteSourceRule(sourceIndex: number): void {
  if (!confirm(t("deleteSourceConfirm"))) return;
  state.editingSources.splice(sourceIndex, 1);
  setSourcesDirty(true);
  renderSourceRules();
}

// ---------------------------------------------------------------------------
// updateRange  (ui.html ~line 3734)
// ---------------------------------------------------------------------------
export function updateRange(sourceIndex: number, rangeIndex: number, field: string, value: any): void {
  const range = state.editingSources[sourceIndex].ranges[rangeIndex];
  if (field === "from" || field === "to") {
    range[field] = Math.max(1, parseInt(value, 10) || 1);
  } else if (field === "sourcePageId") {
    range.sourcePageId = value;
    range.sourcePageName = getPageName(value);
  }
  setSourcesDirty(true);
  renderSourceRules();
}

// ---------------------------------------------------------------------------
// validateSourceRules  (ui.html ~line 3746)
// ---------------------------------------------------------------------------
export function validateSourceRules(): boolean {
  for (let index = 0; index < state.editingSources.length; index++) {
    const source = state.editingSources[index];
    if (!source.ranges || !source.ranges.length) {
      toast("sources", t("sourceNeedsRule", { name: source.name }), "error");
      return false;
    }

    const sorted = source.ranges.slice().sort(function (a: any, b: any) {
      return a.from - b.from || a.to - b.to;
    });

    for (let rangeIndex = 0; rangeIndex < sorted.length; rangeIndex++) {
      const range = sorted[rangeIndex];
      if (!Number.isFinite(Number(range.from)) || !Number.isFinite(Number(range.to)) || range.from < 1 || range.to < 1) {
        toast("sources", t("rangeInvalid", { name: source.name }), "error");
        return false;
      }
      if (!range.sourcePageId) {
        toast("sources", t("sourcePageMissing", { name: source.name }), "error");
        return false;
      }
      if (range.from > range.to) {
        toast("sources", t("rangeStartGreater", { name: source.name }), "error");
        return false;
      }
      if (rangeIndex > 0 && range.from <= sorted[rangeIndex - 1].to) {
        toast("sources", t("rangeOverlap", { name: source.name }), "error");
        return false;
      }
    }

    source.ranges = sorted;
  }

  return true;
}

// ---------------------------------------------------------------------------
// saveSources  (ui.html ~line 3784)
// ---------------------------------------------------------------------------
export function saveSources(): void {
  if (!state.activeTemplateId) return;
  if (!validateSourceRules()) return;

  send("save-variables", {
    templateId: state.activeTemplateId,
    variables: state.editingSources,
  });
}

// ---------------------------------------------------------------------------
// getCurrentExcludedPageIds  (ui.html ~line 3803)
// ---------------------------------------------------------------------------
export function getCurrentExcludedPageIds(template: any): string[] {
  if (!template) return [];

  const listElement = document.getElementById("sync-page-list");
  if (!listElement || document.getElementById("sync-settings")!.style.display === "none") {
    return (template.excludedPageIds || []).slice();
  }

  const result: string[] = [];
  const pages = state.pagesCache || [];
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    if (page.id === template.pageId) continue;
    const checkbox = document.getElementById("exclude-" + state.activeTemplateId + "-" + page.id) as HTMLInputElement | null;
    if (checkbox && checkbox.checked) result.push(page.id);
  }
  return result;
}

// ---------------------------------------------------------------------------
// getCurrentSyncPayload  (ui.html ~line 3822)
// ---------------------------------------------------------------------------
export function getCurrentSyncPayload(): any {
  const template = getTemplateById(state.activeTemplateId);
  if (!template) return null;

  const startNumber = parseInt((document.getElementById("sync-start-number") as HTMLInputElement).value, 10);
  const fallbackStartNumber = Number.isFinite(Number(template.pageNumberStart))
    ? Number(template.pageNumberStart)
    : 1;
  const payload: any = {
    templateId: state.activeTemplateId,
    excludedPageIds: getCurrentExcludedPageIds(template),
    pageNumberStart: Number.isFinite(startNumber) ? Math.max(0, startNumber) : fallbackStartNumber,
  };

  if (state.editingSourcesDirty) {
    payload.variables = cloneSourceRules(state.editingSources, template);
  }

  return payload;
}

// ---------------------------------------------------------------------------
// renderSyncPageList  (ui.html ~line 3843)
// ---------------------------------------------------------------------------
export function renderSyncPageList(template: any): void {
  const container = document.getElementById("sync-page-list")!;
  const pages = state.pagesCache || [];
  const excludedIds = new Set(getCurrentExcludedPageIds(template));

  if (!pages.length) {
    container.innerHTML = "<div class=\"list-row\"><div class=\"list-name\">" + esc(t("loadingSlides")) + "</div></div>";
    return;
  }

  let html = "";
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    if (page.id === template.pageId) {
      html += ""
        + "<label class=\"list-row source\">"
        + "<input type=\"checkbox\" disabled>"
        + "<div class=\"list-name\">" + esc(t("slideLabel", { index: page.index + 1, name: page.name })) + "</div>"
        + "<span class=\"source-badge\">" + esc(t("sourceTag")) + "</span>"
        + "</label>";
    } else {
      html += ""
        + "<label class=\"list-row\">"
        + "<input type=\"checkbox\" id=\"exclude-" + state.activeTemplateId + "-" + page.id + "\""
        + (excludedIds.has(page.id) ? " checked" : "")
        + " onchange=\"onExcludeChange()\">"
        + "<div class=\"list-name\">" + esc(t("slideLabel", { index: page.index + 1, name: page.name })) + "</div>"
        + "</label>";
    }
  }
  container.innerHTML = html;
}

// ---------------------------------------------------------------------------
// renderSyncStep  (ui.html ~line 3876)
// ---------------------------------------------------------------------------
export function renderSyncStep(): void {
  const template = getTemplateById(state.activeTemplateId);
  if (!template) {
    document.getElementById("sync-summary")!.textContent = t("syncEmpty");
    document.getElementById("sync-summary")!.className = "status";
    document.getElementById("sync-settings")!.style.display = "none";
    updateOverviewImpl();
    return;
  }

  document.getElementById("sync-settings")!.style.display = "grid";
  if (state.syncDraftStartNumber === null) {
    state.syncDraftStartNumber = Number.isFinite(Number(template.pageNumberStart))
      ? Number(template.pageNumberStart)
      : 1;
  }
  (document.getElementById("sync-start-number") as HTMLInputElement).value = String(state.syncDraftStartNumber);
  renderSyncPageList(template);

  const pages = state.pagesCache || [];
  const excludedIds = new Set(getCurrentExcludedPageIds(template));
  let targets = 0;
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    if (page.id !== template.pageId && !excludedIds.has(page.id)) {
      targets += 1;
    }
  }

  document.getElementById("sync-summary")!.textContent = t("syncSummary", {
    page: describePage(template.pageId),
    excluded: excludedIds.size,
    targets: targets,
  });
  document.getElementById("sync-summary")!.className = "status active";
  updateOverviewImpl();
}

// ---------------------------------------------------------------------------
// onExcludeChange  (ui.html ~line 3914)
// ---------------------------------------------------------------------------
export function onSyncStartNumberInput(value: any): void {
  const parsed = parseInt(value, 10);
  state.syncDraftStartNumber = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function onExcludeChange(): void {
  renderSyncStep();
}

// ---------------------------------------------------------------------------
// saveSyncSettings  (ui.html ~line 3918)
// ---------------------------------------------------------------------------
export function saveSyncSettings(): void {
  if (!state.activeTemplateId) {
    toast("sync", t("chooseTemplateFirst"), "error");
    return;
  }
  const payload = getCurrentSyncPayload();
  send("update-template-config", payload);
}

// ---------------------------------------------------------------------------
// applySelectedTemplate  (ui.html ~line 3927)
// ---------------------------------------------------------------------------
export function applySelectedTemplate(): void {
  if (!state.activeTemplateId) {
    toast("sync", t("chooseTemplateFirst"), "error");
    return;
  }
  if (state.editingSourcesDirty && !validateSourceRules()) {
    return;
  }
  const payload = getCurrentSyncPayload();
  payload.overwrite = false;
  send("apply-to-all", payload);
}

// ---------------------------------------------------------------------------
// syncSelectedTemplate  (ui.html ~line 3940)
// ---------------------------------------------------------------------------
export function syncSelectedTemplate(): void {
  if (!state.activeTemplateId) {
    toast("sync", t("chooseTemplateFirst"), "error");
    return;
  }
  if (state.editingSourcesDirty && !validateSourceRules()) {
    return;
  }
  send("sync-all", getCurrentSyncPayload());
}

// ---------------------------------------------------------------------------
// removeSelectedTemplateInstances  (ui.html ~line 3951)
// ---------------------------------------------------------------------------
export function removeSelectedTemplateInstances(): void {
  if (!state.activeTemplateId) {
    toast("sync", t("chooseTemplateFirst"), "error");
    return;
  }
  const template = getTemplateById(state.activeTemplateId);
  if (!confirm(t("removeTemplateInstancesConfirm", { name: template ? template.name : state.activeTemplateId }))) {
    return;
  }
  send("remove-template-instances", { templateId: state.activeTemplateId });
}

// ---------------------------------------------------------------------------
// deleteSelectedTemplate  (ui.html ~line 3963)
// ---------------------------------------------------------------------------
export function deleteSelectedTemplate(): void {
  if (!state.activeTemplateId) return;
  const template = getTemplateById(state.activeTemplateId);
  if (!confirm(t("deleteTemplateConfirm", { name: template ? template.name : state.activeTemplateId }))) {
    return;
  }
  send("delete-template", { templateId: state.activeTemplateId });
}

// ---------------------------------------------------------------------------
// onPagesReceived  (ui.html ~line 3972)
// ---------------------------------------------------------------------------
export function onPagesReceived(message: any): void {
  if (message.templateId && state.activeTemplateId && message.templateId !== state.activeTemplateId) {
    return;
  }
  state.pagesCache = message.pages || [];
  renderSourceRules();
  renderSyncStep();
}

// ---------------------------------------------------------------------------
// onConfigSaved  (ui.html ~line 4025)
// ---------------------------------------------------------------------------
export function onConfigSaved(): void {
  state.syncDraftStartNumber = null;
  toast("sync", t("saveSyncFirst"), "success");
  send("get-templates");
}

// ---------------------------------------------------------------------------
// onApplyComplete  (ui.html ~line 4031)
// ---------------------------------------------------------------------------
export function onApplyComplete(message: any): void {
  let text = t("appliedResult", {
    applied: message.applied,
    skipped: message.skipped,
  });
  if (message.conflicts) {
    text += t("templateConflicts", { count: message.conflicts });
  }
  if (message.missingSources) {
    text += t("missingSources", { count: message.missingSources });
  }
  toast("sync", text, (message.missingSources || message.conflicts) ? "info" : "success");
}

// ---------------------------------------------------------------------------
// onSyncComplete  (ui.html ~line 4045)
// ---------------------------------------------------------------------------
export function onSyncComplete(message: any): void {
  let text = t("syncResult", { synced: message.synced });
  if (message.removed) {
    text += t("removedExcluded", { removed: message.removed });
  }
  if (message.conflicts) {
    text += t("templateConflicts", { count: message.conflicts });
  }
  if (message.missingSources) {
    text += t("missingSources", { count: message.missingSources });
  }
  toast("sync", text, (message.missingSources || message.conflicts) ? "info" : "success");
}

// ---------------------------------------------------------------------------
// onVariablesSaved  (ui.html ~line 4059)
// ---------------------------------------------------------------------------
export function onVariablesSaved(): void {
  setSourcesDirty(false);
  openOverlayPage("deck", "sync");
  toast("sources", t("sourcesSaved"), "success");
  send("get-templates");
}
