// ---------------------------------------------------------------------------
// Template management – the largest module
// Covers template infrastructure, variable resolution, page numbering,
// cloning / stamping, and all handler functions.
// ---------------------------------------------------------------------------

import { createPluginError, postError } from "./errors";
import { getPluginData, getStorage, saveStorage, cleanStaleMapEntries } from "./storage";
import {
  isTextNode,
  walkScene,
  loadTargetIfNeeded,
  loadAllFonts,
  getNodeByPath,
  getNodePath,
  getNodeRect,
  doRectsOverlap,
} from "./nodes";
import { getLoadedTargetById } from "./nodes";
import {
  isSlidesEditor,
  getAllTargets,
  getTargetById,
  getContainerIdForNode,
  ensureAllPagesLoaded,
} from "./slides";
import {
  getPositionInContainer,
  getLayoutRect,
  buildPlacement,
  applyTemplatePosition,
} from "./layout";
import {
  normalizeTemplate,
  normalizeTemplateKind,
  normalizeVariables,
  normalizeLayoutFrame,
  normalizePlacementMode,
  defaultPlacementModeForKind,
} from "./normalize";

// ── Template node resolution ────────────────────────────────────────────────

export async function getTemplateNode(template: any): Promise<any | null> {
  if (!template || !template.pageId || !template.nodeId) {
    return null;
  }

  await getLoadedTargetById(template.pageId);
  return figma.getNodeByIdAsync(template.nodeId);
}

// ── Instance map key ────────────────────────────────────────────────────────

export function getTemplateInstanceMapKey(templateId: string, targetId: string): string {
  return templateId + "::" + targetId;
}

// ── Managed-root detection ──────────────────────────────────────────────────

export function isManagedTemplateRoot(node: any, templateId: string): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "isTemplateInstanceRoot") === "true"
    && getPluginData(node, "templateInstanceFrom") === templateId;
}

export function isAnyManagedTemplateRoot(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "isTemplateInstanceRoot") === "true";
}

// ── Scene queries ───────────────────────────────────────────────────────────

export async function findManagedTemplateInstancesOnTarget(
  target: any,
  templateId: string
): Promise<any[] | null> {
  const found: any[] = [];
  if (!target) return null;

  await loadTargetIfNeeded(target);
  walkScene(target, (node: any) => {
    if (isManagedTemplateRoot(node, templateId)) {
      found.push(node);
    }
  });

  return found;
}

export async function findAllManagedTemplateRootsOnTarget(target: any): Promise<any[]> {
  const found: any[] = [];
  if (!target) return found;

  await loadTargetIfNeeded(target);
  walkScene(target, (node: any) => {
    if (isAnyManagedTemplateRoot(node)) {
      found.push(node);
    }
  });

  return found;
}

// ── Ordering / conflicts ────────────────────────────────────────────────────

export function getTemplateKindPriority(templateKind: string): number {
  if (templateKind === "header") return 10;
  if (templateKind === "footer") return 20;
  return 30;
}

export async function countTemplateConflictsOnTarget(
  node: any,
  target: any,
  templateId: string
): Promise<number> {
  const roots = await findAllManagedTemplateRootsOnTarget(target);
  const currentRect = getNodeRect(node);
  let conflicts = 0;

  for (let index = 0; index < roots.length; index++) {
    const root = roots[index];
    if (root.id === node.id) continue;
    if (getPluginData(root, "templateInstanceFrom") === templateId) continue;
    if (doRectsOverlap(currentRect, getNodeRect(root))) {
      conflicts += 1;
    }
  }

  return conflicts;
}

