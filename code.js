const STORAGE_KEY = "academicSlides_v2";
const EQUATION_KIND = "equation";
const RUNTIME_VERSION = "dev-20250318-01";
let allPagesLoadedPromise = null;

function emptyStorage() {
  return {
    templates: {},
    templateInstanceMap: {},
    settings: {
      language: "zh-CN"
    }
  };
}

function normalizeSettings(rawSettings) {
  const source = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const language = typeof source.language === "string" ? source.language : "zh-CN";

  return {
    language: language === "en-US" ? "en-US" : "zh-CN"
  };
}

function normalizeTemplateKind(rawKind) {
  return rawKind === "header" || rawKind === "footer" ? rawKind : "custom";
}

function normalizePlacementMode(rawMode) {
  const allowed = new Set([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "custom"
  ]);
  return allowed.has(rawMode) ? rawMode : "custom";
}

function defaultPlacementModeForKind(templateKind) {
  if (templateKind === "header") return "top-center";
  if (templateKind === "footer") return "bottom-center";
  return "custom";
}

function normalizeLayoutArea(rawArea) {
  return rawArea === "safe-area" ? "safe-area" : "slide";
}

function defaultSafeAreaMargins() {
  return {
    top: 24,
    right: 32,
    bottom: 24,
    left: 32
  };
}

function normalizeSafeArea(rawSafeArea) {
  const fallback = defaultSafeAreaMargins();
  const source = rawSafeArea && typeof rawSafeArea === "object" ? rawSafeArea : {};
  return {
    top: Math.max(0, Number(source.top) || fallback.top),
    right: Math.max(0, Number(source.right) || fallback.right),
    bottom: Math.max(0, Number(source.bottom) || fallback.bottom),
    left: Math.max(0, Number(source.left) || fallback.left)
  };
}

function normalizeLayoutFrame(rawLayoutFrame) {
  const source = rawLayoutFrame && typeof rawLayoutFrame === "object" ? rawLayoutFrame : {};
  return {
    area: normalizeLayoutArea(source.area),
    safeArea: normalizeSafeArea(source.safeArea)
  };
}

function normalizePlacement(rawPlacement, fallbackPosition, templateKind) {
  const fallback = fallbackPosition && typeof fallbackPosition === "object"
    ? {
        x: Number(fallbackPosition.x) || 0,
        y: Number(fallbackPosition.y) || 0
      }
    : { x: 0, y: 0 };
  const source = rawPlacement && typeof rawPlacement === "object" ? rawPlacement : {};
  const mode = normalizePlacementMode(source.mode || defaultPlacementModeForKind(templateKind));

  if (mode === "custom") {
    return {
      mode,
      x: Number(source.x) || fallback.x,
      y: Number(source.y) || fallback.y,
      offsetX: 0,
      offsetY: 0
    };
  }

  return {
    mode,
    x: fallback.x,
    y: fallback.y,
    offsetX: Number(source.offsetX) || 0,
    offsetY: Number(source.offsetY) || 0
  };
}

function getPluginData(node, key) {
  return node && typeof node.getPluginData === "function" ? node.getPluginData(key) : "";
}

function normalizeRanges(rawRanges, variableName, throwOnError = true) {
  const fail = (message) => {
    if (throwOnError) throw new Error(message);
    return null;
  };

  if (!Array.isArray(rawRanges)) {
    return fail(`变量「${variableName}」缺少范围配置`) || [];
  }

  const ranges = rawRanges.map((range, index) => {
    const from = Number(range && range.from);
    const to = Number(range && range.to);

    if (!Number.isFinite(from) || from < 1 || !Number.isFinite(to) || to < 1) {
      return fail(`变量「${variableName}」的第 ${index + 1} 个范围页码无效`);
    }
    if (from > to) {
      return fail(`变量「${variableName}」的第 ${index + 1} 个范围起始页不能大于结束页`);
    }

    return {
      from,
      to,
      value: String(range && range.value !== undefined && range.value !== null ? range.value : ""),
      sourcePageId: range && typeof range.sourcePageId === "string" ? range.sourcePageId : null,
      sourcePageName: range && typeof range.sourcePageName === "string" ? range.sourcePageName : ""
    };
  });

  if (ranges.includes(null)) {
    return [];
  }

  ranges.sort((a, b) => a.from - b.from || a.to - b.to);

  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i].from <= ranges[i - 1].to) {
      return fail(`变量「${variableName}」的范围发生重叠`) || [];
    }
  }

  return ranges;
}

function normalizeVariables(rawVariables, throwOnError = true) {
  const fail = (message) => {
    if (throwOnError) throw new Error(message);
    return null;
  };

  if (!Array.isArray(rawVariables)) {
    return [];
  }

  const seenPaths = new Set();
  const variables = [];

  for (let index = 0; index < rawVariables.length; index++) {
    const variable = rawVariables[index];
    const name = String((variable && variable.name) || (variable && variable.nodeName) || `变量 ${index + 1}`).trim();
    const path = Array.isArray(variable && variable.path)
      ? variable.path.map((part) => Number(part))
      : null;

    if (!name) {
      const error = fail(`第 ${index + 1} 个变量缺少名称`);
      if (error === null) continue;
    }
    if (!path || path.some((part) => !Number.isInteger(part) || part < 0)) {
      const error = fail(`变量「${name || index + 1}」的目标节点无效`);
      if (error === null) continue;
    }

    const pathKey = JSON.stringify(path);
    if (seenPaths.has(pathKey)) {
      const error = fail(`变量「${name}」重复绑定了同一个节点`);
      if (error === null) continue;
    }
    seenPaths.add(pathKey);

    const ranges = normalizeRanges((variable && variable.ranges) || [], name, throwOnError);
    if (!ranges.length) {
      const error = fail(`变量「${name}」至少需要一个范围`);
      if (error === null) continue;
    }

    variables.push({
      id: String((variable && variable.id) || `var_${Date.now()}_${index}`),
      name,
      path,
      nodeName: String((variable && variable.nodeName) || ""),
      ranges
    });
  }

  return variables;
}

