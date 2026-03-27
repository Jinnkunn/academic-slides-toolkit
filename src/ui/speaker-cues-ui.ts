// ---------------------------------------------------------------------------
// Speaker Cues UI — manage per-slide durations, notes, and time budget
// ---------------------------------------------------------------------------

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;

// ── State ────────────────────────────────────────────────────────────────────

let lastCues: any[] = [];

// ── Color helpers ────────────────────────────────────────────────────────────

function durationColor(minutes: number): string {
  if (minutes <= 3) return "#38a169";   // green
  if (minutes <= 5) return "#d69e2e";   // yellow
  return "#e53e3e";                      // red
}

function durationBadge(minutes: number): string {
  const color = durationColor(minutes);
  return '<span style="color:' + color + ';font-weight:700">' + minutes + ' min</span>';
}

// ── Actions ──────────────────────────────────────────────────────────────────

export function loadSpeakerCues(): void {
  const listEl = document.getElementById("speaker-cues-list");
  if (listEl) listEl.innerHTML = '<div class="status" style="text-align:center">' + t("speakerCuesLoading") + '</div>';
  send("get-speaker-cues");
}

export function saveSpeakerCue(pageId: string): void {
  const durInput = document.getElementById("cue-dur-" + pageId) as HTMLInputElement | null;
  const notesInput = document.getElementById("cue-notes-" + pageId) as HTMLInputElement | null;
  if (!durInput) return;

  const duration = parseFloat(durInput.value) || 1;
  const notes = notesInput ? notesInput.value : "";
  send("set-speaker-cue", { pageId, duration, notes });
}

export function autoEstimateAll(): void {
  send("auto-estimate-all");
}

export function clearAllCues(): void {
  if (!confirm(t("speakerCuesClearConfirm"))) return;
  send("clear-all-cues");
}

export function generateTimeBudgetSlide(): void {
  send("generate-time-budget-slide");
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderCueList(cues: any[]): string {
  if (cues.length === 0) {
    return '<div class="status" style="text-align:center">' + t("speakerCuesEmpty") + '</div>';
  }

  // Total duration
  let totalDuration = 0;
  for (let i = 0; i < cues.length; i++) {
    totalDuration += cues[i].duration || 0;
  }

  let html = '<div class="speaker-cues-total" style="margin-bottom:12px;padding:8px 12px;border-radius:6px;background:#f7fafc">';
  html += '<strong>' + t("speakerCuesTotal") + ':</strong> ' + durationBadge(totalDuration);
  html += ' <span style="color:#718096;font-size:12px">(' + cues.length + ' ' + t("speakerCuesSlides") + ')</span>';
  html += '</div>';

  html += '<div class="cue-list">';
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const color = durationColor(cue.duration);
    const estimatedTag = cue.isEstimated
      ? ' <span style="background:#edf2f7;color:#718096;font-size:10px;padding:1px 6px;border-radius:3px">' + t("speakerCuesEstimated") + '</span>'
      : '';

    html += '<div class="cue-row" style="margin-bottom:8px;padding:8px 12px;border-left:3px solid ' + color + ';background:#fff;border-radius:4px">';

    // Slide name + estimated badge
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
    html += '<strong style="font-size:13px">' + (i + 1) + '. ' + escapeHtml(cue.pageName) + '</strong>';
    html += estimatedTag;
    html += '</div>';

    // Content counts (collapsed)
    const cc = cue.contentCount || {};
    const parts: string[] = [];
    if (cc.text) parts.push(cc.text + ' text');
    if (cc.equation) parts.push(cc.equation + ' eq');
    if (cc.figure) parts.push(cc.figure + ' fig');
    if (cc.table) parts.push(cc.table + ' tbl');
    if (cc.chart) parts.push(cc.chart + ' chart');
    if (cc.theorem) parts.push(cc.theorem + ' thm');
    if (parts.length > 0) {
      html += '<div style="font-size:11px;color:#a0aec0;margin-bottom:6px">' + parts.join(' · ') + '</div>';
    }

    // Duration input
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
    html += '<label style="font-size:12px;color:#4a5568;min-width:55px">' + t("speakerCuesDuration") + '</label>';
    html += '<input id="cue-dur-' + cue.pageId + '" type="number" step="0.5" min="0.5" max="60" value="' + cue.duration + '" ';
    html += 'style="width:60px;padding:3px 6px;border:1px solid #e2e8f0;border-radius:4px;font-size:12px" />';
    html += '<span style="font-size:12px;color:#718096">min</span>';
    html += '</div>';

    // Notes input
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
    html += '<label style="font-size:12px;color:#4a5568;min-width:55px">' + t("speakerCuesNotes") + '</label>';
    html += '<input id="cue-notes-' + cue.pageId + '" type="text" value="' + escapeHtml(cue.notes || '') + '" ';
    html += 'placeholder="' + t("speakerCuesNotesPlaceholder") + '" ';
    html += 'style="flex:1;padding:3px 6px;border:1px solid #e2e8f0;border-radius:4px;font-size:12px" />';
    html += '</div>';

    // Save button
    html += '<div style="text-align:right">';
    html += '<button class="btn-sm" type="button" onclick="saveSpeakerCue(\'' + cue.pageId + '\')" ';
    html += 'style="font-size:11px;padding:2px 10px;border:1px solid #cbd5e0;border-radius:4px;background:#f7fafc;cursor:pointer">';
    html += t("speakerCuesSave") + '</button>';
    html += '</div>';

    html += '</div>';
  }
  html += '</div>';
  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Response handlers ────────────────────────────────────────────────────────

export function onSpeakerCuesLoaded(message: any): void {
  lastCues = message.cues || [];
  const listEl = document.getElementById("speaker-cues-list");
  if (listEl) listEl.innerHTML = renderCueList(lastCues);
}

export function onSpeakerCueSaved(_message: any): void {
  toast("speaker-cues", t("speakerCueSaved"), "success");
  loadSpeakerCues();
}

export function onAutoEstimateComplete(message: any): void {
  const count = message.results ? message.results.length : 0;
  toast("speaker-cues", t("speakerCuesAutoEstimateDone", { count }), "success");
  loadSpeakerCues();
}

export function onCuesCleared(_message: any): void {
  toast("speaker-cues", t("speakerCuesCleared"), "success");
  loadSpeakerCues();
}

export function onTimeBudgetGenerated(_message: any): void {
  toast("speaker-cues", t("speakerCuesTimeBudgetGenerated"), "success");
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initSpeakerCuesUI(): void {
  loadSpeakerCues();
}
