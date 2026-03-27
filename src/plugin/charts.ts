// ---------------------------------------------------------------------------
// Chart Import component — CSV/TSV data to bar/line/horizontal-bar charts
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
export const CHART_KIND = AcademicNodeKind.Chart;

const CHART_PALETTE = [
  "#4A90D9",
  "#E8734A",
  "#50B86C",
  "#F5A623",
  "#9B59B6",
  "#E74C3C",
];

// ── Data types ──────────────────────────────────────────────────────────────

export interface ChartDataset {
  label: string;
  values: number[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// ── CSV / TSV parsing ───────────────────────────────────────────────────────

export function parseCSV(raw: string, delimiter: string = ","): ChartData {
  const lines = raw
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2)
    throw new Error("Need at least header + 1 data row");

  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const labels: string[] = [];
  const datasets: ChartDataset[] = headers
    .slice(1)
    .map((h) => ({ label: h, values: [] }));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    labels.push(cols[0]);
    for (let j = 1; j < cols.length && j - 1 < datasets.length; j++) {
      datasets[j - 1].values.push(parseFloat(cols[j]) || 0);
    }
  }

  return { labels, datasets };
}

// ── Color helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

function paletteColor(index: number): { r: number; g: number; b: number } {
  return hexToRgb(CHART_PALETTE[index % CHART_PALETTE.length]);
}

// ── Plugin data helpers ─────────────────────────────────────────────────────

export function markChartNode(node: any, data: any): void {
  if (!node || typeof node.setPluginData !== "function") return;
  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", CHART_KIND);
  node.setPluginData("chartRoot", "true");
  node.setPluginData("chartType", data.chartType || "bar");
  node.setPluginData("chartData", data.chartData || "{}");
  node.setPluginData("chartTitle", data.chartTitle || "");
}

export function isChartRootNode(node: any): boolean {
  return (
    !!node &&
    typeof node.getPluginData === "function" &&
    getPluginData(node, "managedByAcademicSlides") === "true" &&
    getPluginData(node, "academicNodeKind") === CHART_KIND &&
    getPluginData(node, "chartRoot") === "true"
  );
}

export function findChartRoot(node: any): any {
  let current = node || null;
  while (current) {
    if (isChartRootNode(current)) return current;
    current = current.parent || null;
  }
  return null;
}

export function serializeChartNode(node: any): any {
  if (!node) return null;
  return {
    nodeId: node.id,
    name: node.name,
    chartType: getPluginData(node, "chartType") || "bar",
    chartTitle: getPluginData(node, "chartTitle") || "",
    chartData: getPluginData(node, "chartData") || "{}",
  };
}

// ── Collect all chart roots ─────────────────────────────────────────────────

export async function collectChartRoots(
  scope: string,
  currentTargetId: string,
): Promise<any[]> {
  const results: any[] = [];
  const targets = getAllTargets();

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (scope === "current" && currentTargetId && target.id !== currentTargetId)
      continue;

    await loadTargetIfNeeded(target);
    walkScene(target, (node: any) => {
      if (isChartRootNode(node)) {
        results.push({ targetId: target.id, targetIndex: index, node });
      }
    });
  }

  results.sort((a, b) => {
    if (a.targetIndex !== b.targetIndex) return a.targetIndex - b.targetIndex;
    const ay = Number(getAbsolutePosition(a.node).y) || 0;
    const by = Number(getAbsolutePosition(b.node).y) || 0;
    if (ay !== by) return ay - by;
    return (
      (Number(getAbsolutePosition(a.node).x) || 0) -
      (Number(getAbsolutePosition(b.node).x) || 0)
    );
  });

  return results;
}

// ── Render helpers ──────────────────────────────────────────────────────────

async function loadChartFonts(): Promise<void> {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
}

function createAxisLine(
  x: number,
  y: number,
  length: number,
  vertical: boolean,
): any {
  const line = figma.createLine();
  line.strokes = [{ type: "SOLID", color: { r: 0.7, g: 0.7, b: 0.7 } }];
  line.strokeWeight = 1;
  if (vertical) {
    line.rotation = 90;
    line.x = x;
    line.y = y;
    line.resize(length, 0);
  } else {
    line.x = x;
    line.y = y;
    line.resize(length, 0);
  }
  return line;
}

function createTickLabel(
  text: string,
  x: number,
  y: number,
  fontSize: number = 10,
  align: "LEFT" | "CENTER" | "RIGHT" = "CENTER",
): any {
  const t = figma.createText();
  t.name = "TickLabel";
  t.fontName = { family: "Inter", style: "Regular" };
  t.fontSize = fontSize;
  t.fills = [{ type: "SOLID", color: { r: 0.45, g: 0.45, b: 0.45 } }];
  t.characters = text;
  t.textAlignHorizontal = align;
  t.textAutoResize = "WIDTH_AND_HEIGHT";
  t.x = x;
  t.y = y;
  return t;
}

