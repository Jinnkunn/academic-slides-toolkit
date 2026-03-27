// ---------------------------------------------------------------------------
// Theorem / Definition / Proof component — structured academic theorem blocks
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

export const THEOREM_KIND = "theorem";

export type TheoremType =
  | "theorem"
  | "lemma"
  | "definition"
  | "proof"
  | "corollary"
  | "proposition"
  | "remark"
  | "example";

// ── Color mapping ───────────────────────────────────────────────────────────

export function getTheoremTypeColor(type: TheoremType): { r: number; g: number; b: number } {
  switch (type) {
    case "theorem":
    case "lemma":
    case "corollary":
    case "proposition":
      return { r: 0.231, g: 0.510, b: 0.965 }; // #3B82F6
    case "definition":
      return { r: 0.063, g: 0.725, b: 0.506 }; // #10B981
    case "proof":
      return { r: 0.420, g: 0.451, b: 0.498 }; // #6B7280
    case "remark":
    case "example":
      return { r: 0.961, g: 0.620, b: 0.043 }; // #F59E0B
    default:
      return { r: 0.231, g: 0.510, b: 0.965 };
  }
}

// ── Plugin data helpers ─────────────────────────────────────────────────────

export function markTheoremRoot(node: any, data: any): void {
  if (!node || typeof node.setPluginData !== "function") return;
  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", THEOREM_KIND);
  node.setPluginData("theoremRoot", "true");
  node.setPluginData("theoremType", data.theoremType || "theorem");
  node.setPluginData("theoremTitle", data.theoremTitle || "");
  node.setPluginData("theoremBody", data.theoremBody || "");
}

export function isTheoremRootNode(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === THEOREM_KIND
    && getPluginData(node, "theoremRoot") === "true";
}

export function findTheoremRoot(node: any): any {
  let current = node || null;
  while (current) {
    if (isTheoremRootNode(current)) return current;
    current = current.parent || null;
  }
  return null;
}

export function serializeTheoremNode(node: any): any {
  if (!node) return null;
  return {
    nodeId: node.id,
    name: node.name,
    theoremType: getPluginData(node, "theoremType") || "theorem",
    theoremTitle: getPluginData(node, "theoremTitle") || "",
    theoremBody: getPluginData(node, "theoremBody") || "",
  };
}

// ── Collect all theorems for numbering ────────────────────────────────────

export async function collectTheoremRoots(scope: string, currentTargetId: string): Promise<any[]> {
  const results: any[] = [];
  const targets = getAllTargets();

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (scope === "current" && currentTargetId && target.id !== currentTargetId) continue;

    await loadTargetIfNeeded(target);
    walkScene(target, (node: any) => {
      if (isTheoremRootNode(node)) {
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

// ── Capitalize helper ───────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Build header text ───────────────────────────────────────────────────────

function buildHeaderText(type: TheoremType, title?: string, number?: number): string {
  const label = capitalize(type);
  const num = number != null ? ` ${number}` : "";
  const suffix = title ? ` (${title})` : "";
  return `${label}${num}.${suffix}`;
}

// ── Create theorem frame ────────────────────────────────────────────────────

async function createTheoremFrame(data: {
  theoremType: TheoremType;
  theoremTitle: string;
  theoremBody: string;
}): Promise<any> {
  const typeColor = getTheoremTypeColor(data.theoremType);

  // Outer frame — horizontal layout (accent bar + content)
  const frame = figma.createFrame();
  frame.name = `${capitalize(data.theoremType)}`;
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisAlignItems = "MIN";
  frame.counterAxisAlignItems = "MIN";
  frame.itemSpacing = 0;
  frame.paddingTop = 0;
  frame.paddingBottom = 0;
  frame.paddingLeft = 0;
  frame.paddingRight = 0;
  frame.cornerRadius = 6;
  frame.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.99 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.91, b: 0.93 } }];
  frame.strokeWeight = 1;
  frame.resize(520, 120);

  // Left accent bar
  const accent = figma.createRectangle();
  accent.name = "Accent Bar";
  accent.resize(4, 120);
  accent.fills = [{ type: "SOLID", color: typeColor }];
  accent.layoutAlign = "STRETCH";
  accent.layoutGrow = 0;
  frame.appendChild(accent);

  // Content frame — vertical layout
  const content = figma.createFrame();
  content.name = "Content";
  content.layoutMode = "VERTICAL";
  content.primaryAxisAlignItems = "MIN";
  content.counterAxisAlignItems = "MIN";
  content.itemSpacing = 10;
  content.paddingTop = 16;
  content.paddingBottom = 16;
  content.paddingLeft = 16;
  content.paddingRight = 16;
  content.fills = [];
  content.layoutGrow = 1;
  content.layoutAlign = "STRETCH";
  frame.appendChild(content);

  // Load fonts
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  // Header text (bold)
  const header = figma.createText();
  header.name = "Header";
  header.fontName = { family: "Inter", style: "Bold" };
  header.fontSize = 16;
  header.fills = [{ type: "SOLID", color: typeColor }];
  header.characters = buildHeaderText(data.theoremType, data.theoremTitle);
  header.layoutAlign = "STRETCH";
  header.textAutoResize = "HEIGHT";
  content.appendChild(header);

  // Body text (regular)
  const body = figma.createText();
  body.name = "Body";
  body.fontName = { family: "Inter", style: "Regular" };
  body.fontSize = 14;
  body.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.22, b: 0.25 } }];
  body.characters = data.theoremBody || "Statement goes here.";
  body.layoutAlign = "STRETCH";
  body.textAutoResize = "HEIGHT";
  content.appendChild(body);

  return frame;
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function handleInsertTheorem(message: any): Promise<void> {
  const theoremType: TheoremType = (message.theoremType || "theorem") as TheoremType;
  const theoremTitle = String(message.theoremTitle || "").trim();
  const theoremBody = String(message.theoremBody || "").trim() || "Statement goes here.";

  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("当前无法定位插入位置", "errorNoInsertTarget");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  const theoremFrame = await createTheoremFrame({ theoremType, theoremTitle, theoremBody });
  markTheoremRoot(theoremFrame, { theoremType, theoremTitle, theoremBody });

  target.appendChild(theoremFrame);

  const center = figma.viewport.center;
  const targetAbsolute = getAbsolutePosition(target);
  theoremFrame.x = Math.round(center.x - targetAbsolute.x - theoremFrame.width / 2);
  theoremFrame.y = Math.round(center.y - targetAbsolute.y - theoremFrame.height / 2);

  figma.currentPage.selection = [theoremFrame];
  figma.viewport.scrollAndZoomIntoView([theoremFrame]);

  figma.ui.postMessage({
    type: "theorem-inserted",
    theorem: serializeTheoremNode(theoremFrame),
  });
}

