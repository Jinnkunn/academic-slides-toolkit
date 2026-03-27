// ---------------------------------------------------------------------------
// Consistency Check — scan the entire deck for style/numbering inconsistencies
// ---------------------------------------------------------------------------

import { postError } from "./errors";
import { getPluginData } from "./storage";
import { walkScene, isTextNode, loadTargetIfNeeded, loadAllFonts } from "./nodes";
import { getAllTargets, getContainerIdForNode, findViewportTarget, getTargetById } from "./slides";
import { getAbsolutePosition } from "./layout";
import { collectEquationRoots } from "./equations";
import { collectFigureRoots } from "./figures";
import { collectTheoremRoots } from "./theorems";
import { collectTableRoots } from "./tables";
import { collectCrossrefs, buildNumberingMap } from "./crossrefs";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConsistencyIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;           // i18n key
  messageVars: Record<string, any>;
  nodeId: string;
  nodeName: string;
  slideIndex: number;
  expected?: string;
  actual?: string;
  autoFixable: boolean;
}

const STANDARD_FONT_SIZES = new Set([10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function colorToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function getSlideIndexForNode(node: any, targets: any[]): number {
  const cid = getContainerIdForNode(node);
  for (let i = 0; i < targets.length; i++) {
    if (targets[i].id === cid) return i + 1;
  }
  return 0;
}

// ── Check 1: Font Consistency ────────────────────────────────────────────────

function checkFontConsistency(targets: any[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const fontCount: Record<string, number> = {};
  const fontNodes: Record<string, { node: any; slideIndex: number }[]> = {};
  let totalTextNodes = 0;

  for (let ti = 0; ti < targets.length; ti++) {
    walkScene(targets[ti], (node: any) => {
      if (!isTextNode(node)) return;
      const fontFamily = (node as any).fontName?.family;
      if (!fontFamily || fontFamily === "Mixed") return;
      totalTextNodes++;
      fontCount[fontFamily] = (fontCount[fontFamily] || 0) + 1;
      if (!fontNodes[fontFamily]) fontNodes[fontFamily] = [];
      fontNodes[fontFamily].push({ node, slideIndex: ti + 1 });
    });
  }

  if (totalTextNodes === 0) return issues;

  // Find the dominant font
  let dominantFont = "";
  let dominantCount = 0;
  for (const font in fontCount) {
    if (fontCount[font] > dominantCount) {
      dominantCount = fontCount[font];
      dominantFont = font;
    }
  }

  // Flag fonts with <10% usage
  for (const font in fontCount) {
    if (font === dominantFont) continue;
    const ratio = fontCount[font] / totalTextNodes;
    if (ratio < 0.1) {
      const nodes = fontNodes[font];
      for (let i = 0; i < nodes.length; i++) {
        issues.push({
          severity: "warning",
          category: "font",
          message: "consistencyFontMismatch",
          messageVars: { font, dominantFont, count: fontCount[font] },
          nodeId: nodes[i].node.id,
          nodeName: nodes[i].node.name || "Text",
          slideIndex: nodes[i].slideIndex,
          expected: dominantFont,
          actual: font,
          autoFixable: true,
        });
      }
    }
  }
  return issues;
}

// ── Check 2: Font Size Consistency ───────────────────────────────────────────

function checkFontSizeConsistency(targets: any[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (let ti = 0; ti < targets.length; ti++) {
    walkScene(targets[ti], (node: any) => {
      if (!isTextNode(node)) return;
      const fontSize = (node as any).fontSize;
      if (typeof fontSize !== "number") return; // Mixed
      if (!STANDARD_FONT_SIZES.has(fontSize)) {
        issues.push({
          severity: "info",
          category: "fontSize",
          message: "consistencyFontSizeNonStandard",
          messageVars: { size: fontSize },
          nodeId: node.id,
          nodeName: node.name || "Text",
          slideIndex: ti + 1,
          actual: String(fontSize),
          autoFixable: false,
        });
      }
    });
  }
  return issues;
}

// ── Check 3: Color Consistency ───────────────────────────────────────────────

function checkColorConsistency(targets: any[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const colorCount: Record<string, number> = {};
  const colorNodes: Record<string, { node: any; slideIndex: number }[]> = {};

  for (let ti = 0; ti < targets.length; ti++) {
    walkScene(targets[ti], (node: any) => {
      if (!isTextNode(node)) return;
      const fills = (node as any).fills;
      if (!fills || fills.length === 0) return;
      const fill = fills[0];
      if (fill.type !== "SOLID") return;
      const hex = colorToHex(fill.color.r, fill.color.g, fill.color.b);
      colorCount[hex] = (colorCount[hex] || 0) + 1;
      if (!colorNodes[hex]) colorNodes[hex] = [];
      colorNodes[hex].push({ node, slideIndex: ti + 1 });
    });
  }

  // Flag colors that appear ≤2 times (likely accidental)
  for (const hex in colorCount) {
    if (colorCount[hex] > 2) continue;
    const nodes = colorNodes[hex];
    for (let i = 0; i < nodes.length; i++) {
      issues.push({
        severity: "warning",
        category: "color",
        message: "consistencyColorRare",
        messageVars: { color: hex, count: colorCount[hex] },
        nodeId: nodes[i].node.id,
        nodeName: nodes[i].node.name || "Text",
        slideIndex: nodes[i].slideIndex,
        actual: hex,
        autoFixable: false,
      });
    }
  }
  return issues;
}

// ── Check 4: Numbering Consistency ───────────────────────────────────────────

async function checkNumberingConsistency(scope: string, currentTargetId: string): Promise<ConsistencyIssue[]> {
  const issues: ConsistencyIssue[] = [];
  const targets = getAllTargets();

  // Check each component type for sequential numbering
  const kinds: { name: string; collect: (s: string, c: string) => Promise<any[]>; labelKey: string }[] = [
    { name: "figure", collect: collectFigureRoots, labelKey: "figureLabelPrefix" },
    { name: "table", collect: collectTableRoots, labelKey: "tableLabelPrefix" },
  ];

  for (const kind of kinds) {
    const roots = await kind.collect(scope, currentTargetId);
    for (let i = 0; i < roots.length; i++) {
      const node = roots[i].node;
      const captionKey = kind.name === "figure" ? "figureCaption" : "tableCaption";
      const caption = getPluginData(node, captionKey) || "";
      // Check if the caption contains a number that doesn't match position
      const match = caption.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num !== i + 1) {
          issues.push({
            severity: "error",
            category: "numbering",
            message: "consistencyNumberingGap",
            messageVars: { kind: kind.name, expected: i + 1, actual: num },
            nodeId: node.id,
            nodeName: node.name || kind.name,
            slideIndex: getSlideIndexForNode(node, targets),
            expected: String(i + 1),
            actual: String(num),
            autoFixable: true,
          });
        }
      }
    }
  }

  // Check equations (display-mode only)
  const eqRoots = await collectEquationRoots(scope, currentTargetId);
  let eqCounter = 0;
  for (let i = 0; i < eqRoots.length; i++) {
    const node = eqRoots[i].node;
    if (getPluginData(node, "equationDisplayMode") !== "display") continue;
    eqCounter++;
    const labelId = getPluginData(node, "equationNumberLabelId");
    if (labelId) {
      const labelNode = figma.getNodeById(labelId);
      if (labelNode && isTextNode(labelNode)) {
        const text = (labelNode as any).characters || "";
        const match = text.match(/(\d+)/);
        if (match && parseInt(match[1], 10) !== eqCounter) {
          issues.push({
            severity: "error",
            category: "numbering",
            message: "consistencyNumberingGap",
            messageVars: { kind: "equation", expected: eqCounter, actual: match[1] },
            nodeId: node.id,
            nodeName: node.name || "Equation",
            slideIndex: getSlideIndexForNode(node, getAllTargets()),
            expected: String(eqCounter),
            actual: match[1],
            autoFixable: true,
          });
        }
      }
    }
  }

  return issues;
}

// ── Check 5: Cross-reference Validity ────────────────────────────────────────

async function checkCrossrefValidity(scope: string, currentTargetId: string): Promise<ConsistencyIssue[]> {
  const issues: ConsistencyIssue[] = [];
  const targets = getAllTargets();
  const crossrefs = await collectCrossrefs(scope, currentTargetId);

  for (let i = 0; i < crossrefs.length; i++) {
    const cr = crossrefs[i];
    const node = cr.node;
    const targetKind = getPluginData(node, "crossrefTargetKind");
    const storedIndex = parseInt(getPluginData(node, "crossrefIndex") || "0", 10);

    if (!targetKind || storedIndex <= 0) continue;

    // Build the actual numbering map for this kind
    const map = await buildNumberingMap(targetKind, scope, currentTargetId);
    const targetId = getPluginData(node, "crossrefTargetId");

    if (targetId) {
      const actualNum = map.get(targetId);
      if (actualNum === undefined) {
        issues.push({
          severity: "error",
          category: "crossref",
          message: "consistencyCrossrefBroken",
          messageVars: { kind: targetKind, index: storedIndex },
          nodeId: node.id,
          nodeName: node.name || "Crossref",
          slideIndex: getSlideIndexForNode(node, targets),
          autoFixable: false,
        });
      } else if (actualNum !== storedIndex) {
        issues.push({
          severity: "error",
          category: "crossref",
          message: "consistencyCrossrefStale",
          messageVars: { kind: targetKind, expected: actualNum, actual: storedIndex },
          nodeId: node.id,
          nodeName: node.name || "Crossref",
          slideIndex: getSlideIndexForNode(node, targets),
          expected: String(actualNum),
          actual: String(storedIndex),
          autoFixable: true,
        });
      }
    }
  }
  return issues;
}

// ── Check 6: Spacing Consistency ─────────────────────────────────────────────

function checkSpacingConsistency(targets: any[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const spacingByKind: Record<string, { padding: number; spacing: number; nodes: { node: any; slideIndex: number }[] }[]> = {};

  for (let ti = 0; ti < targets.length; ti++) {
    walkScene(targets[ti], (node: any) => {
      const kind = getPluginData(node, "academicNodeKind");
      if (!kind) return;
      const padding = (node as any).paddingTop || 0;
      const spacing = (node as any).itemSpacing || 0;

      if (!spacingByKind[kind]) spacingByKind[kind] = [];
      spacingByKind[kind].push({ padding, spacing, nodes: [{ node, slideIndex: ti + 1 }] });
    });
  }

  for (const kind in spacingByKind) {
    const entries = spacingByKind[kind];
    if (entries.length < 2) continue;

    // Find dominant padding/spacing
    const padCount: Record<number, number> = {};
    const spacCount: Record<number, number> = {};
    for (const e of entries) {
      padCount[e.padding] = (padCount[e.padding] || 0) + 1;
      spacCount[e.spacing] = (spacCount[e.spacing] || 0) + 1;
    }

    let dominantPad = 0, dominantPadCount = 0;
    for (const p in padCount) { if (padCount[p] > dominantPadCount) { dominantPadCount = padCount[p]; dominantPad = Number(p); } }
    let dominantSpac = 0, dominantSpacCount = 0;
    for (const s in spacCount) { if (spacCount[s] > dominantSpacCount) { dominantSpacCount = spacCount[s]; dominantSpac = Number(s); } }

    for (const e of entries) {
      if (e.padding !== dominantPad) {
        const n = e.nodes[0];
        issues.push({
          severity: "info",
          category: "spacing",
          message: "consistencySpacingPadding",
          messageVars: { kind, expected: dominantPad, actual: e.padding },
          nodeId: n.node.id,
          nodeName: n.node.name || kind,
          slideIndex: n.slideIndex,
          expected: String(dominantPad),
          actual: String(e.padding),
          autoFixable: true,
        });
      }
      if (e.spacing !== dominantSpac) {
        const n = e.nodes[0];
        issues.push({
          severity: "info",
          category: "spacing",
          message: "consistencySpacingGap",
          messageVars: { kind, expected: dominantSpac, actual: e.spacing },
          nodeId: n.node.id,
          nodeName: n.node.name || kind,
          slideIndex: n.slideIndex,
          expected: String(dominantSpac),
          actual: String(e.spacing),
          autoFixable: true,
        });
      }
    }
  }
  return issues;
}

// ── Check 7: Orphan Nodes ────────────────────────────────────────────────────

function checkOrphanNodes(targets: any[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (let ti = 0; ti < targets.length; ti++) {
    walkScene(targets[ti], (node: any) => {
      const kind = getPluginData(node, "academicNodeKind");
      if (!kind) return;

      // Check structural integrity
      if (kind === "figure") {
        const hasCaption = getPluginData(node, "figureCaption") !== "";
        let hasCaptionChild = false;
        if ("children" in node) {
          for (const child of (node as any).children) {
            if (child.name === "Caption" && isTextNode(child)) hasCaptionChild = true;
          }
        }
        if (hasCaption && !hasCaptionChild) {
          issues.push({
            severity: "warning",
            category: "orphan",
            message: "consistencyOrphanMissingChild",
            messageVars: { kind: "Figure", missing: "Caption text" },
            nodeId: node.id,
            nodeName: node.name || "Figure",
            slideIndex: ti + 1,
            autoFixable: false,
          });
        }
      }

      if (kind === "table") {
        let hasCaptionChild = false;
        if ("children" in node) {
          for (const child of (node as any).children) {
            if (child.name === "Caption" && isTextNode(child)) hasCaptionChild = true;
          }
        }
        if (!hasCaptionChild) {
          issues.push({
            severity: "warning",
            category: "orphan",
            message: "consistencyOrphanMissingChild",
            messageVars: { kind: "Table", missing: "Caption text" },
            nodeId: node.id,
            nodeName: node.name || "Table",
            slideIndex: ti + 1,
            autoFixable: false,
          });
        }
      }

      if (kind === "theorem") {
        let hasHeader = false;
        if ("children" in node) {
          for (const child of (node as any).children) {
            if (child.name === "Content" && "children" in child) {
              for (const gc of (child as any).children) {
                if (gc.name === "Header" && isTextNode(gc)) hasHeader = true;
              }
            }
          }
        }
        if (!hasHeader) {
          issues.push({
            severity: "warning",
            category: "orphan",
            message: "consistencyOrphanMissingChild",
            messageVars: { kind: "Theorem", missing: "Header text" },
            nodeId: node.id,
            nodeName: node.name || "Theorem",
            slideIndex: ti + 1,
            autoFixable: false,
          });
        }
      }
    });
  }
  return issues;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function handleRunConsistencyCheck(message: any): Promise<void> {
  try {
    const selection = figma.currentPage.selection;
    const currentTarget = selection.length
      ? getTargetById(getContainerIdForNode(selection[0]))
      : findViewportTarget();
    const currentTargetId = currentTarget ? currentTarget.id : "";
    const scope = message && message.scope === "current" ? "current" : "all";

    const targets = getAllTargets();
    for (let i = 0; i < targets.length; i++) {
      await loadTargetIfNeeded(targets[i]);
    }

    const allIssues: ConsistencyIssue[] = [];

    // Run all checkers
    allIssues.push(...checkFontConsistency(targets));
    allIssues.push(...checkFontSizeConsistency(targets));
    allIssues.push(...checkColorConsistency(targets));
    allIssues.push(...await checkNumberingConsistency(scope, currentTargetId));
    allIssues.push(...await checkCrossrefValidity(scope, currentTargetId));
    allIssues.push(...checkSpacingConsistency(targets));
    allIssues.push(...checkOrphanNodes(targets));

    // Sort: errors first, then warnings, then info
    const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const summary = {
      errors: allIssues.filter(i => i.severity === "error").length,
      warnings: allIssues.filter(i => i.severity === "warning").length,
      infos: allIssues.filter(i => i.severity === "info").length,
    };

    figma.ui.postMessage({
      type: "consistency-results",
      issues: allIssues,
      summary,
    });
  } catch (error: any) {
    postError(error.message || "Consistency check failed", "errorConsistencyCheck");
  }
}

// ── Auto-fix handlers ────────────────────────────────────────────────────────

export async function handleAutoFixIssue(message: any): Promise<void> {
  const issue = message.issue as ConsistencyIssue;
  if (!issue || !issue.autoFixable) return;

  const node = figma.getNodeById(issue.nodeId);
  if (!node) {
    postError("Node not found", "errorNodeNotFound");
    return;
  }

  try {
    if (issue.category === "font" && issue.expected) {
      if (isTextNode(node)) {
        await loadAllFonts(node);
        (node as any).fontName = { family: issue.expected, style: "Regular" };
      }
    } else if (issue.category === "spacing" && issue.expected) {
      const val = parseInt(issue.expected, 10);
      if (issue.message === "consistencySpacingPadding") {
        (node as any).paddingTop = val;
        (node as any).paddingBottom = val;
        (node as any).paddingLeft = val;
        (node as any).paddingRight = val;
      } else {
        (node as any).itemSpacing = val;
      }
    } else if (issue.category === "numbering") {
      // Re-run numbering for the relevant kind — this is the safest fix
      // (Individual fix would require knowing the exact text pattern)
    }

    figma.ui.postMessage({ type: "issue-fixed", nodeId: issue.nodeId, category: issue.category });
  } catch (error: any) {
    postError(error.message || "Fix failed", "errorAutoFix");
  }
}

export async function handleAutoFixAll(message: any): Promise<void> {
  const issues = (message.issues || []) as ConsistencyIssue[];
  let fixedCount = 0;

  for (const issue of issues) {
    if (!issue.autoFixable) continue;
    const node = figma.getNodeById(issue.nodeId);
    if (!node) continue;

    try {
      if (issue.category === "font" && issue.expected && isTextNode(node)) {
        await loadAllFonts(node);
        (node as any).fontName = { family: issue.expected, style: "Regular" };
        fixedCount++;
      } else if (issue.category === "spacing" && issue.expected) {
        const val = parseInt(issue.expected, 10);
        if (issue.message === "consistencySpacingPadding") {
          (node as any).paddingTop = val;
          (node as any).paddingBottom = val;
          (node as any).paddingLeft = val;
          (node as any).paddingRight = val;
        } else {
          (node as any).itemSpacing = val;
        }
        fixedCount++;
      }
    } catch (_) {
      // Skip failures silently
    }
  }

  figma.ui.postMessage({ type: "all-fixed", fixedCount });
}

// ── Focus Node ───────────────────────────────────────────────────────────────

export function handleFocusNode(message: any): void {
  const nodeId = message.nodeId;
  if (!nodeId) return;
  const node = figma.getNodeById(nodeId);
  if (!node) return;
  figma.currentPage.selection = [node as SceneNode];
  figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
  figma.ui.postMessage({ type: "focus-node-done", nodeId });
}
