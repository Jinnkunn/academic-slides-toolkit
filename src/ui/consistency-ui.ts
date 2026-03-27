// ---------------------------------------------------------------------------
// Consistency Check UI — run checks, display results, trigger fixes
// ---------------------------------------------------------------------------

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;

// ── State ────────────────────────────────────────────────────────────────────

let lastIssues: any[] = [];

// ── Severity helpers ─────────────────────────────────────────────────────────

function severityIcon(severity: string): string {
  if (severity === "error") return '<span style="color:#e53e3e;font-weight:700">✕</span>';
  if (severity === "warning") return '<span style="color:#d69e2e;font-weight:700">!</span>';
  return '<span style="color:#718096;font-weight:700">i</span>';
}

function severityClass(severity: string): string {
  if (severity === "error") return "issue-error";
  if (severity === "warning") return "issue-warning";
  return "issue-info";
}

// ── Actions ──────────────────────────────────────────────────────────────────

export function runConsistencyCheck(): void {
  const scopeEl = document.getElementById("consistency-scope") as HTMLSelectElement | null;
  const scope = scopeEl ? scopeEl.value : "all";
  const resultPanel = document.getElementById("consistency-results");
  if (resultPanel) resultPanel.innerHTML = '<div class="status" style="text-align:center">' + t("consistencyRunning") + '</div>';
  const summaryPanel = document.getElementById("consistency-summary");
  if (summaryPanel) summaryPanel.innerHTML = "";
  send("run-consistency-check", { scope });
}

export function autoFixIssue(index: number): void {
  if (index < 0 || index >= lastIssues.length) return;
  send("auto-fix-issue", { issue: lastIssues[index] });
}

export function autoFixAll(): void {
  const fixable = lastIssues.filter((i: any) => i.autoFixable);
  if (fixable.length === 0) return;
  send("auto-fix-all", { issues: fixable });
}

export function highlightIssueNode(nodeId: string): void {
  send("focus-node", { nodeId });
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderIssueList(issues: any[]): string {
  if (issues.length === 0) {
    return '<div class="status" style="text-align:center;color:#38a169">' + t("consistencyAllClear") + '</div>';
  }

  let html = '<div class="issue-list">';
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const desc = t(issue.message, issue.messageVars || {});
    html += '<div class="issue-row ' + severityClass(issue.severity) + '">';
    html += '<div class="issue-icon">' + severityIcon(issue.severity) + '</div>';
    html += '<div class="issue-body">';
    html += '<div class="issue-desc">' + desc + '</div>';
    html += '<div class="issue-meta">Slide ' + issue.slideIndex + ' · ' + issue.nodeName;
    if (issue.expected && issue.actual) {
      html += ' · <span class="issue-expected">' + issue.expected + '</span> → <span class="issue-actual">' + issue.actual + '</span>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div class="issue-actions">';
    html += '<button class="btn-icon" type="button" onclick="highlightIssueNode(\'' + issue.nodeId + '\')" title="' + t("consistencyLocate") + '">⎈</button>';
    if (issue.autoFixable) {
      html += '<button class="btn-icon" type="button" onclick="autoFixIssue(' + i + ')" title="' + t("consistencyFix") + '">✓</button>';
    }
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ── Response handlers ────────────────────────────────────────────────────────

export function onConsistencyResults(message: any): void {
  lastIssues = message.issues || [];
  const summary = message.summary || { errors: 0, warnings: 0, infos: 0 };

  const resultPanel = document.getElementById("consistency-results");
  if (resultPanel) resultPanel.innerHTML = renderIssueList(lastIssues);

  const summaryPanel = document.getElementById("consistency-summary");
  if (summaryPanel) {
    const total = summary.errors + summary.warnings + summary.infos;
    if (total === 0) {
      summaryPanel.innerHTML = '';
    } else {
      let summaryHtml = '<div class="consistency-stats">';
      if (summary.errors > 0) summaryHtml += '<span class="stat-error">' + summary.errors + ' errors</span> ';
      if (summary.warnings > 0) summaryHtml += '<span class="stat-warning">' + summary.warnings + ' warnings</span> ';
      if (summary.infos > 0) summaryHtml += '<span class="stat-info">' + summary.infos + ' info</span>';
      summaryHtml += '</div>';
      summaryPanel.innerHTML = summaryHtml;
    }
  }

  // Show/hide fix-all button
  const fixAllBtn = document.getElementById("consistency-fix-all-btn");
  const fixableCount = lastIssues.filter((i: any) => i.autoFixable).length;
  if (fixAllBtn) {
    (fixAllBtn as HTMLButtonElement).disabled = fixableCount === 0;
    fixAllBtn.textContent = t("consistencyFixAll", { count: fixableCount });
  }
}

export function onIssueFixed(message: any): void {
  toast("consistency", t("consistencyIssueFix"), "success");
  // Remove from list and re-render
  lastIssues = lastIssues.filter((i: any) => i.nodeId !== message.nodeId || i.category !== message.category);
  onConsistencyResults({ issues: lastIssues, summary: computeSummary(lastIssues) });
}

export function onAllFixed(message: any): void {
  toast("consistency", t("consistencyAllFixed", { count: message.fixedCount }), "success");
  // Re-run check to refresh
  runConsistencyCheck();
}

function computeSummary(issues: any[]): { errors: number; warnings: number; infos: number } {
  return {
    errors: issues.filter((i: any) => i.severity === "error").length,
    warnings: issues.filter((i: any) => i.severity === "warning").length,
    infos: issues.filter((i: any) => i.severity === "info").length,
  };
}
