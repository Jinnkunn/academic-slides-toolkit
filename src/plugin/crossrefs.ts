// ---------------------------------------------------------------------------
// Cross-reference management – insert, update, collect cross-ref text nodes
// ---------------------------------------------------------------------------

import { createPluginError, postError } from "./errors";
import { getPluginData } from "./storage";
import { isTextNode, walkScene, loadTargetIfNeeded, loadAllFonts } from "./nodes";
import {
  getAllTargets,
  getTargetById,
  getContainerIdForNode,
  findViewportTarget,
  getEquationInsertionTarget,
} from "./slides";
import { getAbsolutePosition } from "./layout";
import { collectEquationRoots, EQUATION_KIND } from "./equations";
import { collectFigureRoots, FIGURE_KIND } from "./figures";
import { collectTheoremRoots, THEOREM_KIND } from "./theorems";
import { collectTableRoots, TABLE_KIND } from "./tables";

export const CROSSREF_KIND = "crossref";

// ── Preset format options ────────────────────────────────────────────────────

export const CROSSREF_FORMAT_OPTIONS: Record<string, { label: string; format: string }[]> = {
  equation: [
    { label: "(1)", format: "({n})" },
    { label: "(Eq. 1)", format: "(Eq. {n})" },
    { label: "Eq. (1)", format: "Eq. ({n})" },
    { label: "Equation 1", format: "Equation {n}" },
  ],
  figure: [
    { label: "(Fig. 1)", format: "(Fig. {n})" },
    { label: "Fig. 1", format: "Fig. {n}" },
    { label: "Figure 1", format: "Figure {n}" },
  ],
  table: [
    { label: "(Table 1)", format: "(Table {n})" },
    { label: "Table 1", format: "Table {n}" },
    { label: "(表 1)", format: "(表 {n})" },
  ],
  theorem: [
    { label: "(Thm. 1)", format: "(Thm. {n})" },
    { label: "Theorem 1", format: "Theorem {n}" },
  ],
};

// ── Core helpers ─────────────────────────────────────────────────────────────

export function markCrossrefNode(node: any, data: any): void {
  if (!node || typeof node.setPluginData !== "function") return;

  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", CROSSREF_KIND);
  node.setPluginData("crossrefRoot", "true");
  node.setPluginData("crossrefTargetKind", data.targetKind || "");
  node.setPluginData("crossrefTargetId", data.targetId || "");
  node.setPluginData("crossrefIndex", String(data.index || 1));
  node.setPluginData("crossrefFormat", data.format || "({n})");
}

export function isCrossrefNode(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === CROSSREF_KIND
    && getPluginData(node, "crossrefRoot") === "true";
}

export function serializeCrossrefNode(node: any): any | null {
  if (!node) return null;

  return {
    nodeId: node.id,
    name: node.name,
    targetKind: getPluginData(node, "crossrefTargetKind"),
    targetId: getPluginData(node, "crossrefTargetId"),
    index: Number(getPluginData(node, "crossrefIndex")) || 1,
    format: getPluginData(node, "crossrefFormat") || "({n})",
  };
}

// ── Format helper ────────────────────────────────────────────────────────────

function formatCrossref(format: string, index: number): string {
  return format.replace(/\{n\}/g, String(index));
}

// ── Collection ───────────────────────────────────────────────────────────────