function normalizeTemplate(templateId, template) {
  const source = template && typeof template === "object" ? template : {};
  const templateKind = normalizeTemplateKind(source.templateKind);
  const position = source.position && typeof source.position === "object"
    ? {
        x: Number(source.position.x) || 0,
        y: Number(source.position.y) || 0
      }
    : { x: 0, y: 0 };

  return {
    id: source.id || templateId,
    name: typeof source.name === "string" && source.name.trim() ? source.name.trim() : "区域模板",
    nodeId: typeof source.nodeId === "string" ? source.nodeId : "",
    pageId: typeof source.pageId === "string" ? source.pageId : "",
    templateKind,
    position,
    layoutFrame: normalizeLayoutFrame(source.layoutFrame),
    placement: normalizePlacement(source.placement, position, templateKind),
    indicatorPath: Array.isArray(source.indicatorPath) ? source.indicatorPath.map((part) => Number(part)) : null,
    pageFormat: typeof source.pageFormat === "string" && source.pageFormat ? source.pageFormat : "%n",
    totalMode: source.totalMode === "custom" ? "custom" : "auto",
    customTotal: source.customTotal !== undefined && source.customTotal !== null
      ? Number(source.customTotal) || null
      : null,
    pageNumberStart: Number.isFinite(Number(source.pageNumberStart))
      ? Number(source.pageNumberStart)
      : 1,
    excludedPageIds: Array.isArray(source.excludedPageIds)
      ? source.excludedPageIds.filter((id) => typeof id === "string")
      : [],
    variables: normalizeVariables(source.variables || [], false),
    createdAt: Number.isFinite(Number(source.createdAt)) ? Number(source.createdAt) : Date.now()
  };
}

function normalizeStorage(rawStorage) {
  const source = rawStorage && typeof rawStorage === "object" ? rawStorage : {};
  const templates = {};
  const templateInstanceMap = {};
  const settings = normalizeSettings(source.settings);

  for (const [templateId, template] of Object.entries(source.templates || {})) {
    templates[templateId] = normalizeTemplate(templateId, template);
  }

  if (source.templateInstanceMap && typeof source.templateInstanceMap === "object") {
    for (const key in source.templateInstanceMap) {
      if (Object.prototype.hasOwnProperty.call(source.templateInstanceMap, key)) {
        templateInstanceMap[key] = source.templateInstanceMap[key];
      }
    }
  }

  return {
    templates,
    templateInstanceMap,
    settings
  };
}

async function getStorage() {
  const raw = await figma.clientStorage.getAsync(STORAGE_KEY);
  return normalizeStorage(raw || emptyStorage());
}

async function saveStorage(storage) {
  await figma.clientStorage.setAsync(STORAGE_KEY, normalizeStorage(storage));
}

figma.showUI(__html__, {
  width: 360,
  height: 640,
  title: "Academic Slides Toolkit · " + RUNTIME_VERSION
});

function serializeNode(node, depth = 0) {
  const serialized = {
    id: node.id,
    name: node.name,
    type: node.type
  };

  if (depth < 5 && "children" in node) {
    serialized.children = node.children.map((child) => serializeNode(child, depth + 1));
  }

  return serialized;
}

function getNodePath(root, targetId) {
  if (root.id === targetId) return [];
  if (!("children" in root)) return null;

  for (let index = 0; index < root.children.length; index++) {
    const childPath = getNodePath(root.children[index], targetId);
    if (childPath !== null) {
      return [index].concat(childPath);
    }
  }

  return null;
}

function getNodeByPath(root, path) {
  let current = root;

  for (const index of path) {
    if (!("children" in current) || index >= current.children.length) {
      return null;
    }
    current = current.children[index];
  }

  return current;
}

function isTextNode(node) {
  return !!node && node.type === "TEXT";
}

function isSlidesEditor() {
  return figma.editorType === "slides" && typeof figma.getSlideGrid === "function";
}

async function ensureAllPagesLoaded() {
  if (!isSlidesEditor() || typeof figma.loadAllPagesAsync !== "function") {
    return;
  }

  if (!allPagesLoadedPromise) {
    allPagesLoadedPromise = figma.loadAllPagesAsync().catch((error) => {
      allPagesLoadedPromise = null;
      throw error;
    });
  }

  await allPagesLoadedPromise;
}

function getSlideList() {
  const slideGrid = figma.getSlideGrid ? figma.getSlideGrid() : [];
  const slides = [];
  const seenIds = new Set();

  for (let rowIndex = 0; rowIndex < slideGrid.length; rowIndex++) {
    const row = slideGrid[rowIndex];
    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      const slide = row[columnIndex];
      if (slide && slide.type === "SLIDE" && !seenIds.has(slide.id)) {
        seenIds.add(slide.id);
        slides.push(slide);
      }
    }
  }

  return slides;
}

function getAllTargets() {
  return isSlidesEditor() ? getSlideList() : figma.root.children.slice();
}

function getTargetById(targetId) {
  const targets = getAllTargets();
  for (let index = 0; index < targets.length; index++) {
    if (targets[index].id === targetId) {
      return targets[index];
    }
  }
  return null;
}

function getContainerIdForNode(node) {
  if (!node) return "";

  if (isSlidesEditor()) {
    let current = node;
    while (current) {
      if (current.type === "SLIDE") {
        return current.id;
      }
      current = current.parent || null;
    }
    return "";
  }

  return figma.currentPage.id;
}

