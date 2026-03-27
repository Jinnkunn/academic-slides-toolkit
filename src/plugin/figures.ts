// ---------------------------------------------------------------------------
// Figure + Caption component — structured academic figure blocks
// ---------------------------------------------------------------------------

import { createPluginError, postError } from "./errors";
import { getPluginData } from "./storage";
import { isTextNode, walkScene, loadTargetIfNeeded, loadAllFonts } from "./nodes";
import {
  isSlidesEditor,
  getAllTargets,
  getTargetById,
  getContainerIdForNode,
  findViewportTarget,
  getEquationInsertionTarget,
} from "./slides";
import { getAbsolutePosition } from "./layout";

export const FIGURE_KIND = "figure";

// ── Plugin data helpers ─────────────────────────────────────────────────────

export function markFigureRoot(node: any, data: any): void {
  if (!node || typeof node.setPluginData !== "function") return;
  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", FIGURE_KIND);
  node.setPluginData("figureRoot", "true");
  node.setPluginData("figureCaption", data.caption || "");
  node.setPluginData("figureLabelPrefix", data.labelPrefix || "Figure");
  node.setPluginData("figureWidth", String(data.width || 400));
  node.setPluginData("figureHeight", String(data.height || 300));
}

export function isFigureRootNode(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === FIGURE_KIND
    && getPluginData(node, "figureRoot") === "true";
}

export function findFigureRoot(node: any): any {
  let current = node || null;
  while (current) {
    if (isFigureRootNode(current)) return current;
    current = current.parent || null;
  }
  return null;
}

export function serializeFigureNode(node: any): any {
  if (!node) return null;
  return {
    nodeId: node.id,
    name: node.name,
    caption: getPluginData(node, "figureCaption"),
    labelPrefix: getPluginData(node, "figureLabelPrefix") || "Figure",
    width: Number(getPluginData(node, "figureWidth")) || 400,
    height: Number(getPluginData(node, "figureHeight")) || 300,
  };
}

// ── Collect all figures for numbering ───────────────────────────────────────

export async function collectFigureRoots(scope: string, currentTargetId: string): Promise<any[]> {
  const results: any[] = [];
  const targets = getAllTargets();

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (scope === "current" && currentTargetId && target.id !== currentTargetId) continue;

    await loadTargetIfNeeded(target);
    walkScene(target, (node: any) => {
      if (isFigureRootNode(node)) {
        results.push({ targetId: target.id, targetIndex: index, node });
      }
    });
  }

  results.sort((a, b) => {
    if (a.targetIndex !== b.targetIndex) return a.targetIndex - b.targetIndex;
    const ay = Number(getAbsolutePosition(a.node).y) || 0;
    const by = Number(getAbsolutePosition(b.node).y) || 0;
    if (ay !== by) return ay - by;
    return (Number(getAbsolutePosition(a.node).x) || 0) - (Number(getAbsolutePosition(b.node).x) || 0);
  });

  return results;
}

// ── Create figure frame ─────────────────────────────────────────────────────

