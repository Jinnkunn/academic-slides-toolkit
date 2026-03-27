// ---------------------------------------------------------------------------
// Subfigure Layout — grid of sub-figures with individual sub-captions
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

import { AcademicNodeKind } from "./types";
export const SUBFIGURE_KIND = AcademicNodeKind.Subfigure;

// ── Plugin data helpers ─────────────────────────────────────────────────────

export function markSubfigureNode(node: any, data: any): void {
  if (!node || typeof node.setPluginData !== "function") return;
  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", SUBFIGURE_KIND);
  node.setPluginData("subfigureRoot", "true");
  node.setPluginData("subfigureLayout", data.layout || "2x2");
  node.setPluginData("subfigureCaption", data.caption || "");
  node.setPluginData("subfigureLabelPrefix", data.labelPrefix || "Figure");
  node.setPluginData("subfigureCount", String(data.count || 4));
}

export function isSubfigureNode(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === SUBFIGURE_KIND
    && getPluginData(node, "subfigureRoot") === "true";
}

export function findSubfigureRoot(node: any): any {
  let current = node || null;
  while (current) {
    if (isSubfigureNode(current)) return current;
    current = current.parent || null;
  }
  return null;
}

export function serializeSubfigureNode(node: any): any {
  if (!node) return null;

  // Collect sub-captions by walking cells
  const subcaptions: string[] = [];
  walkScene(node, (child: any) => {
    if (child.type === "TEXT" && child.name.startsWith("Sub-caption")) {
      subcaptions.push(child.characters || "");
    }
  });

  return {
    nodeId: node.id,
    name: node.name,
    layout: getPluginData(node, "subfigureLayout") || "2x2",
    caption: getPluginData(node, "subfigureCaption") || "",
    labelPrefix: getPluginData(node, "subfigureLabelPrefix") || "Figure",
    count: Number(getPluginData(node, "subfigureCount")) || 4,
    subcaptions,
  };
}

// ── Collect all subfigure roots for numbering ─────────────────────────────