export async function reorderManagedTemplateInstancesOnTarget(
  target: any,
  storage: any
): Promise<void> {
  const roots = await findAllManagedTemplateRootsOnTarget(target);
  roots.sort((a: any, b: any) => {
    const templateA = storage.templates[getPluginData(a, "templateInstanceFrom")];
    const templateB = storage.templates[getPluginData(b, "templateInstanceFrom")];
    const kindA = templateA ? normalizeTemplate(templateA.id || "", templateA).templateKind : "custom";
    const kindB = templateB ? normalizeTemplate(templateB.id || "", templateB).templateKind : "custom";
    const priorityDelta = getTemplateKindPriority(kindA) - getTemplateKindPriority(kindB);
    if (priorityDelta !== 0) return priorityDelta;
    const rectA = getNodeRect(a);
    const rectB = getNodeRect(b);
    if (rectA.y !== rectB.y) return rectA.y - rectB.y;
    if (rectA.x !== rectB.x) return rectA.x - rectB.x;
    return a.id.localeCompare(b.id);
  });

  for (let index = 0; index < roots.length; index++) {
    target.appendChild(roots[index]);
  }
}

// ── Instance get / remove ───────────────────────────────────────────────────

export async function getManagedTemplateInstanceForTarget(
  templateId: string,
  targetId: string,
  storage: any
): Promise<any | null> {
  const mapKey = getTemplateInstanceMapKey(templateId, targetId);
  const target = await getLoadedTargetById(targetId);

  const mappedId = storage.templateInstanceMap[mapKey];
  if (mappedId) {
    const mappedNode = await figma.getNodeByIdAsync(mappedId);
    if (mappedNode) {
      return mappedNode;
    }
    delete storage.templateInstanceMap[mapKey];
  }

  const discoveredNodes = await findManagedTemplateInstancesOnTarget(target, templateId);
  if (discoveredNodes && discoveredNodes.length) {
    storage.templateInstanceMap[mapKey] = discoveredNodes[0].id;
    return discoveredNodes[0];
  }

  return null;
}

export async function removeManagedTemplateInstancesOnTarget(
  templateId: string,
  targetId: string,
  storage: any
): Promise<number> {
  const mapKey = getTemplateInstanceMapKey(templateId, targetId);
  const target = await getLoadedTargetById(targetId);
  const nodes = await findManagedTemplateInstancesOnTarget(target, templateId);
  let removed = 0;

  if (nodes && nodes.length) {
    for (let index = 0; index < nodes.length; index++) {
      nodes[index].remove();
      removed += 1;
    }
  }

  delete storage.templateInstanceMap[mapKey];
  return removed;
}

// ── Runtime variable resolution ─────────────────────────────────────────────

export function resolveRuntimeVariables(
  templateNode: any,
  template: any,
  messageVariables: any
): any[] {
  const variables = messageVariables
    ? normalizeVariables(messageVariables, true)
    : normalizeVariables(template.variables || [], true);

  for (let index = 0; index < variables.length; index++) {
    const targetNode = getNodeByPath(templateNode, variables[index].path!);
    if (!isTextNode(targetNode)) {
      throw createPluginError(
        "errorVarNotTextNode",
        "变量「" + variables[index].name + "」绑定的节点不是文本节点",
        { name: variables[index].name }
      );
    }
  }

  return variables;
}

// ── Marking managed subtrees ────────────────────────────────────────────────

export function markManagedTemplateSubtree(node: any, templateId: string): void {
  if (!node || typeof node.setPluginData !== "function") return;

  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("templateInstanceFrom", templateId);
  node.setPluginData("isTemplateInstance", "true");

  if ("children" in node) {
    for (let index = 0; index < node.children.length; index++) {
      markManagedTemplateSubtree(node.children[index], templateId);
    }
  }
}

export function markManagedTemplateRoot(node: any, templateId: string): void {
  markManagedTemplateSubtree(node, templateId);
  if (node && typeof node.setPluginData === "function") {
    node.setPluginData("isTemplateInstanceRoot", "true");
  }
}

// ── Remove all instances from scene ─────────────────────────────────────────