// ── Build legend ────────────────────────────────────────────────────────────

function createLegend(datasets: ChartDataset[]): any {
  const legend = figma.createFrame();
  legend.name = "Legend";
  legend.layoutMode = "HORIZONTAL";
  legend.itemSpacing = 16;
  legend.paddingTop = 0;
  legend.paddingBottom = 0;
  legend.paddingLeft = 0;
  legend.paddingRight = 0;
  legend.fills = [];
  legend.counterAxisSizingMode = "AUTO";
  legend.primaryAxisSizingMode = "AUTO";

  for (let d = 0; d < datasets.length; d++) {
    const item = figma.createFrame();
    item.name = datasets[d].label;
    item.layoutMode = "HORIZONTAL";
    item.itemSpacing = 4;
    item.paddingTop = 0;
    item.paddingBottom = 0;
    item.paddingLeft = 0;
    item.paddingRight = 0;
    item.fills = [];
    item.counterAxisSizingMode = "AUTO";
    item.primaryAxisSizingMode = "AUTO";
    item.counterAxisAlignItems = "CENTER";

    const swatch = figma.createRectangle();
    swatch.name = "Swatch";
    swatch.resize(8, 8);
    swatch.cornerRadius = 2;
    swatch.fills = [{ type: "SOLID", color: paletteColor(d) }];
    item.appendChild(swatch);

    const label = figma.createText();
    label.name = "Label";
    label.fontName = { family: "Inter", style: "Regular" };
    label.fontSize = 10;
    label.fills = [{ type: "SOLID", color: { r: 0.3, g: 0.3, b: 0.3 } }];
    label.characters = datasets[d].label;
    label.textAutoResize = "WIDTH_AND_HEIGHT";
    item.appendChild(label);

    legend.appendChild(item);
  }

  return legend;
}

// ── Bar chart ───────────────────────────────────────────────────────────────

function renderBarChart(
  chartData: ChartData,
  chartWidth: number,
  chartHeight: number,
): any {
  const margin = { left: 40, bottom: 24 };
  const plotW = chartWidth - margin.left;
  const plotH = chartHeight - margin.bottom;

  const allValues = chartData.datasets.flatMap((ds) => ds.values);
  const maxValue = Math.max(...allValues, 1);

  const area = figma.createFrame();
  area.name = "ChartArea";
  area.resize(chartWidth, chartHeight);
  area.fills = [];
  area.clipsContent = false;

  // Y-axis line
  const yAxis = createAxisLine(margin.left, 0, plotH, true);
  area.appendChild(yAxis);

  // X-axis line
  const xAxis = createAxisLine(margin.left, plotH, plotW, false);
  area.appendChild(xAxis);

  // Y-axis tick labels (0%, 25%, 50%, 75%, 100%)
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((maxValue * i) / 4);
    const yPos = plotH - (plotH * i) / 4;
    const tick = createTickLabel(String(val), 0, yPos - 6, 9, "RIGHT");
    tick.resize(margin.left - 6, tick.height);
    tick.textAlignHorizontal = "RIGHT";
    area.appendChild(tick);
  }

  // Bars
  const numLabels = chartData.labels.length;
  const numDatasets = chartData.datasets.length;
  const groupWidth = plotW / numLabels;
  const barAreaWidth = groupWidth * 0.7;
  const barWidth = barAreaWidth / numDatasets;
  const groupPadding = (groupWidth - barAreaWidth) / 2;

  for (let li = 0; li < numLabels; li++) {
    const groupX = margin.left + li * groupWidth;

    for (let di = 0; di < numDatasets; di++) {
      const value = chartData.datasets[di].values[li] || 0;
      const barHeight = Math.max(1, (value / maxValue) * plotH);

      const bar = figma.createRectangle();
      bar.name = `Bar ${chartData.labels[li]} - ${chartData.datasets[di].label}`;
      bar.resize(Math.max(1, barWidth - 2), barHeight);
      bar.x = groupX + groupPadding + di * barWidth + 1;
      bar.y = plotH - barHeight;
      bar.cornerRadius = 2;
      bar.fills = [{ type: "SOLID", color: paletteColor(di) }];
      area.appendChild(bar);
    }

    // X-axis label
    const xLabel = createTickLabel(
      chartData.labels[li],
      groupX,
      plotH + 4,
      9,
      "CENTER",
    );
    xLabel.resize(groupWidth, xLabel.height);
    xLabel.textAlignHorizontal = "CENTER";
    area.appendChild(xLabel);
  }

  return area;
}

// ── Horizontal bar chart ────────────────────────────────────────────────────