function getPositionInContainer(node, container) {
  if (!node || !container) {
    return { x: 0, y: 0 };
  }

  if (node.parent === container) {
    return {
      x: Number(node.x) || 0,
      y: Number(node.y) || 0
    };
  }

  if ("absoluteTransform" in node && "absoluteTransform" in container) {
    return {
      x: (node.absoluteTransform && node.absoluteTransform[0] ? node.absoluteTransform[0][2] : 0)
        - (container.absoluteTransform && container.absoluteTransform[0] ? container.absoluteTransform[0][2] : 0),
      y: (node.absoluteTransform && node.absoluteTransform[1] ? node.absoluteTransform[1][2] : 0)
        - (container.absoluteTransform && container.absoluteTransform[1] ? container.absoluteTransform[1][2] : 0)
    };
  }

  return {
    x: Number(node.x) || 0,
    y: Number(node.y) || 0
  };
}

function getLayoutRect(container, layoutFrame) {
  const width = Number(container && container.width) || 0;
  const height = Number(container && container.height) || 0;
  const frame = normalizeLayoutFrame(layoutFrame);

  if (frame.area !== "safe-area") {
    return {
      x: 0,
      y: 0,
      width,
      height
    };
  }

  const left = frame.safeArea.left;
  const top = frame.safeArea.top;
  const right = frame.safeArea.right;
  const bottom = frame.safeArea.bottom;

  return {
    x: left,
    y: top,
    width: Math.max(0, width - left - right),
    height: Math.max(0, height - top - bottom)
  };
}

function buildPlacement(node, container, mode, fallbackPosition, layoutFrame) {
  const position = fallbackPosition || getPositionInContainer(node, container);
  const nodeWidth = Number(node && node.width) || 0;
  const nodeHeight = Number(node && node.height) || 0;
  const normalizedMode = normalizePlacementMode(mode);
  const rect = getLayoutRect(container, layoutFrame);
  const relativeX = (Number(position.x) || 0) - rect.x;
  const relativeY = (Number(position.y) || 0) - rect.y;

  if (normalizedMode === "custom") {
    return {
      mode: normalizedMode,
      x: relativeX,
      y: relativeY,
      offsetX: 0,
      offsetY: 0
    };
  }

  const centeredX = (rect.width - nodeWidth) / 2;
  const rightX = rect.width - nodeWidth;
  const bottomY = rect.height - nodeHeight;

  switch (normalizedMode) {
    case "top-left":
      return { mode: normalizedMode, x: relativeX, y: relativeY, offsetX: relativeX, offsetY: relativeY };
    case "top-center":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: relativeX - centeredX,
        offsetY: relativeY
      };
    case "top-right":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: rightX - relativeX,
        offsetY: relativeY
      };
    case "bottom-left":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: relativeX,
        offsetY: bottomY - relativeY
      };
    case "bottom-center":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: relativeX - centeredX,
        offsetY: bottomY - relativeY
      };
    case "bottom-right":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: rightX - relativeX,
        offsetY: bottomY - relativeY
      };
    default:
      return {
        mode: "custom",
        x: Number(position.x) || 0,
        y: Number(position.y) || 0,
        offsetX: 0,
        offsetY: 0
      };
  }
}

function applyTemplatePosition(node, template, container) {
  if (!node || !template) return;

  const placement = normalizePlacement(template.placement, template.position, template.templateKind);
  const rect = getLayoutRect(container, template.layoutFrame);
  if (placement.mode === "custom" || !container) {
    node.x = rect.x + (Number(placement.x) || 0);
    node.y = rect.y + (Number(placement.y) || 0);
    return;
  }

  const nodeWidth = Number(node.width) || 0;
  const nodeHeight = Number(node.height) || 0;
  const centeredX = (rect.width - nodeWidth) / 2;
  const rightX = rect.width - nodeWidth;
  const bottomY = rect.height - nodeHeight;

  switch (placement.mode) {
    case "top-left":
      node.x = rect.x + (Number(placement.offsetX) || 0);
      node.y = rect.y + (Number(placement.offsetY) || 0);
      break;
    case "top-center":
      node.x = rect.x + centeredX + (Number(placement.offsetX) || 0);
      node.y = rect.y + (Number(placement.offsetY) || 0);
      break;
    case "top-right":
      node.x = rect.x + rightX - (Number(placement.offsetX) || 0);
      node.y = rect.y + (Number(placement.offsetY) || 0);
      break;
    case "bottom-left":
      node.x = rect.x + (Number(placement.offsetX) || 0);
      node.y = rect.y + bottomY - (Number(placement.offsetY) || 0);
      break;
    case "bottom-center":
      node.x = rect.x + centeredX + (Number(placement.offsetX) || 0);
      node.y = rect.y + bottomY - (Number(placement.offsetY) || 0);
      break;
    case "bottom-right":
      node.x = rect.x + rightX - (Number(placement.offsetX) || 0);
      node.y = rect.y + bottomY - (Number(placement.offsetY) || 0);
      break;
    default:
      node.x = Number(placement.x) || 0;
      node.y = Number(placement.y) || 0;
      break;
  }
}

function getAbsolutePosition(node) {
  if (!node) {
    return { x: 0, y: 0 };
  }

  if ("absoluteTransform" in node && node.absoluteTransform) {
    return {
      x: node.absoluteTransform[0] ? Number(node.absoluteTransform[0][2]) || 0 : 0,
      y: node.absoluteTransform[1] ? Number(node.absoluteTransform[1][2]) || 0 : 0
    };
  }

  return {
    x: Number(node.x) || 0,
    y: Number(node.y) || 0
  };
}