export async function removeManagedTemplateInstancesFromScene(
  templateId: string,
  storage: any
): Promise<number> {
  const removedIds = new Set<string>();
  let removed = 0;

  for (const key of Object.keys(storage.templateInstanceMap)) {
    if (!key.startsWith(templateId + "::")) continue;

    const nodeId = storage.templateInstanceMap[key];
    const node = await figma.getNodeByIdAsync(nodeId);
    if (node) {
      node.remove();
      removed += 1;
      removedIds.add(node.id);
    }
    delete storage.templateInstanceMap[key];
  }

  const targets = getAllTargets();
  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    await loadTargetIfNeeded(target);

    const strayNodes: any[] = [];
    walkScene(target, (node: any) => {
      if (isManagedTemplateRoot(node, templateId) && !removedIds.has(node.id)) {
        strayNodes.push(node);
      }
    });

    for (let nodeIndex = 0; nodeIndex < strayNodes.length; nodeIndex++) {
      strayNodes[nodeIndex].remove();
      removed += 1;
      removedIds.add(strayNodes[nodeIndex].id);
    }
  }

  return removed;
}

// ── Page numbering ──────────────────────────────────────────────────────────

export function formatPageNumber(format: string, pageNumber: number, total: number): string {
  const safeFormat = format || "%n";

  function pad2(value: number): string {
    const text = String(value);
    return text.length < 2 ? "0" + text : text;
  }

  return safeFormat
    .replace(/%02n/g, pad2(pageNumber))
    .replace(/%02t/g, pad2(total))
    .replace(/%n/g, String(pageNumber))
    .replace(/%t/g, String(total));
}

export async function updatePageIndicator(
  clonedRoot: any,
  indicatorPath: number[],
  pageNumber: number,
  total: number,
  format: string
): Promise<void> {
  const indicatorNode = getNodeByPath(clonedRoot, indicatorPath);
  if (!isTextNode(indicatorNode)) return;

  await loadAllFonts(indicatorNode);
  indicatorNode.characters = formatPageNumber(format, pageNumber, total);
}

// ── Variable application ────────────────────────────────────────────────────

export async function applyVariables(
  clonedRoot: any,
  variables: any[],
  pageNumber: number
): Promise<void> {
  if (!Array.isArray(variables) || variables.length === 0) return;

  for (const variable of variables) {
    const activeRange = (variable.ranges || []).find(
      (range: any) => pageNumber >= Number(range.from) && pageNumber <= Number(range.to)
    );
    if (!activeRange) continue;

    const variableNode = getNodeByPath(clonedRoot, variable.path);
    if (!isTextNode(variableNode)) continue;

    await loadAllFonts(variableNode);
    variableNode.characters = String(activeRange.value);
  }
}

// ── Variable source resolution ──────────────────────────────────────────────

export async function resolveVariableSourceNode(
  template: any,
  storage: any,
  path: number[],
  sourcePageId: string
): Promise<{ node: any | null; tempClone: any | null }> {
  let templateInstanceRoot: any = null;
  let isTemporaryClone = false;
  const templateRoot = await getTemplateNode(template);

  if (sourcePageId === template.pageId) {
    templateInstanceRoot = templateRoot;
  } else {
    templateInstanceRoot = await getManagedTemplateInstanceForTarget(template.id, sourcePageId, storage);
    if (!templateInstanceRoot && templateRoot) {
      templateInstanceRoot = templateRoot.clone();
      isTemporaryClone = true;
    }
  }

  if (!templateInstanceRoot) return { node: null, tempClone: null };
  return {
    node: getNodeByPath(templateInstanceRoot, path),
    tempClone: isTemporaryClone ? templateInstanceRoot : null
  };
}

export async function buildVariableSourceCache(
  template: any,
  storage: any
): Promise<{ cache: Map<string, any>; missing: any[] }> {
  const cache = new Map<string, any>();
  const missing: any[] = [];
  const tempClones: any[] = [];

  for (const variable of template.variables || []) {
    for (const range of variable.ranges || []) {
      if (!range.sourcePageId) continue;

      const cacheKey = `${JSON.stringify(variable.path)}::${range.sourcePageId}`;
      if (cache.has(cacheKey)) continue;

      const result = await resolveVariableSourceNode(
        template,
        storage,
        variable.path,
        range.sourcePageId
      );
      if (result.tempClone) tempClones.push(result.tempClone);

      if (!isTextNode(result.node)) {
        missing.push({
          variableName: variable.name,
          sourcePageId: range.sourcePageId
        });
        continue;
      }

      cache.set(cacheKey, result.node.clone());
    }
  }

  for (let i = 0; i < tempClones.length; i++) {
    if (tempClones[i] && typeof tempClones[i].remove === "function") {
      tempClones[i].remove();
    }
  }

  return { cache, missing };
}