export async function collectSubfigureRoots(scope: string, currentTargetId: string): Promise<any[]> {
  const results: any[] = [];
  const targets = getAllTargets();

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (scope === "current" && currentTargetId && target.id !== currentTargetId) continue;

    await loadTargetIfNeeded(target);
    walkScene(target, (node: any) => {
      if (isSubfigureNode(node)) {
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

// ── Layout parsing ──────────────────────────────────────────────────────────

function parseLayout(layout: string): { rows: number; cols: number } {
  const parts = layout.split("x");
  const rows = Math.max(1, parseInt(parts[0], 10) || 2);
  const cols = Math.max(1, parseInt(parts[1], 10) || 2);
  return { rows, cols };
}

function sublabel(index: number): string {
  return `(${String.fromCharCode(97 + index)})`;
}

// ── Create subfigure frame ──────────────────────────────────────────────────

async function createSubfigureFrame(data: {
  layout: string;
  caption: string;
  labelPrefix: string;
  subcaptions: string[];
  cellWidth: number;
  cellHeight: number;
}): Promise<any> {
  const { rows, cols } = parseLayout(data.layout);
  const totalCells = rows * cols;

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  // ── Outer container — auto-layout vertical ──
  const frame = figma.createFrame();
  frame.name = "Subfigure";
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisAlignItems = "CENTER";
  frame.counterAxisAlignItems = "CENTER";
  frame.itemSpacing = 12;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;
  frame.paddingLeft = 16;
  frame.paddingRight = 16;
  frame.cornerRadius = 8;
  frame.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.99 } }]; // #FAFAFE
  frame.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.91, b: 0.93 } }]; // #E5E7EB
  frame.strokeWeight = 1;

  // ── Grid frame ──
  const gridFrame = figma.createFrame();
  gridFrame.name = "Grid";
  gridFrame.layoutMode = "VERTICAL";
  gridFrame.primaryAxisAlignItems = "CENTER";
  gridFrame.counterAxisAlignItems = "CENTER";
  gridFrame.itemSpacing = 12;
  gridFrame.fills = [];
  frame.appendChild(gridFrame);

  let cellIndex = 0;
  for (let r = 0; r < rows; r++) {
    const rowFrame = figma.createFrame();
    rowFrame.name = `Row ${r + 1}`;
    rowFrame.layoutMode = "HORIZONTAL";
    rowFrame.primaryAxisAlignItems = "MIN";
    rowFrame.counterAxisAlignItems = "MIN";
    rowFrame.itemSpacing = 12;
    rowFrame.fills = [];
    gridFrame.appendChild(rowFrame);

    for (let c = 0; c < cols; c++) {
      if (cellIndex >= totalCells) break;

      const cellFrame = figma.createFrame();
      cellFrame.name = `Cell ${sublabel(cellIndex)}`;
      cellFrame.layoutMode = "VERTICAL";
      cellFrame.primaryAxisAlignItems = "CENTER";
      cellFrame.counterAxisAlignItems = "CENTER";
      cellFrame.itemSpacing = 4;
      cellFrame.fills = [];
      rowFrame.appendChild(cellFrame);

      // Placeholder rectangle
      const placeholder = figma.createRectangle();
      placeholder.name = "Placeholder";
      placeholder.resize(data.cellWidth, data.cellHeight);
      placeholder.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.94, b: 0.95 } }]; // #EDEEF0
      placeholder.cornerRadius = 4;
      cellFrame.appendChild(placeholder);

      // Sub-caption text
      const subCaptionText = data.subcaptions[cellIndex]
        ? `${sublabel(cellIndex)} ${data.subcaptions[cellIndex]}`
        : `${sublabel(cellIndex)} Description`;
      const subCaption = figma.createText();
      subCaption.name = `Sub-caption ${sublabel(cellIndex)}`;
      subCaption.fontName = { family: "Inter", style: "Regular" };
      subCaption.fontSize = 12;
      subCaption.fills = [{ type: "SOLID", color: { r: 0.42, g: 0.44, b: 0.50 } }]; // #6B7280
      subCaption.characters = subCaptionText;
      subCaption.textAlignHorizontal = "CENTER";
      subCaption.textAutoResize = "HEIGHT";
      subCaption.resize(data.cellWidth, subCaption.height);
      cellFrame.appendChild(subCaption);

      cellIndex++;
    }
  }

  // ── Main caption ──
  const mainCaption = figma.createText();
  mainCaption.name = "Main Caption";
  mainCaption.fontName = { family: "Inter", style: "Regular" };
  mainCaption.fontSize = 14;
  mainCaption.fills = [{ type: "SOLID", color: { r: 0.27, g: 0.29, b: 0.31 } }]; // #454A50
  mainCaption.characters = data.caption || "Figure caption";
  mainCaption.textAlignHorizontal = "CENTER";
  mainCaption.textAutoResize = "HEIGHT";
  mainCaption.layoutAlign = "STRETCH";
  frame.appendChild(mainCaption);

  // Resize outer frame to fit content
  const totalWidth = cols * data.cellWidth + (cols - 1) * 12 + 32;
  const totalHeight = rows * (data.cellHeight + 24) + (rows - 1) * 12 + 80;
  frame.resize(totalWidth, totalHeight);

  return frame;
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function handleInsertSubfigure(message: any): Promise<void> {
  const layout = String(message.layout || "2x2").trim();
  const caption = String(message.caption || "").trim() || "Figure caption";
  const labelPrefix = String(message.labelPrefix || "Figure").trim();
  const subcaptions: string[] = Array.isArray(message.subcaptions) ? message.subcaptions : [];
  const cellWidth = Math.max(60, Number(message.cellWidth) || 200);
  const cellHeight = Math.max(40, Number(message.cellHeight) || 150);

  const { rows, cols } = parseLayout(layout);
  const count = rows * cols;

  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("当前无法定位插入位置", "errorNoInsertTarget");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  const subfigureFrame = await createSubfigureFrame({
    layout,
    caption,
    labelPrefix,
    subcaptions,
    cellWidth,
    cellHeight,
  });

  markSubfigureNode(subfigureFrame, { layout, caption, labelPrefix, count });

  target.appendChild(subfigureFrame);

  const center = figma.viewport.center;
  const targetAbsolute = getAbsolutePosition(target);
  subfigureFrame.x = Math.round(center.x - targetAbsolute.x - subfigureFrame.width / 2);
  subfigureFrame.y = Math.round(center.y - targetAbsolute.y - subfigureFrame.height / 2);

  figma.currentPage.selection = [subfigureFrame];
  figma.viewport.scrollAndZoomIntoView([subfigureFrame]);

  figma.ui.postMessage({
    type: "subfigure-inserted",
    subfigure: serializeSubfigureNode(subfigureFrame),
  });
}