async function createFigureFrame(data: {
  caption: string;
  labelPrefix: string;
  width: number;
  height: number;
}): Promise<any> {
  // Outer container — auto-layout vertical
  const frame = figma.createFrame();
  frame.name = "Figure";
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisAlignItems = "CENTER";
  frame.counterAxisAlignItems = "CENTER";
  frame.itemSpacing = 12;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;
  frame.paddingLeft = 16;
  frame.paddingRight = 16;
  frame.cornerRadius = 8;
  frame.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.99 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.91, b: 0.93 } }];
  frame.strokeWeight = 1;
  frame.resize(data.width + 32, data.height + 80); // padding + caption space

  // Image placeholder
  const placeholder = figma.createRectangle();
  placeholder.name = "Image Placeholder";
  placeholder.resize(data.width, data.height);
  placeholder.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.94, b: 0.95 } }];
  placeholder.cornerRadius = 4;
  placeholder.layoutAlign = "STRETCH";
  frame.appendChild(placeholder);

  // Caption text
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  const caption = figma.createText();
  caption.name = "Caption";
  caption.fontName = { family: "Inter", style: "Regular" };
  caption.fontSize = 14;
  caption.fills = [{ type: "SOLID", color: { r: 0.27, g: 0.30, b: 0.33 } }];
  caption.characters = data.caption || "Figure caption";
  caption.textAlignHorizontal = "CENTER";
  caption.layoutAlign = "STRETCH";
  caption.textAutoResize = "HEIGHT";
  frame.appendChild(caption);

  return frame;
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function handleInsertFigure(message: any): Promise<void> {
  const caption = String(message.caption || "").trim() || "Figure caption";
  const labelPrefix = String(message.labelPrefix || "Figure").trim();
  const width = Math.max(100, Number(message.width) || 400);
  const height = Math.max(60, Number(message.height) || 300);

  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("当前无法定位插入位置", "errorNoInsertTarget");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  const figureFrame = await createFigureFrame({ caption, labelPrefix, width, height });
  markFigureRoot(figureFrame, { caption, labelPrefix, width, height });

  target.appendChild(figureFrame);

  const center = figma.viewport.center;
  const targetAbsolute = getAbsolutePosition(target);
  figureFrame.x = Math.round(center.x - targetAbsolute.x - figureFrame.width / 2);
  figureFrame.y = Math.round(center.y - targetAbsolute.y - figureFrame.height / 2);

  figma.currentPage.selection = [figureFrame];
  figma.viewport.scrollAndZoomIntoView([figureFrame]);

  figma.ui.postMessage({
    type: "figure-inserted",
    figure: serializeFigureNode(figureFrame),
  });
}

export async function handleUpdateFigureCaption(message: any): Promise<void> {
  const nodeId = message && message.nodeId;
  if (!nodeId) {
    postError("未指定 Figure 节点", "errorNoFigureNode");
    return;
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  const figureRoot = findFigureRoot(node);
  if (!figureRoot) {
    postError("未找到可更新的 Figure", "errorNoFigureToUpdate");
    return;
  }

  const caption = String(message.caption || "").trim();
  if (caption) {
    figureRoot.setPluginData("figureCaption", caption);

    // Find and update the caption text node
    walkScene(figureRoot, (child: any) => {
      if (child.type === "TEXT" && child.name === "Caption") {
        loadAllFonts(child).then(() => {
          child.characters = caption;
        });
      }
    });
  }

  figma.ui.postMessage({
    type: "figure-updated",
    figure: serializeFigureNode(figureRoot),
  });
}

export async function handleDeleteFigure(message: any): Promise<void> {
  const node = message && message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const figureRoot = findFigureRoot(node);

  if (!figureRoot) {
    postError("未找到可删除的 Figure", "errorNoFigureToDelete");
    return;
  }

  figureRoot.remove();
  figma.currentPage.selection = [];
  figma.ui.postMessage({ type: "figure-deleted" });
}

export async function handleApplyFigureNumbering(message: any): Promise<void> {
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length
    ? getTargetById(getContainerIdForNode(selection[0]))
    : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const scope = message && message.scope === "current" ? "current" : "all";
  const roots = await collectFigureRoots(scope, currentTargetId);

  let updated = 0;
  for (let index = 0; index < roots.length; index++) {
    const root = roots[index].node;
    const prefix = getPluginData(root, "figureLabelPrefix") || "Figure";
    const newCaption = `${prefix} ${index + 1}. ${getPluginData(root, "figureCaption") || ""}`.trim();

    walkScene(root, (child: any) => {
      if (child.type === "TEXT" && child.name === "Caption") {
        loadAllFonts(child).then(() => {
          child.characters = newCaption;
        });
      }
    });
    updated++;
  }

  figma.ui.postMessage({
    type: "figure-numbering-applied",
    count: updated,
    scope,
  });
}
