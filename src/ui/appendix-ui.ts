// ---------------------------------------------------------------------------
// Appendix UI — manage appendix structure, backup links, back links
// ---------------------------------------------------------------------------

import { state } from "./state";

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function esc(value: string): string;
declare function openOverlayPage(moduleId: string, pageId: string): void;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let cachedAppendixInfo: any = null;

// ---------------------------------------------------------------------------
// Toast scope
// ---------------------------------------------------------------------------

export function getAppendixToastScope(): string {
  return "toast-appendix";
}

// ---------------------------------------------------------------------------
// Load appendix info from plugin
// ---------------------------------------------------------------------------

export function loadAppendixInfo(): void {
  send("get-appendix-info");
}

// ---------------------------------------------------------------------------
// Render the appendix panel
// ---------------------------------------------------------------------------

function renderAppendixPanel(): void {
  const container = document.getElementById("appendix-panel");
  if (!container) return;

  const info = cachedAppendixInfo;
  if (!info) {
    container.innerHTML = '<div class="status">' + t("appendixLoading") + "</div>";
    return;
  }

  let html = "";

  // Status section
  html += '<div class="appendix-status">';
  if (info.hasDivider) {
    html += '<div class="status status-success">' + t("appendixDividerExists") + "</div>";
  } else {
    html += '<div class="status">' + t("appendixNoDivider") + "</div>";
  }
  html += "</div>";

  // Insert divider button
  html +=
    '<div class="appendix-actions">' +
      '<button id="insert-appendix-divider-btn" class="btn btn-primary"' +
        (info.hasDivider ? " disabled" : "") + ">" +
        t("appendixInsertDivider") +
      "</button>" +
    "</div>";

  // Appendix slides list
  html += '<div class="appendix-section">';
  html += '<h4 class="section-title">' + t("appendixSlides") + "</h4>";
  if (info.appendixSlides && info.appendixSlides.length > 0) {
    html += '<div class="appendix-slide-list">';
    for (let i = 0; i < info.appendixSlides.length; i++) {
      const slide = info.appendixSlides[i];
      html +=
        '<div class="appendix-slide-item">' +
          '<span class="slide-label">A.' + (i + 1) + "</span> " +
          '<span class="slide-name">' + esc(slide.pageName) + "</span>" +
        "</div>";
    }
    html += "</div>";
  } else {
    html += '<div class="status">' + t("appendixNoSlides") + "</div>";
  }
  html += "</div>";

  // Insert backup link section
  html += '<div class="appendix-section">';
  html += '<h4 class="section-title">' + t("appendixInsertBackupLink") + "</h4>";
  html += '<label class="field-label">' + t("appendixTargetPage") + "</label>";
  html += '<select id="appendix-target-page" class="select-field">';
  html += '<option value="">' + t("appendixSelectTarget") + "</option>";
  if (info.appendixSlides) {
    for (let i = 0; i < info.appendixSlides.length; i++) {
      const slide = info.appendixSlides[i];
      html +=
        '<option value="' + esc(slide.pageId) + '">' +
          "A." + (i + 1) + " \u2014 " + esc(slide.pageName) +
        "</option>";
    }
  }
  html += "</select>";
  html +=
    '<button id="insert-backup-link-btn" class="btn btn-primary">' +
      t("appendixInsertBackupLinkBtn") +
    "</button>";
  html += "</div>";

  // Insert back-to-main link section
  html += '<div class="appendix-section">';
  html += '<h4 class="section-title">' + t("appendixInsertBackLink") + "</h4>";
  html += '<label class="field-label">' + t("appendixSourcePage") + "</label>";
  html += '<select id="appendix-source-page" class="select-field">';
  html += '<option value="">' + t("appendixSelectSource") + "</option>";
  if (info.mainSlides) {
    for (let i = 0; i < info.mainSlides.length; i++) {
      const slide = info.mainSlides[i];
      html +=
        '<option value="' + esc(slide.pageId) + '">' +
          (i + 1) + " \u2014 " + esc(slide.pageName) +
        "</option>";
    }
  }
  html += "</select>";
  html +=
    '<button id="insert-back-link-btn" class="btn btn-primary">' +
      t("appendixInsertBackLinkBtn") +
    "</button>";
  html += "</div>";

  // Existing links list
  html += '<div class="appendix-section">';
  html += '<h4 class="section-title">' + t("appendixExistingLinks") + "</h4>";
  if (info.links && info.links.length > 0) {
    html += '<div class="appendix-link-list">';
    for (let i = 0; i < info.links.length; i++) {
      const link = info.links[i];
      const direction = link.isBackLink ? "\u2190" : "\u2192";
      const sourceLabel = findPageLabel(info, link.sourcePageId);
      const targetLabel = findPageLabel(info, link.targetPageId);
      html +=
        '<div class="appendix-link-item">' +
          '<span class="link-source">' + esc(sourceLabel) + "</span>" +
          " " + direction + " " +
          '<span class="link-target">' + esc(targetLabel) + "</span>" +
        "</div>";
    }
    html += "</div>";
  } else {
    html += '<div class="status">' + t("appendixNoLinks") + "</div>";
  }
  html += "</div>";

  // Refresh all links button
  html +=
    '<div class="appendix-actions">' +
      '<button id="refresh-appendix-links-btn" class="btn btn-secondary">' +
        t("appendixRefreshLinks") +
      "</button>" +
    "</div>";

  container.innerHTML = html;

  // Wire up buttons
  const dividerBtn = document.getElementById("insert-appendix-divider-btn");
  if (dividerBtn && !info.hasDivider) {
    dividerBtn.addEventListener("click", insertAppendixDivider);
  }

  const backupLinkBtn = document.getElementById("insert-backup-link-btn");
  if (backupLinkBtn) {
    backupLinkBtn.addEventListener("click", insertBackupLink);
  }

  const backLinkBtn = document.getElementById("insert-back-link-btn");
  if (backLinkBtn) {
    backLinkBtn.addEventListener("click", insertBackToMainLink);
  }

  const refreshBtn = document.getElementById("refresh-appendix-links-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", updateAllAppendixLinks);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findPageLabel(info: any, pageId: string): string {
  if (!info) return pageId;

  // Check main slides
  if (info.mainSlides) {
    for (let i = 0; i < info.mainSlides.length; i++) {
      if (info.mainSlides[i].pageId === pageId) {
        return (i + 1) + " \u2014 " + info.mainSlides[i].pageName;
      }
    }
  }

  // Check appendix slides
  if (info.appendixSlides) {
    for (let i = 0; i < info.appendixSlides.length; i++) {
      if (info.appendixSlides[i].pageId === pageId) {
        return "A." + (i + 1) + " \u2014 " + info.appendixSlides[i].pageName;
      }
    }
  }

  return pageId;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function insertAppendixDivider(): void {
  send("insert-appendix-divider");
}

export function insertBackupLink(): void {
  const select = document.getElementById("appendix-target-page") as HTMLSelectElement | null;
  const targetPageId = select ? select.value : "";

  if (!targetPageId) {
    toast(getAppendixToastScope(), t("appendixSelectTargetFirst"), "warning");
    return;
  }

  send("insert-backup-link", { targetPageId, linkText: "" });
}

export function insertBackToMainLink(): void {
  const select = document.getElementById("appendix-source-page") as HTMLSelectElement | null;
  const sourcePageId = select ? select.value : "";

  if (!sourcePageId) {
    toast(getAppendixToastScope(), t("appendixSelectSourceFirst"), "warning");
    return;
  }

  send("insert-back-to-main-link", { sourcePageId });
}

export function updateAllAppendixLinks(): void {
  send("update-all-appendix-links");
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

export function onAppendixInfoLoaded(message: any): void {
  cachedAppendixInfo = message || null;
  renderAppendixPanel();
}

export function onAppendixDividerInserted(message: any): void {
  toast(getAppendixToastScope(), t("appendixDividerInserted"), "success");
  loadAppendixInfo();
}

export function onBackupLinkInserted(message: any): void {
  toast(getAppendixToastScope(), t("appendixBackupLinkInserted"), "success");
}

export function onBackLinkInserted(message: any): void {
  toast(getAppendixToastScope(), t("appendixBackLinkInserted"), "success");
}

export function onAppendixLinksUpdated(message: any): void {
  const count = (message && message.count) || 0;
  toast(getAppendixToastScope(), t("appendixLinksUpdated", { count }), "success");
  loadAppendixInfo();
}

export function onAppendixReordered(message: any): void {
  toast(getAppendixToastScope(), t("appendixReordered"), "success");
  loadAppendixInfo();
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initAppendixUI(): void {
  loadAppendixInfo();
}
