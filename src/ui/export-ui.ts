// ---------------------------------------------------------------------------
// Export UI — trigger export and download resulting files
// ---------------------------------------------------------------------------

import { send, toast } from "./utils";
import { t } from "./i18n";

// ── Actions ──────────────────────────────────────────────────────────────

export function exportBeamer(): void {
  toast("export", t("exportRunning"), "info");
  send("export-beamer", { scope: "all" });
}

// ── Response handlers ────────────────────────────────────────────────────

export function onExportComplete(message: any): void {
  const { tex, bib, slideCount } = message;

  // Download .tex file
  downloadTextFile(tex, "slides.tex");

  // Download .bib file if there are references
  if (bib && bib.trim()) {
    setTimeout(() => downloadTextFile(bib, "references.bib"), 200);
  }

  toast("export", t("exportComplete", { count: slideCount }), "success");
}

// ── Download helper ──────────────────────────────────────────────────────

function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