export async function handleUpdateSubfigure(message: any): Promise<void> {
  const nodeId = message && message.nodeId;
  if (!nodeId) {
    postError("未指定 Subfigure 节点", "errorNoSubfigureNode");
    return;
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  const subfigureRoot = findSubfigureRoot(node);
  if (!subfigureRoot) {
    postError("未找到可更新的 Subfigure", "errorNoSubfigureToUpdate");
    return;
  }

  // Update main caption
  const caption = String(message.caption || "").trim();
  if (caption) {
    subfigureRoot.setPluginData("subfigureCaption", caption);

    walkScene(subfigureRoot, (child: any) => {
      if (child.type === "TEXT" && child.name === "Main Caption") {
        loadAllFonts(child).then(() => {
          child.characters = caption;
        });
      }
    });
  }

  // Update sub-captions
  const subcaptions: string[] = Array.isArray(message.subcaptions) ? message.subcaptions : [];
  if (subcaptions.length > 0) {
    let subIndex = 0;
    walkScene(subfigureRoot, (child: any) => {
      if (child.type === "TEXT" && child.name.startsWith("Sub-caption") && subIndex < subcaptions.length) {
        const label = sublabel(subIndex);
        const text = subcaptions[subIndex]
          ? `${label} ${subcaptions[subIndex]}`
          : `${label} Description`;
        loadAllFonts(child).then(() => {
          child.characters = text;
        });
        subIndex++;
      }
    });
  }

  figma.ui.postMessage({
    type: "subfigure-updated",
    subfigure: serializeSubfigureNode(subfigureRoot),
  });
}

export async function handleDeleteSubfigure(message: any): Promise<void> {
  const node = message && message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const subfigureRoot = findSubfigureRoot(node);

  if (!subfigureRoot) {
    postError("未找到可删除的 Subfigure", "errorNoSubfigureToDelete");
    return;
  }

  subfigureRoot.remove();
  figma.currentPage.selection = [];
  figma.ui.postMessage({ type: "subfigure-deleted" });
}

export async function handleApplySubfigureNumbering(message: any): Promise<void> {
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length
    ? getTargetById(getContainerIdForNode(selection[0]))
    : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const scope = message && message.scope === "current" ? "current" : "all";
  const roots = await collectSubfigureRoots(scope, currentTargetId);

  let updated = 0;
  for (let index = 0; index < roots.length; index++) {
    const root = roots[index].node;
    const prefix = getPluginData(root, "subfigureLabelPrefix") || "Figure";
    const rawCaption = getPluginData(root, "subfigureCaption") || "";
    const newCaption = `${prefix} ${index + 1}: ${rawCaption}`.trim();

    walkScene(root, (child: any) => {
      if (child.type === "TEXT" && child.name === "Main Caption") {
        loadAllFonts(child).then(() => {
          child.characters = newCaption;
        });
      }
    });
    updated++;
  }

  figma.ui.postMessage({
    type: "subfigure-numbering-applied",
    count: updated,
    scope,
  });
}