// ── Replace text node with source ───────────────────────────────────────────

export async function replaceTextNodeWithSource(
  root: any,
  path: number[],
  sourceNode: any
): Promise<boolean> {
  if (!Array.isArray(path) || path.length === 0) return false;

  const parentPath = path.slice(0, -1);
  const targetIndex = path[path.length - 1];
  const parentNode = parentPath.length === 0 ? root : getNodeByPath(root, parentPath);

  if (!parentNode || !("children" in parentNode) || typeof parentNode.insertChild !== "function") {
    return false;
  }

  const targetNode = parentNode.children[targetIndex];
  if (!isTextNode(targetNode)) {
    return false;
  }

  const targetX = Number(targetNode.x) || 0;
  const targetY = Number(targetNode.y) || 0;
  const targetWidth = Number(targetNode.width) || 0;
  const targetHeight = Number(targetNode.height) || 0;
  const targetRotation = "rotation" in targetNode ? Number(targetNode.rotation) || 0 : 0;
  const targetVisible = "visible" in targetNode ? targetNode.visible : true;
  const targetLocked = "locked" in targetNode ? targetNode.locked : false;
  const targetTextAutoResize = "textAutoResize" in targetNode ? targetNode.textAutoResize : null;
  const targetLayoutAlign = "layoutAlign" in targetNode ? targetNode.layoutAlign : null;
  const targetLayoutGrow = "layoutGrow" in targetNode ? targetNode.layoutGrow : 0;
  const targetLayoutPositioning = "layoutPositioning" in targetNode ? targetNode.layoutPositioning : null;
  const targetConstraints = "constraints" in targetNode ? targetNode.constraints : null;

  const replacement = sourceNode.clone();
  replacement.name = targetNode.name;

  targetNode.remove();
  parentNode.insertChild(targetIndex, replacement);

  replacement.x = targetX;
  replacement.y = targetY;
  if ("rotation" in replacement) replacement.rotation = targetRotation;
  if ("visible" in replacement) replacement.visible = targetVisible;
  if ("locked" in replacement) replacement.locked = targetLocked;
  if ("layoutAlign" in replacement && targetLayoutAlign !== null) replacement.layoutAlign = targetLayoutAlign;
  if ("layoutGrow" in replacement) replacement.layoutGrow = targetLayoutGrow;
  if ("layoutPositioning" in replacement && targetLayoutPositioning !== null) {
    replacement.layoutPositioning = targetLayoutPositioning;
  }
  if ("constraints" in replacement && targetConstraints) replacement.constraints = targetConstraints;
  const replacementFontsLoaded = await loadAllFonts(replacement);
  if (replacementFontsLoaded && "textAutoResize" in replacement && targetTextAutoResize !== null) {
    replacement.textAutoResize = targetTextAutoResize;
  }

  if (typeof replacement.resize === "function" && targetWidth > 0 && targetHeight > 0) {
    if (targetTextAutoResize === "NONE" || targetTextAutoResize === "TRUNCATE") {
      replacement.resize(targetWidth, targetHeight);
    } else if (targetTextAutoResize === "HEIGHT") {
      replacement.resize(targetWidth, Math.max(1, Number(replacement.height) || targetHeight));
    }
  }

  return true;
}

// ── Apply variable sources ──────────────────────────────────────────────────