function findViewportTarget() {
  const targets = getAllTargets();
  const center = figma.viewport.center;

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    const absolute = getAbsolutePosition(target);
    const width = Number(target.width) || 0;
    const height = Number(target.height) || 0;

    if (
      center.x >= absolute.x &&
      center.x <= absolute.x + width &&
      center.y >= absolute.y &&
      center.y <= absolute.y + height
    ) {
      return target;
    }
  }

  return targets.length ? targets[0] : figma.currentPage;
}

function getEquationInsertionTarget() {
  const selection = figma.currentPage.selection;
  if (selection.length) {
    const containerId = getContainerIdForNode(selection[0]);
    const target = getTargetById(containerId);
    if (target) return target;
  }

  return findViewportTarget();
}

function markEquationRoot(node, equationData) {
  if (!node || typeof node.setPluginData !== "function") return;

  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", EQUATION_KIND);
  node.setPluginData("equationRoot", "true");
  node.setPluginData("equationLatex", equationData.latex || "");
  node.setPluginData("equationDisplayMode", equationData.displayMode || "display");
  node.setPluginData("equationFontSize", String(equationData.fontSize || 32));
  node.setPluginData("equationColor", equationData.color || "#111827");
  if (!getPluginData(node, "equationNumberLabelId")) {
    node.setPluginData("equationNumberLabelId", "");
  }
}

function normalizeEquationPayload(message) {
  const latex = String(message && message.latex ? message.latex : "").trim();
  if (!latex) {
    throw new Error("公式内容不能为空");
  }

  const fontSize = Number(message && message.fontSize);
  const color = String(message && message.color ? message.color : "#111827").trim() || "#111827";

  return {
    latex,
    svgMarkup: String(message && message.svgMarkup ? message.svgMarkup : ""),
    displayMode: message && message.displayMode === "inline" ? "inline" : "display",
    fontSize: Number.isFinite(fontSize) && fontSize > 0 ? Math.round(fontSize) : 32,
    color
  };
}

function findEquationRoot(node) {
  let current = node || null;
  while (current) {
    if (
      typeof current.getPluginData === "function" &&
      getPluginData(current, "managedByAcademicSlides") === "true" &&
      getPluginData(current, "academicNodeKind") === EQUATION_KIND &&
      getPluginData(current, "equationRoot") === "true"
    ) {
      return current;
    }
    current = current.parent || null;
  }
  return null;
}

function serializeEquationNode(node) {
  if (!node) return null;

  return {
    nodeId: node.id,
    name: node.name,
    latex: getPluginData(node, "equationLatex"),
    displayMode: getPluginData(node, "equationDisplayMode") || "display",
    fontSize: Number(getPluginData(node, "equationFontSize")) || 32,
    color: getPluginData(node, "equationColor") || "#111827"
  };
}

function isEquationRootNode(node) {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === EQUATION_KIND
    && getPluginData(node, "equationRoot") === "true";
}

function walkScene(node, visit) {
  if (!node) return;
  visit(node);
  if ("children" in node) {
    for (let index = 0; index < node.children.length; index++) {
      walkScene(node.children[index], visit);
    }
  }
}

async function loadTargetIfNeeded(target) {
  if (target && typeof target.loadAsync === "function") {
    await target.loadAsync();
  }
}

async function getLoadedTargetById(targetId) {
  const fallbackTarget = getTargetById(targetId);
  if (fallbackTarget) {
    await loadTargetIfNeeded(fallbackTarget);
  }

  if (targetId && typeof figma.getNodeByIdAsync === "function") {
    const resolvedTarget = await figma.getNodeByIdAsync(targetId);
    if (
      resolvedTarget
      && resolvedTarget.id === targetId
      && (!isSlidesEditor() || resolvedTarget.type === "SLIDE")
    ) {
      await loadTargetIfNeeded(resolvedTarget);
      return resolvedTarget;
    }
    if (resolvedTarget && fallbackTarget && (resolvedTarget.id !== targetId || resolvedTarget.type !== fallbackTarget.type)) {
      console.error("[AcademicSlides][target-mismatch]", {
        requestedId: targetId,
        resolvedId: resolvedTarget.id,
        resolvedType: resolvedTarget.type,
        fallbackId: fallbackTarget.id,
        fallbackType: fallbackTarget.type
      });
    }
  }

  return fallbackTarget || null;
}

async function getTemplateNode(template) {
  if (!template || !template.pageId || !template.nodeId) {
    return null;
  }

  await getLoadedTargetById(template.pageId);
  return figma.getNodeByIdAsync(template.nodeId);
}

function getTemplateInstanceMapKey(templateId, targetId) {
  return templateId + "::" + targetId;
}

function isManagedTemplateRoot(node, templateId) {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "isTemplateInstanceRoot") === "true"
    && getPluginData(node, "templateInstanceFrom") === templateId;
}

function isAnyManagedTemplateRoot(node) {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "isTemplateInstanceRoot") === "true";
}

async function findManagedTemplateInstancesOnTarget(target, templateId) {
  const found = [];
  if (!target) return null;

  await loadTargetIfNeeded(target);
  walkScene(target, (node) => {
    if (isManagedTemplateRoot(node, templateId)) {
      found.push(node);
    }
  });

  return found;
}

async function findAllManagedTemplateRootsOnTarget(target) {
  const found = [];
  if (!target) return found;

  await loadTargetIfNeeded(target);
  walkScene(target, (node) => {
    if (isAnyManagedTemplateRoot(node)) {
      found.push(node);
    }
  });

  return found;
}

function getNodeRect(node) {
  return {
    x: Number(node && node.x) || 0,
    y: Number(node && node.y) || 0,
    width: Number(node && node.width) || 0,
    height: Number(node && node.height) || 0
  };
}

