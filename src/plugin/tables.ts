// ---------------------------------------------------------------------------
// Table + Caption component — structured academic table blocks
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

export const TABLE_KIND = "table";

// ── Plugin data helpers ─────────────────────────────────────────────────────

export function markTableRoot(node: any, data: any): void {
  if (!node || typeof node.setPluginData !== "function") return;
  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", TABLE_KIND);
  node.setPluginData("tableRoot", "true");
  node.setPluginData("tableCaption", data.caption || "");
  node.setPluginData("tableLabelPrefix", data.labelPrefix || "Table");
  node.setPluginData("tableRows", String(data.rows || 3));
  node.setPluginData("tableCols", String(data.cols || 3));
}

export function isTableRootNode(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === TABLE_KIND
    && getPluginData(node, "tableRoot") === "true";
}

export function findTableRoot(node: any): any {
  let current = node || null;
  while (current) {
    if (isTableRootNode(current)) return current;
    current = current.parent || null;
  }
  return null;
}

export function serializeTableNode(node: any): any {
  if (!node) return null;
  return {
    nodeId: node.id,
    name: node.name,
    caption: getPluginData(node, "tableCaption"),
    labelPrefix: getPluginData(node, "tableLabelPrefix") || "Table",
    rows: Number(getPluginData(node, "tableRows")) || 3,
    cols: Number(getPluginData(node, "tableCols")) || 3,
  };
}

// ── Collect all tables for numbering ────────────────────────────────────────

export async function collectTableRoots(scope: string, currentTargetId: string): Promise<any[]> {
  const results: any[] = [];
  const targets = getAllTargets();

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (scope === "current" && currentTargetId && target.id !== currentTargetId) continue;

    await loadTargetIfNeeded(target);
    walkScene(target, (node: any) => {
      if (isTableRootNode(node)) {
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

// ── Create table frame ──────────────────────────────────────────────────────

async function createTableFrame(data: {
  caption: string;
  labelPrefix: string;
  rows: number;
  cols: number;
}): Promise<any> {
  const cellWidth = 120;
  const cellHeight = 36;
  const tableWidth = cellWidth * data.cols;
  const tableHeight = cellHeight * data.rows;

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });

  // Outer container — auto-layout vertical
  const frame = figma.createFrame();
  frame.name = "Table";
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisAlignItems = "CENTER";
  frame.counterAxisAlignItems = "CENTER";
  frame.itemSpacing = 12;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;
  frame.paddingLeft = 16;
  frame.paddingRight = 16;
  frame.cornerRadius = 8;
  frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.82, g: 0.84, b: 0.86 } }]; // #D1D5DB
  frame.strokeWeight = 1;
  frame.resize(tableWidth + 32, tableHeight + 80); // padding + caption space

  // Caption text FIRST (above the table — academic convention for tables)
  const caption = figma.createText();
  caption.name = "Caption";
  caption.fontName = { family: "Inter", style: "Regular" };
  caption.fontSize = 14;
  caption.fills = [{ type: "SOLID", color: { r: 0.27, g: 0.30, b: 0.34 } }]; // #444D56
  caption.characters = data.caption || "Table caption";
  caption.textAlignHorizontal = "CENTER";
  caption.layoutAlign = "STRETCH";
  caption.textAutoResize = "HEIGHT";
  frame.appendChild(caption);

  // Table grid frame
  const gridFrame = figma.createFrame();
  gridFrame.name = "TableGrid";
  gridFrame.layoutMode = "VERTICAL";
  gridFrame.itemSpacing = 0;
  gridFrame.paddingTop = 0;
  gridFrame.paddingBottom = 0;
  gridFrame.paddingLeft = 0;
  gridFrame.paddingRight = 0;
  gridFrame.fills = [];
  gridFrame.strokes = [{ type: "SOLID", color: { r: 0.82, g: 0.84, b: 0.86 } }]; // #D1D5DB
  gridFrame.strokeWeight = 1;
  gridFrame.layoutAlign = "STRETCH";
  gridFrame.resize(tableWidth, tableHeight);

  for (let r = 0; r < data.rows; r++) {
    const isHeader = r === 0;
    const rowFrame = figma.createFrame();
    rowFrame.name = isHeader ? "HeaderRow" : `Row ${r}`;
    rowFrame.layoutMode = "HORIZONTAL";
    rowFrame.itemSpacing = 0;
    rowFrame.paddingTop = 0;
    rowFrame.paddingBottom = 0;
    rowFrame.paddingLeft = 0;
    rowFrame.paddingRight = 0;
    rowFrame.fills = [];
    rowFrame.layoutAlign = "STRETCH";
    rowFrame.resize(tableWidth, cellHeight);

    for (let c = 0; c < data.cols; c++) {
      // Cell frame (used as container for the rectangle + text)
      const cell = figma.createFrame();
      cell.name = isHeader ? `Header ${c + 1}` : `Cell ${r}-${c + 1}`;
      cell.resize(cellWidth, cellHeight);
      cell.layoutMode = "VERTICAL";
      cell.primaryAxisAlignItems = "CENTER";
      cell.counterAxisAlignItems = "CENTER";
      cell.paddingTop = 4;
      cell.paddingBottom = 4;
      cell.paddingLeft = 8;
      cell.paddingRight = 8;

      if (isHeader) {
        cell.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.96, b: 0.96 } }]; // #F3F4F6
      } else {
        cell.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      }

      // Bottom border for body rows
      if (!isHeader) {
        cell.strokes = [{ type: "SOLID", color: { r: 0.90, g: 0.91, b: 0.92 } }]; // #E5E7EB
        cell.strokeWeight = 1;
        cell.strokeTopWeight = 0;
        cell.strokeLeftWeight = 0;
        cell.strokeRightWeight = 0;
        cell.strokeBottomWeight = 1;
      }

      const text = figma.createText();
      text.name = "CellText";
      text.fontName = isHeader
        ? { family: "Inter", style: "Semi Bold" }
        : { family: "Inter", style: "Regular" };
      text.fontSize = 12;
      text.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
      text.characters = isHeader ? `Col ${c + 1}` : "";
      text.textAlignHorizontal = "CENTER";
      text.textAutoResize = "HEIGHT";
      text.layoutAlign = "STRETCH";
      cell.appendChild(text);

      rowFrame.appendChild(cell);
    }

    gridFrame.appendChild(rowFrame);
  }

  frame.appendChild(gridFrame);

  return frame;
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function handleInsertTable(message: any): Promise<void> {
  const caption = String(message.caption || "").trim() || "Table caption";
  const labelPrefix = String(message.labelPrefix || "Table").trim();
  const rows = Math.max(1, Number(message.rows) || 3);
  const cols = Math.max(1, Number(message.cols) || 3);

  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("当前无法定位插入位置", "errorNoInsertTarget");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  const tableFrame = await createTableFrame({ caption, labelPrefix, rows, cols });
  markTableRoot(tableFrame, { caption, labelPrefix, rows, cols });

  target.appendChild(tableFrame);

  const center = figma.viewport.center;
  const targetAbsolute = getAbsolutePosition(target);
  tableFrame.x = Math.round(center.x - targetAbsolute.x - tableFrame.width / 2);
  tableFrame.y = Math.round(center.y - targetAbsolute.y - tableFrame.height / 2);

  figma.currentPage.selection = [tableFrame];
  figma.viewport.scrollAndZoomIntoView([tableFrame]);

  figma.ui.postMessage({
    type: "table-inserted",
    table: serializeTableNode(tableFrame),
  });
}