export async function applyVariableSources(
  clonedRoot: any,
  template: any,
  variables: any[],
  pageNumber: number,
  sourceCache: Map<string, any>
): Promise<void> {
  if (!Array.isArray(variables) || variables.length === 0) return;

  for (const variable of variables) {
    const activeRange = (variable.ranges || []).find(
      (range: any) => pageNumber >= Number(range.from) && pageNumber <= Number(range.to)
    );
    if (!activeRange) continue;

    if (activeRange.sourcePageId) {
      const cacheKey = `${JSON.stringify(variable.path)}::${activeRange.sourcePageId}`;
      const sourceNode = sourceCache.get(cacheKey);
      if (sourceNode) {
        await replaceTextNodeWithSource(clonedRoot, variable.path, sourceNode);
        continue;
      }
    }

    if (activeRange.value !== undefined) {
      const variableNode = getNodeByPath(clonedRoot, variable.path);
      if (!isTextNode(variableNode)) continue;
      await loadAllFonts(variableNode);
      variableNode.characters = String(activeRange.value);
    }
  }
}

// ── Stamp clone ─────────────────────────────────────────────────────────────

export async function stampClone(
  clone: any,
  template: any,
  pageNumber: number,
  total: number,
  sourceCache: Map<string, any>
): Promise<void> {
  if (template.indicatorPath) {
    await updatePageIndicator(
      clone,
      template.indicatorPath,
      pageNumber,
      total,
      template.pageFormat
    );
  }

  if (template.variables && template.variables.length) {
    await applyVariableSources(clone, template, template.variables, pageNumber, sourceCache || new Map());
  }
}

// ── Page number map ─────────────────────────────────────────────────────────

export function buildPageNumberMap(
  pages: any[],
  template: any
): Record<string, number | null> {
  const excludedIds = new Set(template.excludedPageIds || []);
  const rawStartNumber = Number(template.pageNumberStart);
  const startNumber = Number.isFinite(rawStartNumber) ? rawStartNumber : 1;
  const pageNumberMap: Record<string, number | null> = {};
  let counter = 0;

  for (const page of pages) {
    if (excludedIds.has(page.id)) {
      pageNumberMap[page.id] = null;
      continue;
    }

    pageNumberMap[page.id] = startNumber + counter;
    counter += 1;
  }

  return pageNumberMap;
}

export function effectiveTotal(pages: any[], template: any): number {
  if (template.totalMode === "custom" && template.customTotal) {
    return Number(template.customTotal);
  }

  const excludedIds = new Set(template.excludedPageIds || []);
  return pages.filter((page: any) => !excludedIds.has(page.id)).length;
}

// ── Ensure custom total ─────────────────────────────────────────────────────

export function ensureCustomTotal(totalMode: string, customTotal: any): number | null {
  if (totalMode !== "custom") return null;

  const value = Number(customTotal);
  if (!Number.isFinite(value) || value < 1) {
    throw createPluginError("errorInvalidCustomTotal", "自定义总页数必须是大于 0 的数字");
  }

  return value;
}

// ═══════════════════════════════════════════════════════════════════════════
// Handler functions
// ═══════════════════════════════════════════════════════════════════════════

// ── handleSetTemplate ───────────────────────────────────────────────────────