export async function collectCrossrefs(
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
      if (isCrossrefNode(node)) {
        results.push({
          targetId: target.id,
          targetIndex: index,
          node,
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

// ── Handler: insert-crossref ─────────────────────────────────────────────────

export async function handleInsertCrossref(message: any): Promise<void> {
  const targetKind = String(message && message.targetKind || "equation").trim();
  const format = String(message && message.format || "({n})").trim();
  const index = Math.max(1, Number(message && message.index) || 1);
  const targetId = String(message && message.targetId || "").trim();

  const displayText = formatCrossref(format, index);

  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("当前无法定位插入位置", "errorNoInsertTarget");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  // Create text node
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  const textNode = figma.createText();
  textNode.name = "Cross-ref: " + targetKind;
  textNode.fontName = { family: "Inter", style: "Regular" };
  textNode.fontSize = 16;
  textNode.characters = displayText;
  textNode.fills = [{ type: "SOLID", color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 } }];

  markCrossrefNode(textNode, { targetKind, targetId, index, format });

  target.appendChild(textNode);

  // Position at viewport center
  const center = figma.viewport.center;
  const targetAbsolute = getAbsolutePosition(target);
  textNode.x = Math.round(center.x - targetAbsolute.x - textNode.width / 2);
  textNode.y = Math.round(center.y - targetAbsolute.y - textNode.height / 2);

  figma.currentPage.selection = [textNode];
  figma.viewport.scrollAndZoomIntoView([textNode]);

  figma.ui.postMessage({
    type: "crossref-inserted",
    crossref: serializeCrossrefNode(textNode),
  });
}

// ── Build numbering map for a given kind ─────────────────────────────────────

export async function buildNumberingMap(
  targetKind: string,
  scope: string,
  currentTargetId: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  if (targetKind === "equation") {
    const roots = await collectEquationRoots(scope, currentTargetId);
    let counter = 1;
    for (let i = 0; i < roots.length; i++) {
      const root = roots[i].node;
      // Only display-mode equations are numbered
      if (getPluginData(root, "equationDisplayMode") !== "display") continue;
      map.set(root.id, counter);
      counter++;
    }
  } else if (targetKind === "figure") {
    const roots = await collectFigureRoots(scope, currentTargetId);
    for (let i = 0; i < roots.length; i++) {
      map.set(roots[i].node.id, i + 1);
    }
  } else if (targetKind === "theorem") {
    const roots = await collectTheoremRoots(scope, currentTargetId);
    const typeCounters: Record<string, number> = {};
    for (let i = 0; i < roots.length; i++) {
      const thmType = getPluginData(roots[i].node, "theoremType") || "theorem";
      if (!typeCounters[thmType]) typeCounters[thmType] = 0;
      typeCounters[thmType]++;
      map.set(roots[i].node.id, typeCounters[thmType]);
    }
  } else if (targetKind === "table") {
    const roots = await collectTableRoots(scope, currentTargetId);
    for (let i = 0; i < roots.length; i++) {
      map.set(roots[i].node.id, i + 1);
    }
  }

  return map;
}

// ── Handler: update-all-crossrefs ────────────────────────────────────────────

export async function handleUpdateAllCrossrefs(message: any): Promise<void> {
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length
    ? getTargetById(getContainerIdForNode(selection[0]))
    : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const scope = message && message.scope === "current" ? "current" : "all";

  const crossrefs = await collectCrossrefs(scope, currentTargetId);

  // Pre-build numbering maps for each referenced kind
  const numberingMaps: Record<string, Map<string, number>> = {};

  // Gather which kinds are referenced
  const referencedKinds = new Set<string>();
  for (let i = 0; i < crossrefs.length; i++) {
    const kind = getPluginData(crossrefs[i].node, "crossrefTargetKind");
    if (kind) referencedKinds.add(kind);
  }

  // Build maps
  for (const kind of referencedKinds) {
    numberingMaps[kind] = await buildNumberingMap(kind, scope, currentTargetId);
  }

  let updated = 0;

  for (let i = 0; i < crossrefs.length; i++) {
    const node = crossrefs[i].node;
    const targetKind = getPluginData(node, "crossrefTargetKind");
    const targetId = getPluginData(node, "crossrefTargetId");
    const format = getPluginData(node, "crossrefFormat") || "({n})";
    const map = numberingMaps[targetKind];

    let newIndex: number | null = null;

    if (targetId && map && map.has(targetId)) {
      // Resolve by targetId
      newIndex = map.get(targetId)!;
    } else if (targetId && map) {
      // targetId set but not found — item may have been deleted; keep old index
      newIndex = Number(getPluginData(node, "crossrefIndex")) || 1;
    } else {
      // No targetId (positional/manual) — keep existing index
      newIndex = Number(getPluginData(node, "crossrefIndex")) || 1;
    }

    const displayText = formatCrossref(format, newIndex);
    node.setPluginData("crossrefIndex", String(newIndex));

    // Update text content
    if (isTextNode(node)) {
      await loadAllFonts(node);
      node.characters = displayText;
      updated++;
    }
  }

  figma.ui.postMessage({
    type: "crossrefs-updated",
    count: updated,
    scope,
  });
}
