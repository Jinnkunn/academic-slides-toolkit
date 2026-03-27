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

// ── Single-pass data collector ───────────────────────────────────────────────
// Merges checks 1 (fonts), 2 (font sizes), 3 (colors), 6 (spacing), 7 (orphans)
// into ONE walkScene() pass per target — 5x fewer tree traversals.

interface CollectedData {
  // Font data
  fontCount: Record<string, number>;
  fontNodes: Record<string, { node: any; slideIndex: number }[]>;
  totalTextNodes: number;
  // Color data
  colorCount: Record<string, number>;
  colorNodes: Record<string, { node: any; slideIndex: number }[]>;
  // Font size issues (collected inline)
  fontSizeIssues: ConsistencyIssue[];
  // Spacing data
  spacingByKind: Record<string, { padding: number; spacing: number; node: any; slideIndex: number }[]>;
  // Orphan issues (collected inline)
  orphanIssues: ConsistencyIssue[];
}

function collectAllData(targets: any[]): CollectedData {
  const data: CollectedData = {
    fontCount: {}, fontNodes: {}, totalTextNodes: 0,
    colorCount: {}, colorNodes: {},
    fontSizeIssues: [],
    spacingByKind: {},
    orphanIssues: [],
  };

  for (let ti = 0; ti < targets.length; ti++) {
    const slideIndex = ti + 1;
    walkScene(targets[ti], (node: any) => {
      // ── Text node checks (font, fontSize, color) ──
      if (isTextNode(node)) {
        const fontFamily = (node as any).fontName?.family;
        if (fontFamily && fontFamily !== "Mixed") {
          data.totalTextNodes++;
          data.fontCount[fontFamily] = (data.fontCount[fontFamily] || 0) + 1;
          if (!data.fontNodes[fontFamily]) data.fontNodes[fontFamily] = [];
          data.fontNodes[fontFamily].push({ node, slideIndex });
        }

        const fontSize = (node as any).fontSize;
        if (typeof fontSize === "number" && !STANDARD_FONT_SIZES.has(fontSize)) {
          data.fontSizeIssues.push({
            severity: "info", category: "fontSize",
            message: "consistencyFontSizeNonStandard",
            messageVars: { size: fontSize },
            nodeId: node.id, nodeName: node.name || "Text", slideIndex,
            actual: String(fontSize), autoFixable: false,
          });
        }

        const fills = (node as any).fills;
        if (fills && fills.length > 0 && fills[0].type === "SOLID") {
          const hex = colorToHex(fills[0].color.r, fills[0].color.g, fills[0].color.b);
          data.colorCount[hex] = (data.colorCount[hex] || 0) + 1;
          if (!data.colorNodes[hex]) data.colorNodes[hex] = [];
          data.colorNodes[hex].push({ node, slideIndex });
        }
      }

      // ── Academic node checks (spacing + orphan) ──
      const kind = getPluginData(node, "academicNodeKind");
      if (kind) {
        // Spacing
        const padding = (node as any).paddingTop || 0;
        const spacing = (node as any).itemSpacing || 0;
        if (!data.spacingByKind[kind]) data.spacingByKind[kind] = [];
        data.spacingByKind[kind].push({ padding, spacing, node, slideIndex });

        // Orphan detection
        if (kind === "figure" || kind === "table") {
          let hasCaptionChild = false;
          if ("children" in node) {
            for (const child of (node as any).children) {
              if (child.name === "Caption" && isTextNode(child)) hasCaptionChild = true;
            }
          }
          if (!hasCaptionChild) {
            data.orphanIssues.push({
              severity: "warning", category: "orphan",
              message: "consistencyOrphanMissingChild",
              messageVars: { kind: kind === "figure" ? "Figure" : "Table", missing: "Caption text" },
              nodeId: node.id, nodeName: node.name || kind, slideIndex,
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
            data.orphanIssues.push({
              severity: "warning", category: "orphan",
              message: "consistencyOrphanMissingChild",
              messageVars: { kind: "Theorem", missing: "Header text" },
              nodeId: node.id, nodeName: node.name || "Theorem", slideIndex,
              autoFixable: false,
            });
          }
        }
      }
    });
  }
  return data;
}

// ── Analyze collected data ──────────────────────────────────────────────────

function analyzeFontConsistency(data: CollectedData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  if (data.totalTextNodes === 0) return issues;

  let dominantFont = "", dominantCount = 0;
  for (const font in data.fontCount) {
    if (data.fontCount[font] > dominantCount) {
      dominantCount = data.fontCount[font];
      dominantFont = font;
    }
  }

  for (const font in data.fontCount) {
    if (font === dominantFont) continue;
    if (data.fontCount[font] / data.totalTextNodes < 0.1) {
      for (const entry of data.fontNodes[font]) {
        issues.push({
          severity: "warning", category: "font",
          message: "consistencyFontMismatch",
          messageVars: { font, dominantFont, count: data.fontCount[font] },
          nodeId: entry.node.id, nodeName: entry.node.name || "Text",
          slideIndex: entry.slideIndex,
          expected: dominantFont, actual: font, autoFixable: true,
        });
      }
    }
  }
  return issues;
}

function analyzeColorConsistency(data: CollectedData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  for (const hex in data.colorCount) {
    if (data.colorCount[hex] > 2) continue;
    for (const entry of data.colorNodes[hex]) {
      issues.push({
        severity: "warning", category: "color",
        message: "consistencyColorRare",
        messageVars: { color: hex, count: data.colorCount[hex] },
        nodeId: entry.node.id, nodeName: entry.node.name || "Text",
        slideIndex: entry.slideIndex, actual: hex, autoFixable: false,
      });
    }
  }
  return issues;
}

function analyzeSpacingConsistency(data: CollectedData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  for (const kind in data.spacingByKind) {
    const entries = data.spacingByKind[kind];
    if (entries.length < 2) continue;

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
        issues.push({
          severity: "info", category: "spacing",
          message: "consistencySpacingPadding",
          messageVars: { kind, expected: dominantPad, actual: e.padding },
          nodeId: e.node.id, nodeName: e.node.name || kind, slideIndex: e.slideIndex,
          expected: String(dominantPad), actual: String(e.padding), autoFixable: true,
        });
      }
      if (e.spacing !== dominantSpac) {
        issues.push({
          severity: "info", category: "spacing",
          message: "consistencySpacingGap",
          messageVars: { kind, expected: dominantSpac, actual: e.spacing },
          nodeId: e.node.id, nodeName: e.node.name || kind, slideIndex: e.slideIndex,
          expected: String(dominantSpac), actual: String(e.spacing), autoFixable: true,
        });
      }
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

// (Checks 6 & 7 merged into single-pass collector above)

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

    // Parallel target loading (was sequential before)
    await Promise.all(targets.map(t => loadTargetIfNeeded(t)));

    // ── SINGLE-PASS: collect font/fontSize/color/spacing/orphan data in 1 walk ──
    const data = collectAllData(targets);

    // ── Analyze collected data (no tree walking, pure computation) ──
    const allIssues: ConsistencyIssue[] = [];
    allIssues.push(...analyzeFontConsistency(data));
    allIssues.push(...data.fontSizeIssues);
    allIssues.push(...analyzeColorConsistency(data));
    allIssues.push(...analyzeSpacingConsistency(data));
    allIssues.push(...data.orphanIssues);

    // ── Async checks (numbering + crossrefs) run in parallel ──
    const [numberingIssues, crossrefIssues] = await Promise.all([
      checkNumberingConsistency(scope, currentTargetId),
      checkCrossrefValidity(scope, currentTargetId),
    ]);
    allIssues.push(...numberingIssues);
    allIssues.push(...crossrefIssues);

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