export async function handleSetTemplate(message: any): Promise<void> {
  const node = await figma.getNodeByIdAsync(message.nodeId);
  if (!node) {
    postError("找不到选中的模板区域节点", "errorTemplateNodeNotFound");
    return;
  }

  const totalMode = message.totalMode === "custom" ? "custom" : "auto";
  const customTotal = ensureCustomTotal(totalMode, message.customTotal);
  const storage = await getStorage();
  const requestedTemplateId = typeof message.templateId === "string" && storage.templates[message.templateId]
    ? message.templateId
    : "";
  const existingTemplateId = (node as any).getPluginData("academicTemplateId");
  const templateId = requestedTemplateId || ((existingTemplateId && storage.templates[existingTemplateId]) ? existingTemplateId : "");
  const isUpdating = !!templateId;
  const nextTemplateId = isUpdating ? templateId : `tpl_${Date.now()}`;
  const previousTemplate = storage.templates[nextTemplateId]
    ? normalizeTemplate(nextTemplateId, storage.templates[nextTemplateId])
    : null;

  let indicatorPath = previousTemplate ? previousTemplate.indicatorPath : null;
  let nextTotalMode = previousTemplate ? previousTemplate.totalMode : totalMode;
  let nextCustomTotal = previousTemplate ? previousTemplate.customTotal : customTotal;

  if (message.pageIndicatorId) {
    indicatorPath = getNodePath(node, message.pageIndicatorId);
    if (indicatorPath === null) {
      postError("页码节点必须位于模板区域内部", "errorIndicatorOutsideTemplate");
      return;
    }

    const indicatorNode = getNodeByPath(node, indicatorPath);
    if (!isTextNode(indicatorNode)) {
      postError("页码节点必须是文本节点", "errorIndicatorNotText");
      return;
    }

    nextTotalMode = totalMode;
    nextCustomTotal = customTotal;
  } else if (!previousTemplate) {
    indicatorPath = null;
    nextTotalMode = totalMode;
    nextCustomTotal = customTotal;
  }
  const containerId = getContainerIdForNode(node);
  const containerNode = getTargetById(containerId);

  if (!containerId) {
    postError(
      isSlidesEditor() ? "请在某一页 Slide 内选择模板区域节点" : "找不到当前页面",
      isSlidesEditor() ? "errorSelectSlideTemplate" : "errorCurrentPageNotFound"
    );
    return;
  }

  const templateKind = normalizeTemplateKind(message.templateKind || (previousTemplate && previousTemplate.templateKind));
  const position = getPositionInContainer(node, containerNode);
  const layoutFrame = normalizeLayoutFrame({
    area: message.layoutArea || (previousTemplate && previousTemplate.layoutFrame && previousTemplate.layoutFrame.area),
    safeArea: message.safeArea || (previousTemplate && previousTemplate.layoutFrame && previousTemplate.layoutFrame.safeArea)
  });
  const placementMode = normalizePlacementMode(
    message.placementMode
    || (previousTemplate && previousTemplate.placement && previousTemplate.placement.mode)
    || defaultPlacementModeForKind(templateKind)
  );

  storage.templates[nextTemplateId] = {
    id: nextTemplateId,
    name: String(message.name || (previousTemplate && previousTemplate.name) || node.name).trim() || node.name,
    nodeId: node.id,
    pageId: containerId,
    templateKind: templateKind,
    position: position,
    layoutFrame: layoutFrame,
    placement: buildPlacement(node, containerNode, placementMode, position, layoutFrame),
    indicatorPath,
    pageFormat: message.pageFormat || (previousTemplate && previousTemplate.pageFormat) || "%n",
    totalMode: nextTotalMode,
    customTotal: nextCustomTotal,
    pageNumberStart: previousTemplate && Number.isFinite(Number(previousTemplate.pageNumberStart))
      ? Number(previousTemplate.pageNumberStart)
      : 1,
    excludedPageIds: (previousTemplate && previousTemplate.excludedPageIds) || [],
    variables: (previousTemplate && previousTemplate.variables) || [],
    createdAt: (previousTemplate && previousTemplate.createdAt) || Date.now()
  };

  (node as any).setPluginData("academicTemplateId", nextTemplateId);

  await saveStorage(storage);
  figma.ui.postMessage({
    type: "template-saved",
    templateId: nextTemplateId,
    mode: isUpdating ? "updated" : "created"
  });
  await handleGetTemplates();
}

// ── handleUpdateTemplateConfig ──────────────────────────────────────────────

export async function handleUpdateTemplateConfig(message: any): Promise<void> {
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  if (!template) {
    postError("模板不存在", "errorTemplateNotExist");
    return;
  }

  template.excludedPageIds = Array.isArray(message.excludedPageIds)
    ? message.excludedPageIds.filter((id: any) => typeof id === "string")
    : [];
  template.pageNumberStart = Number.isFinite(Number(message.pageNumberStart))
    ? Number(message.pageNumberStart)
    : 1;

  await saveStorage(storage);
  figma.ui.postMessage({ type: "config-saved", templateId: message.templateId });
  await handleGetTemplates();
}

// ── applyTemplateToTargets ──────────────────────────────────────────────────

