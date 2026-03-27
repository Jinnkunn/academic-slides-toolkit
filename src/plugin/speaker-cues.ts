// ---------------------------------------------------------------------------
// Speaker Cues & Time Budget — per-slide duration tracking and summary
// ---------------------------------------------------------------------------

import { postError } from "./errors";
import { getPluginData } from "./storage";
import { walkScene, isTextNode, loadTargetIfNeeded } from "./nodes";
import { getAllTargets, ensureAllPagesLoaded } from "./slides";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SpeakerCue {
  pageId: string;
  pageName: string;
  duration: number;     // minutes
  notes: string;
  isEstimated: boolean;
  contentCount: { text: number; equation: number; figure: number; table: number; chart: number; theorem: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function estimateSlideDuration(page: any): number {
  let seconds = 0;
  function walk(node: any): void {
    if (isTextNode(node)) seconds += 15;
    if ("children" in node) {
      for (const child of (node as any).children) walk(child);
    }
    // Check pluginData for academic nodes
    const kind = getPluginData(node, "academicNodeKind");
    if (kind === "equation") seconds += 10;
    if (kind === "figure" || kind === "table" || kind === "chart") seconds += 20;
    if (kind === "theorem") seconds += 25;
  }
  for (const child of page.children) walk(child);
  return Math.max(60, Math.round(seconds / 30) * 30); // min 1 min, round to 30s
}

function countSlideContent(page: any): SpeakerCue["contentCount"] {
  const counts = { text: 0, equation: 0, figure: 0, table: 0, chart: 0, theorem: 0 };
  function walk(node: any): void {
    if (isTextNode(node)) counts.text++;
    const kind = getPluginData(node, "academicNodeKind");
    if (kind === "equation") counts.equation++;
    if (kind === "figure") counts.figure++;
    if (kind === "table") counts.table++;
    if (kind === "chart") counts.chart++;
    if (kind === "theorem") counts.theorem++;
    if ("children" in node) {
      for (const child of (node as any).children) walk(child);
    }
  }
  for (const child of page.children) walk(child);
  return counts;
}

function durationToMinutes(seconds: number): number {
  // Round to nearest 0.5 minute
  return Math.round((seconds / 60) * 2) / 2;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function handleGetSpeakerCues(_message: any): Promise<void> {
  try {
    await ensureAllPagesLoaded();
    const targets = getAllTargets();

    for (let i = 0; i < targets.length; i++) {
      await loadTargetIfNeeded(targets[i]);
    }

    const cues: SpeakerCue[] = [];

    for (let i = 0; i < targets.length; i++) {
      const page = targets[i];
      const storedDuration = page.getPluginData ? page.getPluginData("speakerDuration") : "";
      const storedNotes = page.getPluginData ? page.getPluginData("speakerNotes") : "";
      const contentCount = countSlideContent(page);

      let duration: number;
      let isEstimated: boolean;

      if (storedDuration && storedDuration !== "") {
        duration = parseFloat(storedDuration);
        isEstimated = false;
      } else {
        const estSeconds = estimateSlideDuration(page);
        duration = durationToMinutes(estSeconds);
        isEstimated = true;
      }

      cues.push({
        pageId: page.id,
        pageName: page.name || `Slide ${i + 1}`,
        duration,
        notes: storedNotes,
        isEstimated,
        contentCount,
      });
    }

    figma.ui.postMessage({
      type: "speaker-cues-loaded",
      cues,
    });
  } catch (error: any) {
    postError(error.message || "Failed to load speaker cues", "errorSpeakerCues");
  }
}

export async function handleSetSpeakerCue(message: any): Promise<void> {
  try {
    const { pageId, duration, notes } = message;
    if (!pageId) {
      postError("No page specified", "errorNoPage");
      return;
    }

    await ensureAllPagesLoaded();
    const targets = getAllTargets();
    let targetPage: any = null;

    for (let i = 0; i < targets.length; i++) {
      if (targets[i].id === pageId) {
        targetPage = targets[i];
        break;
      }
    }

    if (!targetPage) {
      postError("Page not found", "errorPageNotFound");
      return;
    }

    if (duration !== undefined && duration !== null) {
      targetPage.setPluginData("speakerDuration", String(duration));
    }
    if (notes !== undefined && notes !== null) {
      targetPage.setPluginData("speakerNotes", String(notes));
    }

    figma.ui.postMessage({ type: "speaker-cue-saved", pageId });
  } catch (error: any) {
    postError(error.message || "Failed to save speaker cue", "errorSpeakerCueSave");
  }
}

export async function handleClearAllCues(_message: any): Promise<void> {
  try {
    await ensureAllPagesLoaded();
    const targets = getAllTargets();

    for (let i = 0; i < targets.length; i++) {
      const page = targets[i];
      if (page.setPluginData) {
        page.setPluginData("speakerDuration", "");
        page.setPluginData("speakerNotes", "");
      }
    }

    figma.ui.postMessage({ type: "speaker-cues-cleared" });
  } catch (error: any) {
    postError(error.message || "Failed to clear cues", "errorClearCues");
  }
}

export async function handleAutoEstimateAll(_message: any): Promise<void> {
  try {
    await ensureAllPagesLoaded();
    const targets = getAllTargets();

    for (let i = 0; i < targets.length; i++) {
      await loadTargetIfNeeded(targets[i]);
    }

    const results: Array<{ pageId: string; pageName: string; duration: number }> = [];

    for (let i = 0; i < targets.length; i++) {
      const page = targets[i];
      const estSeconds = estimateSlideDuration(page);
      const duration = durationToMinutes(estSeconds);

      if (page.setPluginData) {
        page.setPluginData("speakerDuration", String(duration));
      }

      results.push({
        pageId: page.id,
        pageName: page.name || `Slide ${i + 1}`,
        duration,
      });
    }

    figma.ui.postMessage({
      type: "auto-estimate-complete",
      results,
    });
  } catch (error: any) {
    postError(error.message || "Auto-estimate failed", "errorAutoEstimate");
  }
}

export async function handleInsertTimeBudgetSlide(_message: any): Promise<void> {
  try {
    await ensureAllPagesLoaded();
    const targets = getAllTargets();

    for (let i = 0; i < targets.length; i++) {
      await loadTargetIfNeeded(targets[i]);
    }

    // Gather cue data
    const rows: Array<{ name: string; duration: number; notes: string }> = [];
    let totalDuration = 0;

    for (let i = 0; i < targets.length; i++) {
      const page = targets[i];
      const storedDuration = page.getPluginData ? page.getPluginData("speakerDuration") : "";
      const storedNotes = page.getPluginData ? page.getPluginData("speakerNotes") : "";

      let duration: number;
      if (storedDuration && storedDuration !== "") {
        duration = parseFloat(storedDuration);
      } else {
        const estSeconds = estimateSlideDuration(page);
        duration = durationToMinutes(estSeconds);
      }

      totalDuration += duration;
      rows.push({
        name: page.name || `Slide ${i + 1}`,
        duration,
        notes: storedNotes,
      });
    }

    // Create a new page for the time budget
    const page = figma.createPage();
    page.name = "Time Budget";
    await page.loadAsync();

    // Load fonts
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

    // Outer frame
    const frame = figma.createFrame();
    frame.name = "Time Budget";
    frame.layoutMode = "VERTICAL";
    frame.primaryAxisAlignItems = "MIN";
    frame.counterAxisAlignItems = "MIN";
    frame.itemSpacing = 8;
    frame.paddingTop = 40;
    frame.paddingBottom = 40;
    frame.paddingLeft = 48;
    frame.paddingRight = 48;
    frame.resize(960, 540);
    frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(frame);

    // Title
    const titleNode = figma.createText();
    titleNode.name = "Title";
    titleNode.fontName = { family: "Inter", style: "Bold" };
    titleNode.fontSize = 28;
    titleNode.characters = "Presentation Time Budget";
    titleNode.fills = [{ type: "SOLID", color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 } }];
    titleNode.layoutAlign = "STRETCH";
    titleNode.textAutoResize = "HEIGHT";
    frame.appendChild(titleNode);

    // Total duration summary
    const totalNode = figma.createText();
    totalNode.name = "Total";
    totalNode.fontName = { family: "Inter", style: "Medium" };
    totalNode.fontSize = 16;
    totalNode.characters = `Total: ${totalDuration} min (${rows.length} slides)`;
    totalNode.fills = [{ type: "SOLID", color: { r: 107 / 255, g: 114 / 255, b: 128 / 255 } }];
    totalNode.layoutAlign = "STRETCH";
    totalNode.textAutoResize = "HEIGHT";
    frame.appendChild(totalNode);

    // Spacer
    const spacer = figma.createFrame();
    spacer.name = "Spacer";
    spacer.resize(860, 12);
    spacer.fills = [];
    frame.appendChild(spacer);

    // Table header row
    const headerRow = figma.createFrame();
    headerRow.name = "Header";
    headerRow.layoutMode = "HORIZONTAL";
    headerRow.primaryAxisAlignItems = "MIN";
    headerRow.counterAxisAlignItems = "CENTER";
    headerRow.itemSpacing = 0;
    headerRow.layoutAlign = "STRETCH";
    headerRow.primaryAxisSizingMode = "FIXED";
    headerRow.counterAxisSizingMode = "AUTO";
    headerRow.paddingTop = 8;
    headerRow.paddingBottom = 8;
    headerRow.fills = [{ type: "SOLID", color: { r: 243 / 255, g: 244 / 255, b: 246 / 255 } }];

    const createHeaderCell = (text: string, width: number) => {
      const cell = figma.createText();
      cell.fontName = { family: "Inter", style: "Bold" };
      cell.fontSize = 12;
      cell.characters = text;
      cell.fills = [{ type: "SOLID", color: { r: 55 / 255, g: 65 / 255, b: 81 / 255 } }];
      cell.resize(width, cell.height);
      cell.textAutoResize = "HEIGHT";
      return cell;
    };

    headerRow.appendChild(createHeaderCell("  Slide", 420));
    headerRow.appendChild(createHeaderCell("Duration", 120));
    headerRow.appendChild(createHeaderCell("Notes", 320));
    frame.appendChild(headerRow);

    // Data rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Color-code based on duration
      let rowColor: { r: number; g: number; b: number };
      if (row.duration <= 3) {
        rowColor = { r: 236 / 255, g: 253 / 255, b: 245 / 255 }; // green tint
      } else if (row.duration <= 5) {
        rowColor = { r: 254 / 255, g: 252 / 255, b: 232 / 255 }; // yellow tint
      } else {
        rowColor = { r: 254 / 255, g: 242 / 255, b: 242 / 255 }; // red tint
      }

      const dataRow = figma.createFrame();
      dataRow.name = `Row ${i + 1}`;
      dataRow.layoutMode = "HORIZONTAL";
      dataRow.primaryAxisAlignItems = "MIN";
      dataRow.counterAxisAlignItems = "CENTER";
      dataRow.itemSpacing = 0;
      dataRow.layoutAlign = "STRETCH";
      dataRow.primaryAxisSizingMode = "FIXED";
      dataRow.counterAxisSizingMode = "AUTO";
      dataRow.paddingTop = 6;
      dataRow.paddingBottom = 6;
      dataRow.fills = [{ type: "SOLID", color: rowColor }];

      const createCell = (text: string, width: number) => {
        const cell = figma.createText();
        cell.fontName = { family: "Inter", style: "Regular" };
        cell.fontSize = 11;
        cell.characters = text;
        cell.fills = [{ type: "SOLID", color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 } }];
        cell.resize(width, cell.height);
        cell.textAutoResize = "HEIGHT";
        return cell;
      };

      dataRow.appendChild(createCell(`  ${i + 1}. ${row.name}`, 420));
      dataRow.appendChild(createCell(`${row.duration} min`, 120));
      dataRow.appendChild(createCell(row.notes || "—", 320));
      frame.appendChild(dataRow);
    }

    // Total row
    const totalRow = figma.createFrame();
    totalRow.name = "Total Row";
    totalRow.layoutMode = "HORIZONTAL";
    totalRow.primaryAxisAlignItems = "MIN";
    totalRow.counterAxisAlignItems = "CENTER";
    totalRow.itemSpacing = 0;
    totalRow.layoutAlign = "STRETCH";
    totalRow.primaryAxisSizingMode = "FIXED";
    totalRow.counterAxisSizingMode = "AUTO";
    totalRow.paddingTop = 8;
    totalRow.paddingBottom = 8;
    totalRow.fills = [{ type: "SOLID", color: { r: 229 / 255, g: 231 / 255, b: 235 / 255 } }];

    const totalNameCell = figma.createText();
    totalNameCell.fontName = { family: "Inter", style: "Bold" };
    totalNameCell.fontSize = 12;
    totalNameCell.characters = "  TOTAL";
    totalNameCell.fills = [{ type: "SOLID", color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 } }];
    totalNameCell.resize(420, totalNameCell.height);
    totalNameCell.textAutoResize = "HEIGHT";
    totalRow.appendChild(totalNameCell);

    const totalDurCell = figma.createText();
    totalDurCell.fontName = { family: "Inter", style: "Bold" };
    totalDurCell.fontSize = 12;
    totalDurCell.characters = `${totalDuration} min`;
    totalDurCell.fills = [{ type: "SOLID", color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 } }];
    totalDurCell.resize(120, totalDurCell.height);
    totalDurCell.textAutoResize = "HEIGHT";
    totalRow.appendChild(totalDurCell);

    const totalNotesCell = figma.createText();
    totalNotesCell.fontName = { family: "Inter", style: "Regular" };
    totalNotesCell.fontSize = 11;
    totalNotesCell.characters = `${rows.length} slides`;
    totalNotesCell.fills = [{ type: "SOLID", color: { r: 107 / 255, g: 114 / 255, b: 128 / 255 } }];
    totalNotesCell.resize(320, totalNotesCell.height);
    totalNotesCell.textAutoResize = "HEIGHT";
    totalRow.appendChild(totalNotesCell);

    frame.appendChild(totalRow);

    figma.ui.postMessage({ type: "time-budget-slide-generated" });
  } catch (error: any) {
    postError(error.message || "Failed to generate time budget slide", "errorTimeBudgetSlide");
  }
}