function renderHorizontalBarChart(
  chartData: ChartData,
  chartWidth: number,
  chartHeight: number,
): any {
  const margin = { left: 60, bottom: 24 };
  const plotW = chartWidth - margin.left;
  const plotH = chartHeight - margin.bottom;

  const allValues = chartData.datasets.flatMap((ds) => ds.values);
  const maxValue = Math.max(...allValues, 1);

  const area = figma.createFrame();
  area.name = "ChartArea";
  area.resize(chartWidth, chartHeight);
  area.fills = [];
  area.clipsContent = false;

  // Y-axis line
  const yAxis = createAxisLine(margin.left, 0, plotH, true);
  area.appendChild(yAxis);

  // X-axis line
  const xAxis = createAxisLine(margin.left, plotH, plotW, false);
  area.appendChild(xAxis);

  // X-axis tick labels
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((maxValue * i) / 4);
    const xPos = margin.left + (plotW * i) / 4;
    const tick = createTickLabel(String(val), xPos - 12, plotH + 4, 9, "CENTER");
    area.appendChild(tick);
  }

  // Bars
  const numLabels = chartData.labels.length;
  const numDatasets = chartData.datasets.length;
  const groupHeight = plotH / numLabels;
  const barAreaHeight = groupHeight * 0.7;
  const barHeight = barAreaHeight / numDatasets;
  const groupPadding = (groupHeight - barAreaHeight) / 2;

  for (let li = 0; li < numLabels; li++) {
    const groupY = li * groupHeight;

    for (let di = 0; di < numDatasets; di++) {
      const value = chartData.datasets[di].values[li] || 0;
      const barW = Math.max(1, (value / maxValue) * plotW);

      const bar = figma.createRectangle();
      bar.name = `Bar ${chartData.labels[li]} - ${chartData.datasets[di].label}`;
      bar.resize(barW, Math.max(1, barHeight - 2));
      bar.x = margin.left;
      bar.y = groupY + groupPadding + di * barHeight + 1;
      bar.cornerRadius = 2;
      bar.fills = [{ type: "SOLID", color: paletteColor(di) }];
      area.appendChild(bar);
    }

    // Y-axis label
    const yLabel = createTickLabel(
      chartData.labels[li],
      0,
      groupY + groupHeight / 2 - 6,
      9,
      "RIGHT",
    );
    yLabel.resize(margin.left - 6, yLabel.height);
    yLabel.textAlignHorizontal = "RIGHT";
    area.appendChild(yLabel);
  }

  return area;
}

// ── Line chart ──────────────────────────────────────────────────────────────

function renderLineChart(
  chartData: ChartData,
  chartWidth: number,
  chartHeight: number,
): any {
  const margin = { left: 40, bottom: 24 };
  const plotW = chartWidth - margin.left;
  const plotH = chartHeight - margin.bottom;

  const allValues = chartData.datasets.flatMap((ds) => ds.values);
  const maxValue = Math.max(...allValues, 1);

  const area = figma.createFrame();
  area.name = "ChartArea";
  area.resize(chartWidth, chartHeight);
  area.fills = [];
  area.clipsContent = false;

  // Y-axis line
  const yAxis = createAxisLine(margin.left, 0, plotH, true);
  area.appendChild(yAxis);

  // X-axis line
  const xAxis = createAxisLine(margin.left, plotH, plotW, false);
  area.appendChild(xAxis);

  // Y-axis tick labels
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((maxValue * i) / 4);
    const yPos = plotH - (plotH * i) / 4;
    const tick = createTickLabel(String(val), 0, yPos - 6, 9, "RIGHT");
    tick.resize(margin.left - 6, tick.height);
    tick.textAlignHorizontal = "RIGHT";
    area.appendChild(tick);
  }

  const numLabels = chartData.labels.length;
  const stepX = numLabels > 1 ? plotW / (numLabels - 1) : plotW;

  // X-axis labels
  for (let li = 0; li < numLabels; li++) {
    const xPos = margin.left + li * stepX;
    const xLabel = createTickLabel(
      chartData.labels[li],
      xPos - 15,
      plotH + 4,
      9,
      "CENTER",
    );
    area.appendChild(xLabel);
  }

  // Lines and data points
  for (let di = 0; di < chartData.datasets.length; di++) {
    const ds = chartData.datasets[di];
    const color = paletteColor(di);

    for (let li = 0; li < ds.values.length; li++) {
      const value = ds.values[li] || 0;
      const cx = margin.left + li * stepX;
      const cy = plotH - (value / maxValue) * plotH;

      // Line segment to next point
      if (li < ds.values.length - 1) {
        const nextValue = ds.values[li + 1] || 0;
        const nx = margin.left + (li + 1) * stepX;
        const ny = plotH - (nextValue / maxValue) * plotH;

        const dx = nx - cx;
        const dy = ny - cy;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        const seg = figma.createLine();
        seg.name = `Line ${ds.label} ${li}-${li + 1}`;
        seg.resize(length, 0);
        seg.x = cx;
        seg.y = cy;
        seg.rotation = -angle;
        seg.strokes = [{ type: "SOLID", color }];
        seg.strokeWeight = 2;
        area.appendChild(seg);
      }

      // Data point dot
      const dot = figma.createEllipse();
      dot.name = `Point ${ds.label} ${chartData.labels[li]}`;
      dot.resize(6, 6);
      dot.x = cx - 3;
      dot.y = cy - 3;
      dot.fills = [{ type: "SOLID", color }];
      area.appendChild(dot);
    }
  }

  return area;
}