export async function applyTemplateToTargets(message: any, mode: string): Promise<void> {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  if (!template) {
    postError("模板不存在", "errorTemplateNotExist");
    return;
  }

  const templateNode = await getTemplateNode(template);
  if (!templateNode) {
    postError("模板节点已被删除，请重新保存模板", "errorTemplateDeleted");
    return;
  }

  const runtimeTemplate = normalizeTemplate(template.id, template);
  runtimeTemplate.variables = resolveRuntimeVariables(templateNode, runtimeTemplate, message.variables);
  if (Array.isArray(message.excludedPageIds)) {
    runtimeTemplate.excludedPageIds = message.excludedPageIds.filter((id: any) => typeof id === "string");
  }
  if (message.pageNumberStart !== undefined && message.pageNumberStart !== null) {
    runtimeTemplate.pageNumberStart = Number.isFinite(Number(message.pageNumberStart))
      ? Number(message.pageNumberStart)
      : 1;
  }

  const targets = getAllTargets();
  const pageNumberMap = buildPageNumberMap(targets, runtimeTemplate);
  const total = effectiveTotal(targets, runtimeTemplate);
  const sourceCacheResult = await buildVariableSourceCache(runtimeTemplate, storage);
  let applied = 0;
  let skipped = 0;
  let removed = 0;
  let conflicts = 0;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const pageNumber = pageNumberMap[target.id];
    const mapKey = getTemplateInstanceMapKey(template.id, target.id);
    const existingTemplateInstance = await getManagedTemplateInstanceForTarget(template.id, target.id, storage);

    if (targets.length > 5 && i % 5 === 0) {
      figma.ui.postMessage({ type: "progress", current: i, total: targets.length, operation: mode });
    }

    if (pageNumber === null) {
      if (mode === "apply") {
        const removedOnExcluded = await removeManagedTemplateInstancesOnTarget(template.id, target.id, storage);
        if (!removedOnExcluded && message.overwrite && existingTemplateInstance) {
          existingTemplateInstance.remove();
          delete storage.templateInstanceMap[mapKey];
        }
        skipped += 1;
      } else {
        removed += await removeManagedTemplateInstancesOnTarget(template.id, target.id, storage);
      }
      continue;
    }

    if (target.id === runtimeTemplate.pageId) {
      if (mode === "apply") skipped += 1;
      continue;
    }

    if (mode === "apply" && existingTemplateInstance && !message.overwrite) {
      skipped += 1;
      continue;
    }

    const targetNode = await getLoadedTargetById(target.id);

    if (existingTemplateInstance) {
      await removeManagedTemplateInstancesOnTarget(template.id, target.id, storage);
    }

    const clone = templateNode.clone();
    targetNode.appendChild(clone);
    markManagedTemplateRoot(clone, runtimeTemplate.id);

    await stampClone(clone, runtimeTemplate, pageNumber, total, sourceCacheResult.cache);
    applyTemplatePosition(clone, runtimeTemplate, targetNode);
    conflicts += await countTemplateConflictsOnTarget(clone, targetNode, runtimeTemplate.id);
    await reorderManagedTemplateInstancesOnTarget(targetNode, storage);

    storage.templateInstanceMap[mapKey] = clone.id;
    applied += 1;
  }

  cleanStaleMapEntries(storage);
  await saveStorage(storage);

  if (mode === "apply") {
    figma.ui.postMessage({
      type: "apply-complete",
      applied,
      skipped,
      total: targets.length,
      conflicts,
      missingSources: sourceCacheResult.missing.length
    });
  } else {
    figma.ui.postMessage({
      type: "sync-complete",
      synced: applied,
      removed,
      conflicts,
      missingSources: sourceCacheResult.missing.length
    });
  }
}

// ── handleApplyToAll / handleSyncAll ────────────────────────────────────────

export async function handleApplyToAll(message: any): Promise<void> {
  await applyTemplateToTargets(message, "apply");
}

export async function handleSyncAll(message: any): Promise<void> {
  await applyTemplateToTargets(message, "sync");
}

// ── handleRemoveTemplateInstances ───────────────────────────────────────────