export async function handleUpdateTheorem(message: any): Promise<void> {
  const nodeId = message && message.nodeId;
  if (!nodeId) {
    postError("未指定 Theorem 节点", "errorNoTheoremNode");
    return;
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  const theoremRoot = findTheoremRoot(node);
  if (!theoremRoot) {
    postError("未找到可更新的 Theorem", "errorNoTheoremToUpdate");
    return;
  }

  const theoremTitle = message.theoremTitle != null ? String(message.theoremTitle).trim() : null;
  const theoremBody = message.theoremBody != null ? String(message.theoremBody).trim() : null;

  if (theoremTitle != null) {
    theoremRoot.setPluginData("theoremTitle", theoremTitle);
  }
  if (theoremBody != null) {
    theoremRoot.setPluginData("theoremBody", theoremBody);
  }

  const currentType = (getPluginData(theoremRoot, "theoremType") || "theorem") as TheoremType;
  const updatedTitle = theoremTitle != null ? theoremTitle : getPluginData(theoremRoot, "theoremTitle") || "";
  const updatedBody = theoremBody != null ? theoremBody : getPluginData(theoremRoot, "theoremBody") || "";

  // Update header text node
  walkScene(theoremRoot, (child: any) => {
    if (child.type === "TEXT" && child.name === "Header") {
      loadAllFonts(child).then(() => {
        child.characters = buildHeaderText(currentType, updatedTitle);
      });
    }
  });

  // Update body text node
  if (theoremBody != null) {
    walkScene(theoremRoot, (child: any) => {
      if (child.type === "TEXT" && child.name === "Body") {
        loadAllFonts(child).then(() => {
          child.characters = updatedBody || "Statement goes here.";
        });
      }
    });
  }

  figma.ui.postMessage({
    type: "theorem-updated",
    theorem: serializeTheoremNode(theoremRoot),
  });
}

export async function handleDeleteTheorem(message: any): Promise<void> {
  const node = message && message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const theoremRoot = findTheoremRoot(node);

  if (!theoremRoot) {
    postError("未找到可删除的 Theorem", "errorNoTheoremToDelete");
    return;
  }

  theoremRoot.remove();
  figma.currentPage.selection = [];
  figma.ui.postMessage({ type: "theorem-deleted" });
}

export async function handleApplyTheoremNumbering(message: any): Promise<void> {
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length
    ? getTargetById(getContainerIdForNode(selection[0]))
    : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const scope = message && message.scope === "current" ? "current" : "all";
  const roots = await collectTheoremRoots(scope, currentTargetId);

  // Group by theorem type for per-type numbering
  const counters: Record<string, number> = {};
  let updated = 0;

  for (let index = 0; index < roots.length; index++) {
    const root = roots[index].node;
    const type = (getPluginData(root, "theoremType") || "theorem") as TheoremType;
    const title = getPluginData(root, "theoremTitle") || "";

    if (!counters[type]) counters[type] = 0;
    counters[type]++;

    const newHeader = buildHeaderText(type, title, counters[type]);

    walkScene(root, (child: any) => {
      if (child.type === "TEXT" && child.name === "Header") {
        loadAllFonts(child).then(() => {
          child.characters = newHeader;
        });
      }
    });
    updated++;
  }

  figma.ui.postMessage({
    type: "theorem-numbering-applied",
    count: updated,
    scope,
  });
}
