// ---------------------------------------------------------------------------
// Equation management – insert, update, delete, numbering
// ---------------------------------------------------------------------------

import { createPluginError, postError } from "./errors";
import { getPluginData } from "./storage";
import { isTextNode, walkScene, loadTargetIfNeeded, loadAllFonts, serializeNode } from "./nodes";
import {
  isSlidesEditor,
  getAllTargets,
  getTargetById,
  getContainerIdForNode,
  findViewportTarget,
  getEquationInsertionTarget,
} from "./slides";
import { getAbsolutePosition } from "./layout";

export const EQUATION_KIND = "equation";

// ── Core helpers ────────────────────────────────────────────────────────────

export function markEquationRoot(node: any, equationData: any): void {
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

export function normalizeEquationPayload(message: any): {
  latex: string;
  svgMarkup: string;
  displayMode: "inline" | "display";
  fontSize: number;
  color: string;
} {
  const latex = String(message && message.latex ? message.latex : "").trim();
  if (!latex) {
    throw createPluginError("errorEmptyLatex", "公式内容不能为空");
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

export function findEquationRoot(node: any): any | null {
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

export function serializeEquationNode(node: any): any | null {
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

export function isEquationRootNode(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === EQUATION_KIND
    && getPluginData(node, "equationRoot") === "true";
}

// ── Collection & numbering ──────────────────────────────────────────────────

export async function collectEquationRoots(
  scope: string,
  currentTargetId: string
): Promise<Array<{ targetId: string; targetIndex: number; node: any }>> {
  const results: Array<{ targetId: string; targetIndex: number; node: any }> = [];
  const targets = getAllTargets();

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (scope === "current" && currentTargetId && target.id !== currentTargetId) {
      continue;
    }

    await loadTargetIfNeeded(target);
    walkScene(target, (node: any) => {
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

export function formatEquationNumber(style: string, index: number): string {
  if (style === "eq") {
    return "Eq. " + index;
  }
  if (style === "eq-paren") {
    return "Eq. (" + index + ")";
  }
  return "(" + index + ")";
}

export async function ensureEquationLabel(root: any, content: string): Promise<any> {
  let label: any = null;
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

export async function removeEquationLabel(root: any): Promise<boolean> {
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

// ── Handler: get-selection ──────────────────────────────────────────────────

export async function handleGetSelection(extraData?: Record<string, any>): Promise<void> {
  const selection = figma.currentPage.selection;
  const selectedNode = selection.length > 0 ? selection[0] : null;
  const equationRoot = findEquationRoot(selectedNode);

  figma.ui.postMessage({
    type: "selection",
    node: selectedNode ? serializeNode(selectedNode) : null,
    equation: serializeEquationNode(equationRoot),
    ...extraData,
  });
}

// ── Handler: insert-equation ────────────────────────────────────────────────

export async function handleInsertEquation(message: any): Promise<void> {
  const equation = normalizeEquationPayload(message);
  if (!equation.svgMarkup) {
    postError("公式 SVG 为空，请先等待预览完成", "errorEmptySvg");
    return;
  }

  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("当前无法定位插入位置", "errorNoInsertTarget");
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

// ── Handler: update-equation ────────────────────────────────────────────────

export async function handleUpdateEquation(message: any): Promise<void> {
  const equation = normalizeEquationPayload(message);
  const currentNode = message && message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const equationRoot = findEquationRoot(currentNode);

  if (!equationRoot) {
    postError("未找到可更新的公式节点", "errorNoEquationToUpdate");
    return;
  }
  if (!equation.svgMarkup) {
    postError("公式 SVG 为空，请先等待预览完成", "errorEmptySvg");
    return;
  }

  const parent = equationRoot.parent;
  if (!parent || typeof parent.insertChild !== "function") {
    postError("当前公式节点无法被更新", "errorEquationCannotUpdate");
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

// ── Handler: delete-equation ────────────────────────────────────────────────

export async function handleDeleteEquation(message: any): Promise<void> {
  const currentNode = message && message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const equationRoot = findEquationRoot(currentNode);

  if (!equationRoot) {
    postError("未找到可删除的公式节点", "errorNoEquationToDelete");
    return;
  }

  await removeEquationLabel(equationRoot);
  equationRoot.remove();
  figma.currentPage.selection = [];

  figma.ui.postMessage({ type: "equation-deleted" });
  await handleGetSelection();
}

// ── Handler: apply-equation-numbering ───────────────────────────────────────

export async function handleApplyEquationNumbering(message: any): Promise<void> {
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

// ── Handler: clear-equation-numbering ───────────────────────────────────────

export async function handleClearEquationNumbering(message: any): Promise<void> {
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