export async function handleRemoveTemplateInstances(templateId: string): Promise<void> {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[templateId];

  if (!template) {
    postError("模板不存在", "errorTemplateNotExist");
    return;
  }

  const removed = await removeManagedTemplateInstancesFromScene(templateId, storage);

  await saveStorage(storage);
  figma.ui.postMessage({ type: "remove-complete", templateId: templateId, removed: removed });
  await handleGetTemplates();
}

// ── handleGetTemplates ──────────────────────────────────────────────────────

export async function handleGetTemplates(): Promise<void> {
  const storage = await getStorage();
  const templates = Object.values(storage.templates).sort((a: any, b: any) => {
    return Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });

  figma.ui.postMessage({ type: "templates", templates });
}

// ── handleDeleteTemplate ────────────────────────────────────────────────────

export async function handleDeleteTemplate(templateId: string): Promise<void> {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[templateId];

  if (!template) {
    postError("模板不存在", "errorTemplateNotExist");
    return;
  }

  const templateNode = await getTemplateNode(template);

  if (templateNode && templateNode.getPluginData("academicTemplateId") === templateId) {
    templateNode.setPluginData("academicTemplateId", "");
  }

  await removeManagedTemplateInstancesFromScene(templateId, storage);

  delete storage.templates[templateId];
  cleanStaleMapEntries(storage);

  await saveStorage(storage);
  await handleGetTemplates();
}

// ── handleCheckVariableCandidate ────────────────────────────────────────────

export async function handleCheckVariableCandidate(message: any): Promise<void> {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  const fail = (reason: string, reasonKey: string): void => {
    figma.ui.postMessage({ type: "variable-candidate", isValid: false, reason, reasonKey: reasonKey || "" });
  };

  if (!template) {
    fail("模板不存在", "errorTemplateNotExist");
    return;
  }

  const templateNode = await getTemplateNode(template);
  if (!templateNode) {
    fail("模板节点不存在，请重新保存模板", "errorTemplateNodeMissing");
    return;
  }

  const selection = figma.currentPage.selection;
  if (selection.length !== 1) {
    fail("请在 Figma 中只选中一个文本节点", "errorSelectOneTextNode");
    return;
  }

  if (getContainerIdForNode(selection[0]) !== template.pageId) {
    fail(
      isSlidesEditor() ? "请切换到模板所在的 Slide 后再检测变量节点" : "请切换到模板所在页面后再检测变量节点",
      isSlidesEditor() ? "errorSwitchToTemplateSlide" : "errorSwitchToTemplatePage"
    );
    return;
  }

  const targetNode = selection[0];
  if (!isTextNode(targetNode)) {
    fail("变量只支持文本节点", "errorVarOnlyText");
    return;
  }

  const path = getNodePath(templateNode, targetNode.id);
  if (path === null) {
    fail("所选节点不在该模板内部", "errorNodeNotInTemplate");
    return;
  }

  figma.ui.postMessage({
    type: "variable-candidate",
    isValid: true,
    path,
    nodeId: targetNode.id,
    nodeName: targetNode.name,
    nodeType: targetNode.type
  });
}

// ── handleSaveVariables ─────────────────────────────────────────────────────

export async function handleSaveVariables(message: any): Promise<void> {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  if (!template) {
    postError("模板不存在", "errorTemplateNotExist");
    return;
  }

  const templateNode = await getTemplateNode(template);
  if (!templateNode) {
    postError("模板节点不存在，请重新保存模板", "errorTemplateNodeMissing");
    return;
  }

  const variables = normalizeVariables(message.variables || [], true);

  for (const variable of variables) {
    const targetNode = getNodeByPath(templateNode, variable.path!);
    if (!isTextNode(targetNode)) {
      postError(`变量「${variable.name}」绑定的节点不是文本节点`, "errorVarNotTextNode", { name: variable.name });
      return;
    }
  }

  template.variables = variables;
  await saveStorage(storage);

  figma.ui.postMessage({ type: "variables-saved", templateId: message.templateId });
  await handleGetTemplates();
}