export async function handleUpdateTableCaption(message: any): Promise<void> {
  const nodeId = message && message.nodeId;
  if (!nodeId) {
    postError("未指定 Table 节点", "errorNoTableNode");
    return;
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  const tableRoot = findTableRoot(node);
  if (!tableRoot) {
    postError("未找到可更新的 Table", "errorNoTableToUpdate");
    return;
  }

  const caption = String(message.caption || "").trim();
  if (caption) {
    tableRoot.setPluginData("tableCaption", caption);

    // Find and update the caption text node
    walkScene(tableRoot, (child: any) => {
      if (child.type === "TEXT" && child.name === "Caption") {
        loadAllFonts(child).then(() => {
          child.characters = caption;
        });
      }
    });
  }

  figma.ui.postMessage({
    type: "table-updated",
    table: serializeTableNode(tableRoot),
  });
}

export async function handleDeleteTable(message: any): Promise<void> {
  const node = message && message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const tableRoot = findTableRoot(node);

  if (!tableRoot) {
    postError("未找到可删除的 Table", "errorNoTableToDelete");
    return;
  }

  tableRoot.remove();
  figma.currentPage.selection = [];
  figma.ui.postMessage({ type: "table-deleted" });
}

export async function handleApplyTableNumbering(message: any): Promise<void> {
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length
    ? getTargetById(getContainerIdForNode(selection[0]))
    : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const scope = message && message.scope === "current" ? "current" : "all";
  const roots = await collectTableRoots(scope, currentTargetId);

  let updated = 0;
  for (let index = 0; index < roots.length; index++) {
    const root = roots[index].node;
    const prefix = getPluginData(root, "tableLabelPrefix") || "Table";
    const newCaption = `${prefix} ${index + 1}. ${getPluginData(root, "tableCaption") || ""}`.trim();

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
    type: "table-numbering-applied",
    count: updated,
    scope,
  });
}