// ── Build complete chart frame ──────────────────────────────────────────────

async function createChartFrame(data: {
  chartType: "bar" | "line" | "horizontal-bar";
  chartData: ChartData;
  title: string;
  width: number;
  height: number;
}): Promise<any> {
  await loadChartFonts();

  // Outer container — auto-layout vertical
  const frame = figma.createFrame();
  frame.name = "Chart";
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisAlignItems = "CENTER";
  frame.counterAxisAlignItems = "CENTER";
  frame.itemSpacing = 16;
  frame.paddingTop = 24;
  frame.paddingBottom = 24;
  frame.paddingLeft = 24;
  frame.paddingRight = 24;
  frame.cornerRadius = 8;
  frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.82, g: 0.84, b: 0.86 } }];
  frame.strokeWeight = 1;
  frame.resize(data.width + 48, data.height + 120);

  // Title
  const title = figma.createText();
  title.name = "ChartTitle";
  title.fontName = { family: "Inter", style: "Semi Bold" };
  title.fontSize = 16;
  title.fills = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];
  title.characters = data.title || "Chart";
  title.textAlignHorizontal = "CENTER";
  title.layoutAlign = "STRETCH";
  title.textAutoResize = "HEIGHT";
  frame.appendChild(title);

  // Chart area
  let chartArea: any;
  if (data.chartType === "line") {
    chartArea = renderLineChart(data.chartData, data.width, data.height);
  } else if (data.chartType === "horizontal-bar") {
    chartArea = renderHorizontalBarChart(data.chartData, data.width, data.height);
  } else {
    chartArea = renderBarChart(data.chartData, data.width, data.height);
  }
  frame.appendChild(chartArea);

  // Legend
  if (data.chartData.datasets.length > 0) {
    const legend = createLegend(data.chartData.datasets);
    frame.appendChild(legend);
  }

  return frame;
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function handleInsertChart(message: any): Promise<void> {
  const chartType = (message.chartType || "bar") as "bar" | "line" | "horizontal-bar";
  const rawData = String(message.rawData || "").trim();
  const delimiter = message.delimiter === "\t" || message.delimiter === "tab" ? "\t" : ",";
  const title = String(message.title || "").trim() || "Chart";
  const width = Math.max(200, Number(message.width) || 500);
  const height = Math.max(100, Number(message.height) || 300);

  if (!rawData) {
    postError("No chart data provided", "errorNoChartData");
    return;
  }

  let chartData: ChartData;
  try {
    chartData = parseCSV(rawData, delimiter);
  } catch (err: any) {
    postError(err.message || "Failed to parse data", "errorChartParse");
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

  const chartFrame = await createChartFrame({
    chartType,
    chartData,
    title,
    width,
    height,
  });

  markChartNode(chartFrame, {
    chartType,
    chartData: JSON.stringify(chartData),
    chartTitle: title,
  });

  target.appendChild(chartFrame);

  const center = figma.viewport.center;
  const targetAbsolute = getAbsolutePosition(target);
  chartFrame.x = Math.round(center.x - targetAbsolute.x - chartFrame.width / 2);
  chartFrame.y = Math.round(center.y - targetAbsolute.y - chartFrame.height / 2);

  figma.currentPage.selection = [chartFrame];
  figma.viewport.scrollAndZoomIntoView([chartFrame]);

  figma.ui.postMessage({
    type: "chart-inserted",
    chart: serializeChartNode(chartFrame),
  });
}

export async function handleDeleteChart(message: any): Promise<void> {
  const node =
    message && message.nodeId
      ? await figma.getNodeByIdAsync(message.nodeId)
      : null;
  const chartRoot = findChartRoot(node);

  if (!chartRoot) {
    postError("未找到可删除的 Chart", "errorNoChartToDelete");
    return;
  }

  chartRoot.remove();
  figma.currentPage.selection = [];
  figma.ui.postMessage({ type: "chart-deleted" });
}