function doRectsOverlap(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function getTemplateKindPriority(templateKind) {
  if (templateKind === "header") return 10;
  if (templateKind === "footer") return 20;
  return 30;
}

async function countTemplateConflictsOnTarget(node, target, templateId) {
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

async function reorderManagedTemplateInstancesOnTarget(target, storage) {
  const roots = await findAllManagedTemplateRootsOnTarget(target);
  roots.sort((a, b) => {
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

async function getManagedTemplateInstanceForTarget(templateId, targetId, storage) {
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

async function removeManagedTemplateInstancesOnTarget(templateId, targetId, storage) {
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

function resolveRuntimeVariables(templateNode, template, messageVariables) {
  const variables = messageVariables
    ? normalizeVariables(messageVariables, true)
    : normalizeVariables(template.variables || [], true);

  for (let index = 0; index < variables.length; index++) {
    const targetNode = getNodeByPath(templateNode, variables[index].path);
    if (!isTextNode(targetNode)) {
      throw new Error("变量「" + variables[index].name + "」绑定的节点不是文本节点");
    }
  }

  return variables;
}

async function collectEquationRoots(scope, currentTargetId) {
  const results = [];
  const targets = getAllTargets();

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (scope === "current" && currentTargetId && target.id !== currentTargetId) {
      continue;
    }

    await loadTargetIfNeeded(target);
    walkScene(target, (node) => {
      if (isEquationRootNode(node)) {
        results.push({
          targetId: target.id,
          targetIndex: index,
          node
        });
      }
    });
  }

  results.sort((a, b) => {
    if (a.targetIndex !== b.targetIndex) return a.targetIndex - b.targetIndex;
    const aPosition = getAbsolutePosition(a.node);
    const bPosition = getAbsolutePosition(b.node);
    const ay = Number(aPosition.y) || 0;
    const by = Number(bPosition.y) || 0;
    if (ay !== by) return ay - by;
    return (Number(aPosition.x) || 0) - (Number(bPosition.x) || 0);
  });

  return results;
}

function formatEquationNumber(style, index) {
  if (style === "eq") {
    return "Eq. " + index;
  }
  if (style === "eq-paren") {
    return "Eq. (" + index + ")";
  }
  return "(" + index + ")";
}

async function ensureEquationLabel(root, content) {
  let label = null;
  const existingId = getPluginData(root, "equationNumberLabelId");
  if (existingId) {
    label = await figma.getNodeByIdAsync(existingId);
  }

  if (!label || label.type !== "TEXT") {
    label = figma.createText();
    label.name = "Equation Number";
    label.setPluginData("managedByAcademicSlides", "true");
    label.setPluginData("academicNodeKind", "equation-number-label");
    label.setPluginData("equationLabelFor", root.id);
    root.parent.appendChild(label);
    root.setPluginData("equationNumberLabelId", label.id);
  }

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  label.fontName = { family: "Inter", style: "Regular" };
  label.fontSize = 18;
  label.characters = content;
  label.fills = [{ type: "SOLID", color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 } }];
  label.x = (Number(root.x) || 0) + (Number(root.width) || 0) + 16;
  label.y = (Number(root.y) || 0) + Math.max(0, ((Number(root.height) || 0) - (Number(label.height) || 0)) / 2);
  return label;
}

async function removeEquationLabel(root) {
  if (!root) return false;
  const labelId = getPluginData(root, "equationNumberLabelId");
  if (!labelId) return false;

  const label = await figma.getNodeByIdAsync(labelId);
  if (label) {
    label.remove();
  }
  root.setPluginData("equationNumberLabelId", "");
  return !!label;
}

function markManagedTemplateSubtree(node, templateId) {
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

function markManagedTemplateRoot(node, templateId) {
  markManagedTemplateSubtree(node, templateId);
  if (node && typeof node.setPluginData === "function") {
    node.setPluginData("isTemplateInstanceRoot", "true");
  }
}

async function removeManagedTemplateInstancesFromScene(templateId, storage) {
  const removedIds = new Set();
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

    const strayNodes = [];
    walkScene(target, (node) => {
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

async function loadAllFonts(node) {
  let loaded = true;
  if (node.type === "TEXT") {
    try {
      if (node.fontName !== figma.mixed) {
        await figma.loadFontAsync(node.fontName);
      } else {
        const seen = new Set();
        for (let index = 0; index < node.characters.length; index++) {
          const fontName = node.getRangeFontName(index, index + 1);
          const key = JSON.stringify(fontName);
          if (!seen.has(key)) {
            seen.add(key);
            await figma.loadFontAsync(fontName);
          }
        }
      }
    } catch (_) {
      loaded = false;
    }
  }

  if ("children" in node) {
    for (const child of node.children) {
      const childLoaded = await loadAllFonts(child);
      if (!childLoaded) {
        loaded = false;
      }
    }
  }

  return loaded;
}

function formatPageNumber(format, pageNumber, total) {
  const safeFormat = format || "%n";

  function pad2(value) {
    const text = String(value);
    return text.length < 2 ? "0" + text : text;
  }

  return safeFormat
    .replace(/%02n/g, pad2(pageNumber))
    .replace(/%02t/g, pad2(total))
    .replace(/%n/g, String(pageNumber))
    .replace(/%t/g, String(total));
}

async function updatePageIndicator(clonedRoot, indicatorPath, pageNumber, total, format) {
  const indicatorNode = getNodeByPath(clonedRoot, indicatorPath);
  if (!isTextNode(indicatorNode)) return;

  await loadAllFonts(indicatorNode);
  indicatorNode.characters = formatPageNumber(format, pageNumber, total);
}

async function applyVariables(clonedRoot, variables, pageNumber) {
  if (!Array.isArray(variables) || variables.length === 0) return;

  for (const variable of variables) {
    const activeRange = (variable.ranges || []).find(
      (range) => pageNumber >= Number(range.from) && pageNumber <= Number(range.to)
    );
    if (!activeRange) continue;

    const variableNode = getNodeByPath(clonedRoot, variable.path);
    if (!isTextNode(variableNode)) continue;

    await loadAllFonts(variableNode);
    variableNode.characters = String(activeRange.value);
  }
}

async function resolveVariableSourceNode(template, storage, path, sourcePageId) {
  let templateInstanceRoot = null;
  const templateRoot = await getTemplateNode(template);

  if (sourcePageId === template.pageId) {
    templateInstanceRoot = templateRoot;
  } else {
    templateInstanceRoot = await getManagedTemplateInstanceForTarget(template.id, sourcePageId, storage);
    if (!templateInstanceRoot && templateRoot) {
      templateInstanceRoot = templateRoot.clone();
    }
  }

  if (!templateInstanceRoot) return null;
  return getNodeByPath(templateInstanceRoot, path);
}

async function buildVariableSourceCache(template, storage) {
  const cache = new Map();
  const missing = [];

  for (const variable of template.variables || []) {
    for (const range of variable.ranges || []) {
      if (!range.sourcePageId) continue;

      const cacheKey = `${JSON.stringify(variable.path)}::${range.sourcePageId}`;
      if (cache.has(cacheKey)) continue;

      const sourceNode = await resolveVariableSourceNode(
        template,
        storage,
        variable.path,
        range.sourcePageId
      );

      if (!isTextNode(sourceNode)) {
        missing.push({
          variableName: variable.name,
          sourcePageId: range.sourcePageId
        });
        continue;
      }

      cache.set(cacheKey, sourceNode.clone());
    }
  }

  return { cache, missing };
}

async function replaceTextNodeWithSource(root, path, sourceNode) {
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

async function applyVariableSources(clonedRoot, template, variables, pageNumber, sourceCache) {
  if (!Array.isArray(variables) || variables.length === 0) return;

  for (const variable of variables) {
    const activeRange = (variable.ranges || []).find(
      (range) => pageNumber >= Number(range.from) && pageNumber <= Number(range.to)
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

async function stampClone(clone, template, pageNumber, total, sourceCache) {
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

function buildPageNumberMap(pages, template) {
  const excludedIds = new Set(template.excludedPageIds || []);
  const rawStartNumber = Number(template.pageNumberStart);
  const startNumber = Number.isFinite(rawStartNumber) ? rawStartNumber : 1;
  const pageNumberMap = {};
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

function effectiveTotal(pages, template) {
  if (template.totalMode === "custom" && template.customTotal) {
    return Number(template.customTotal);
  }

  const excludedIds = new Set(template.excludedPageIds || []);
  return pages.filter((page) => !excludedIds.has(page.id)).length;
}

function listPages() {
  const targets = getAllTargets();

  return targets.map((target, index) => ({
    id: target.id,
    name: target.name || (isSlidesEditor() ? `Slide ${index + 1}` : `Page ${index + 1}`),
    index
  }));
}

function postError(message) {
  figma.ui.postMessage({ type: "error", message });
}

function ensureCustomTotal(totalMode, customTotal) {
  if (totalMode !== "custom") return null;

  const value = Number(customTotal);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("自定义总页数必须是大于 0 的数字");
  }

  return value;
}

async function handleGetSelection() {
  const selection = figma.currentPage.selection;
  const selectedNode = selection.length > 0 ? selection[0] : null;
  const equationRoot = findEquationRoot(selectedNode);

  figma.ui.postMessage({
    type: "selection",
    node: selectedNode ? serializeNode(selectedNode) : null,
    equation: serializeEquationNode(equationRoot)
  });
}

async function handleGetPages(message) {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = message.templateId ? storage.templates[message.templateId] : null;

  figma.ui.postMessage({
    type: "pages",
    templateId: message.templateId || null,
    sourcePageId: template ? template.pageId : null,
    pages: listPages()
  });
}

async function handleInsertEquation(message) {
  const equation = normalizeEquationPayload(message);
  if (!equation.svgMarkup) {
    postError("公式 SVG 为空，请先等待预览完成");
    return;
  }

  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("当前无法定位插入位置");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  const equationNode = figma.createNodeFromSvg(equation.svgMarkup);
  equationNode.name = equation.displayMode === "inline" ? "Inline Equation" : "Equation";
  markEquationRoot(equationNode, equation);

  target.appendChild(equationNode);

  const center = figma.viewport.center;
  const targetAbsolute = getAbsolutePosition(target);
  equationNode.x = Math.round(center.x - targetAbsolute.x - equationNode.width / 2);
  equationNode.y = Math.round(center.y - targetAbsolute.y - equationNode.height / 2);

  figma.currentPage.selection = [equationNode];
  figma.viewport.scrollAndZoomIntoView([equationNode]);

  figma.ui.postMessage({
    type: "equation-inserted",
    equation: serializeEquationNode(equationNode)
  });
}

async function handleUpdateEquation(message) {
  const equation = normalizeEquationPayload(message);
  const currentNode = message && message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const equationRoot = findEquationRoot(currentNode);

  if (!equationRoot) {
    postError("未找到可更新的公式节点");
    return;
  }
  if (!equation.svgMarkup) {
    postError("公式 SVG 为空，请先等待预览完成");
    return;
  }

  const parent = equationRoot.parent;
  if (!parent || typeof parent.insertChild !== "function") {
    postError("当前公式节点无法被更新");
    return;
  }

  const replacement = figma.createNodeFromSvg(equation.svgMarkup);
  replacement.name = equation.displayMode === "inline" ? "Inline Equation" : "Equation";
  markEquationRoot(replacement, equation);
  const existingLabelId = getPluginData(equationRoot, "equationNumberLabelId");

  const insertIndex = parent.children.indexOf(equationRoot);
  parent.insertChild(insertIndex, replacement);
  replacement.x = equationRoot.x;
  replacement.y = equationRoot.y;

  if (existingLabelId && equation.displayMode === "display") {
    const label = await figma.getNodeByIdAsync(existingLabelId);
    if (label && label.type === "TEXT") {
      replacement.setPluginData("equationNumberLabelId", label.id);
      label.setPluginData("equationLabelFor", replacement.id);
      label.x = (Number(replacement.x) || 0) + (Number(replacement.width) || 0) + 16;
      label.y = (Number(replacement.y) || 0) + Math.max(0, ((Number(replacement.height) || 0) - (Number(label.height) || 0)) / 2);
    }
  } else if (existingLabelId) {
    await removeEquationLabel(equationRoot);
  }

  equationRoot.remove();

  figma.currentPage.selection = [replacement];
  figma.viewport.scrollAndZoomIntoView([replacement]);

  figma.ui.postMessage({
    type: "equation-updated",
    equation: serializeEquationNode(replacement)
  });
}

async function handleDeleteEquation(message) {
  const currentNode = message && message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const equationRoot = findEquationRoot(currentNode);

  if (!equationRoot) {
    postError("未找到可删除的公式节点");
    return;
  }

  await removeEquationLabel(equationRoot);
  equationRoot.remove();
  figma.currentPage.selection = [];

  figma.ui.postMessage({ type: "equation-deleted" });
  await handleGetSelection();
}

async function handleApplyEquationNumbering(message) {
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length ? getTargetById(getContainerIdForNode(selection[0])) : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const scope = message && message.scope === "current" ? "current" : "all";
  const style = message && typeof message.style === "string" ? message.style : "paren";
  const roots = await collectEquationRoots(scope, currentTargetId);

  let updated = 0;
  let counter = 1;
  for (let index = 0; index < roots.length; index++) {
    const root = roots[index].node;
    if (getPluginData(root, "equationDisplayMode") !== "display") {
      continue;
    }
    await ensureEquationLabel(root, formatEquationNumber(style, counter));
    updated += 1;
    counter += 1;
  }

  figma.ui.postMessage({
    type: "equation-numbering-applied",
    count: updated,
    scope
  });
}

async function handleClearEquationNumbering(message) {
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length ? getTargetById(getContainerIdForNode(selection[0])) : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const scope = message && message.scope === "current" ? "current" : "all";
  const roots = await collectEquationRoots(scope, currentTargetId);

  let removed = 0;
  for (let index = 0; index < roots.length; index++) {
    const didRemove = await removeEquationLabel(roots[index].node);
    if (didRemove) removed += 1;
  }

  figma.ui.postMessage({
    type: "equation-numbering-cleared",
    count: removed,
    scope
  });
}

async function handleSetTemplate(message) {
  const node = await figma.getNodeByIdAsync(message.nodeId);
  if (!node) {
    postError("找不到选中的模板区域节点");
    return;
  }

  const totalMode = message.totalMode === "custom" ? "custom" : "auto";
  const customTotal = ensureCustomTotal(totalMode, message.customTotal);
  const storage = await getStorage();
  const requestedTemplateId = typeof message.templateId === "string" && storage.templates[message.templateId]
    ? message.templateId
    : "";
  const existingTemplateId = node.getPluginData("academicTemplateId");
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
      postError("页码节点必须位于模板区域内部");
      return;
    }

    const indicatorNode = getNodeByPath(node, indicatorPath);
    if (!isTextNode(indicatorNode)) {
      postError("页码节点必须是文本节点");
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
    postError(isSlidesEditor() ? "请在某一页 Slide 内选择模板区域节点" : "找不到当前页面");
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

  node.setPluginData("academicTemplateId", nextTemplateId);

  await saveStorage(storage);
  figma.ui.postMessage({
    type: "template-saved",
    templateId: nextTemplateId,
    mode: isUpdating ? "updated" : "created"
  });
  await handleGetTemplates();
}

async function handleUpdateTemplateConfig(message) {
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  if (!template) {
    postError("模板不存在");
    return;
  }

  template.excludedPageIds = Array.isArray(message.excludedPageIds)
    ? message.excludedPageIds.filter((id) => typeof id === "string")
    : [];
  template.pageNumberStart = Number.isFinite(Number(message.pageNumberStart))
    ? Number(message.pageNumberStart)
    : 1;

  await saveStorage(storage);
  figma.ui.postMessage({ type: "config-saved", templateId: message.templateId });
  await handleGetTemplates();
}

async function handleApplyToAll(message) {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  if (!template) {
    postError("模板不存在");
    return;
  }

  const templateNode = await getTemplateNode(template);
  if (!templateNode) {
    postError("模板节点已被删除，请重新保存模板");
    return;
  }

  const runtimeTemplate = normalizeTemplate(template.id, template);
  runtimeTemplate.variables = resolveRuntimeVariables(templateNode, runtimeTemplate, message.variables);
  if (Array.isArray(message.excludedPageIds)) {
    runtimeTemplate.excludedPageIds = message.excludedPageIds.filter((id) => typeof id === "string");
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
  let conflicts = 0;

  for (const target of targets) {
    const pageNumber = pageNumberMap[target.id];
    const mapKey = getTemplateInstanceMapKey(template.id, target.id);
    const existingTemplateInstance = await getManagedTemplateInstanceForTarget(template.id, target.id, storage);

    if (pageNumber === null) {
      const removedOnExcluded = await removeManagedTemplateInstancesOnTarget(template.id, target.id, storage);
      if (!removedOnExcluded && message.overwrite && existingTemplateInstance) {
        existingTemplateInstance.remove();
        delete storage.templateInstanceMap[mapKey];
      }
      skipped += 1;
      continue;
    }

    if (target.id === runtimeTemplate.pageId) {
      skipped += 1;
      continue;
    }

    if (existingTemplateInstance && !message.overwrite) {
      skipped += 1;
      continue;
    }

    const targetNode = await getLoadedTargetById(target.id);

    if (existingTemplateInstance && message.overwrite) {
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

  await saveStorage(storage);
  figma.ui.postMessage({
    type: "apply-complete",
    applied,
    skipped,
    total: targets.length,
    conflicts,
    missingSources: sourceCacheResult.missing.length
  });
}

async function handleSyncAll(message) {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  if (!template) {
    postError("模板不存在");
    return;
  }

  const templateNode = await getTemplateNode(template);
  if (!templateNode) {
    postError("模板节点已被删除，请重新保存模板");
    return;
  }

  const runtimeTemplate = normalizeTemplate(template.id, template);
  runtimeTemplate.variables = resolveRuntimeVariables(templateNode, runtimeTemplate, message.variables);
  if (Array.isArray(message.excludedPageIds)) {
    runtimeTemplate.excludedPageIds = message.excludedPageIds.filter((id) => typeof id === "string");
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
  let synced = 0;
  let removed = 0;
  let conflicts = 0;

  for (const target of targets) {
    const pageNumber = pageNumberMap[target.id];
    const mapKey = getTemplateInstanceMapKey(template.id, target.id);
    const existingTemplateInstance = await getManagedTemplateInstanceForTarget(template.id, target.id, storage);

    if (pageNumber === null) {
      removed += await removeManagedTemplateInstancesOnTarget(template.id, target.id, storage);
      continue;
    }

    if (target.id === runtimeTemplate.pageId) {
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
    synced += 1;
  }

  await saveStorage(storage);
  figma.ui.postMessage({
    type: "sync-complete",
    synced,
    removed,
    conflicts,
    missingSources: sourceCacheResult.missing.length
  });
}

async function handleRemoveTemplateInstances(templateId) {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[templateId];

  if (!template) {
    postError("模板不存在");
    return;
  }

  const removed = await removeManagedTemplateInstancesFromScene(templateId, storage);

  await saveStorage(storage);
  figma.ui.postMessage({ type: "remove-complete", templateId: templateId, removed: removed });
  await handleGetTemplates();
}

async function handleGetTemplates() {
  const storage = await getStorage();
  const templates = Object.values(storage.templates).sort((a, b) => {
    return Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });

  figma.ui.postMessage({ type: "templates", templates });
}

async function handleGetSettings() {
  const storage = await getStorage();
  figma.ui.postMessage({
    type: "settings",
    settings: normalizeSettings(storage.settings)
  });
}

async function handleSaveSettings(message) {
  const storage = await getStorage();
  storage.settings = normalizeSettings(message && message.settings);
  await saveStorage(storage);

  figma.ui.postMessage({
    type: "settings-saved",
    settings: normalizeSettings(storage.settings)
  });
}

async function handleDeleteTemplate(templateId) {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[templateId];

  if (!template) {
    postError("模板不存在");
    return;
  }

  const templateNode = await getTemplateNode(template);

  if (templateNode && templateNode.getPluginData("academicTemplateId") === templateId) {
    templateNode.setPluginData("academicTemplateId", "");
  }

  await removeManagedTemplateInstancesFromScene(templateId, storage);

  delete storage.templates[templateId];

  await saveStorage(storage);
  await handleGetTemplates();
}

async function handleCheckVariableCandidate(message) {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  const fail = (reason) => {
    figma.ui.postMessage({ type: "variable-candidate", isValid: false, reason });
  };

  if (!template) {
    fail("模板不存在");
    return;
  }

  const templateNode = await getTemplateNode(template);
  if (!templateNode) {
    fail("模板节点不存在，请重新保存模板");
    return;
  }

  const selection = figma.currentPage.selection;
  if (selection.length !== 1) {
    fail("请在 Figma 中只选中一个文本节点");
    return;
  }

  if (getContainerIdForNode(selection[0]) !== template.pageId) {
    fail(isSlidesEditor() ? "请切换到模板所在的 Slide 后再检测变量节点" : "请切换到模板所在页面后再检测变量节点");
    return;
  }

  const targetNode = selection[0];
  if (!isTextNode(targetNode)) {
    fail("变量只支持文本节点");
    return;
  }

  const path = getNodePath(templateNode, targetNode.id);
  if (path === null) {
    fail("所选节点不在该模板内部");
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

async function handleSaveVariables(message) {
  await ensureAllPagesLoaded();
  const storage = await getStorage();
  const template = storage.templates[message.templateId];

  if (!template) {
    postError("模板不存在");
    return;
  }

  const templateNode = await getTemplateNode(template);
  if (!templateNode) {
    postError("模板节点不存在，请重新保存模板");
    return;
  }

  const variables = normalizeVariables(message.variables || [], true);

  for (const variable of variables) {
    const targetNode = getNodeByPath(templateNode, variable.path);
    if (!isTextNode(targetNode)) {
      postError(`变量「${variable.name}」绑定的节点不是文本节点`);
      return;
    }
  }

  template.variables = variables;
  await saveStorage(storage);

  figma.ui.postMessage({ type: "variables-saved", templateId: message.templateId });
  await handleGetTemplates();
}

figma.ui.onmessage = async (message) => {
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
  } catch (error) {
    postError(`操作失败：${error && error.message ? error.message : String(error)}`);
    console.error("[AcademicSlides]", error);
  }
};

figma.on("selectionchange", handleGetSelection);

handleGetSelection();
handleGetTemplates();
handleGetSettings();
