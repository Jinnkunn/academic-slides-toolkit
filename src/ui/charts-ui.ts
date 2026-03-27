// ---------------------------------------------------------------------------
// Chart UI functions — insert, delete, selection
// ---------------------------------------------------------------------------

import { state } from "./state";

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function openOverlayPage(moduleId: string, pageId: string): void;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let selectedChart: any = null;

// ---------------------------------------------------------------------------
// Selection handling
// ---------------------------------------------------------------------------

export function onChartSelection(
  chart: any,
  autoNavigate: boolean = false,
): void {
  const hadChart = !!selectedChart;
  const hasChart = !!chart;
  selectedChart = chart || null;

  const status = document.getElementById("chart-selected-status")!;
  const deleteBtn = document.getElementById(
    "chart-delete-btn",
  ) as HTMLButtonElement;

  if (!selectedChart) {
    status.textContent = t("chartSelectedEmpty");
    status.className = "status";
    deleteBtn.disabled = true;
    return;
  }

  status.textContent = selectedChart.name || "Chart";
  status.className = "status active";
  deleteBtn.disabled = false;

  // Populate form with current chart data
  const typeSelect = document.getElementById(
    "chart-type",
  ) as HTMLSelectElement;
  const titleInput = document.getElementById(
    "chart-title",
  ) as HTMLInputElement;
  if (typeSelect && selectedChart.chartType) {
    typeSelect.value = selectedChart.chartType;
  }
  if (titleInput && selectedChart.chartTitle) {
    titleInput.value = selectedChart.chartTitle;
  }

  if (autoNavigate && hasChart && !hadChart) {
    if (
      state.currentModule !== "components" ||
      !state.activeOverlay ||
      state.activeOverlay.pageId !== "chart"
    ) {
      openOverlayPage("components", "chart");
      toast("charts", t("chartAutoOpened"), "info");
    }
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function insertChart(): void {
  const typeSelect = document.getElementById(
    "chart-type",
  ) as HTMLSelectElement;
  const dataArea = document.getElementById(
    "chart-data",
  ) as HTMLTextAreaElement;
  const delimiterSelect = document.getElementById(
    "chart-delimiter",
  ) as HTMLSelectElement;
  const titleInput = document.getElementById(
    "chart-title",
  ) as HTMLInputElement;
  const widthInput = document.getElementById(
    "chart-width",
  ) as HTMLInputElement;
  const heightInput = document.getElementById(
    "chart-height",
  ) as HTMLInputElement;

  const delimiterValue = delimiterSelect.value === "tab" ? "\t" : ",";

  send("insert-chart", {
    chartType: typeSelect.value,
    rawData: dataArea.value.trim(),
    delimiter: delimiterValue,
    title: titleInput.value.trim(),
    width: parseInt(widthInput.value, 10) || 500,
    height: parseInt(heightInput.value, 10) || 300,
  });
}

export function deleteChart(): void {
  if (!selectedChart) return;
  if (!confirm(t("chartDeleteConfirm"))) return;

  send("delete-chart", { nodeId: selectedChart.nodeId });
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

export function onChartInserted(message: any): void {
  if (message && message.chart) {
    onChartSelection(message.chart);
  }
  openOverlayPage("components", "chart");
  toast("charts", t("chartInserted"), "success");
}

export function onChartDeleted(): void {
  onChartSelection(null);
  toast("charts", t("chartDeleted"), "success");
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initChartUI(): void {
  // No special initialization needed
}
