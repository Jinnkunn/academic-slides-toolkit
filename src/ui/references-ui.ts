// ---------------------------------------------------------------------------
// References UI functions — manage bibliography, insert citations
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

let cachedReferences: any[] = [];

// ---------------------------------------------------------------------------
// Toast scope
// ---------------------------------------------------------------------------

export function getReferencesToastScope(): string {
  return "toast-references";
}

// ---------------------------------------------------------------------------
// Load references from plugin storage
// ---------------------------------------------------------------------------

export function loadReferences(): void {
  send("get-references");
}

// ---------------------------------------------------------------------------
// Render reference list
// ---------------------------------------------------------------------------

function renderReferenceList(): void {
  const container = document.getElementById("references-list");
  if (!container) return;

  if (cachedReferences.length === 0) {
    container.innerHTML = '<div class="status">' + t("referencesEmpty") + "</div>";
    return;
  }

  let html = "";
  for (let i = 0; i < cachedReferences.length; i++) {
    const ref = cachedReferences[i];
    const keyDisplay = ref.key ? "[" + esc(ref.key) + "] " : "";
    const authorsDisplay = ref.authors ? esc(ref.authors) : "";
    const yearDisplay = ref.year ? " (" + esc(ref.year) + ")" : "";
    const titleDisplay = ref.title ? ". " + esc(ref.title) : "";
    const venueDisplay = ref.venue ? ". " + esc(ref.venue) : "";

    html +=
      '<div class="reference-item" data-ref-id="' + esc(ref.id) + '">' +
        '<div class="reference-info">' +
          '<span class="reference-key">' + keyDisplay + "</span>" +
          '<span class="reference-detail">' +
            authorsDisplay + yearDisplay + titleDisplay + venueDisplay +
          "</span>" +
        "</div>" +
        '<div class="reference-actions">' +
          '<button class="btn btn-sm btn-primary ref-cite-btn" data-ref-id="' + esc(ref.id) + '">' +
            t("referenceCite") +
          "</button>" +
          '<button class="btn btn-sm btn-danger ref-delete-btn" data-ref-id="' + esc(ref.id) + '">' +
            t("referenceDelete") +
          "</button>" +
        "</div>" +
      "</div>";
  }

  container.innerHTML = html;

  // Wire up cite buttons
  const citeButtons = container.querySelectorAll(".ref-cite-btn");
  for (let i = 0; i < citeButtons.length; i++) {
    const btn = citeButtons[i] as HTMLElement;
    btn.addEventListener("click", function () {
      const refId = btn.getAttribute("data-ref-id") || "";
      insertCitation(refId);
    });
  }

  // Wire up delete buttons
  const deleteButtons = container.querySelectorAll(".ref-delete-btn");
  for (let i = 0; i < deleteButtons.length; i++) {
    const btn = deleteButtons[i] as HTMLElement;
    btn.addEventListener("click", function () {
      const refId = btn.getAttribute("data-ref-id") || "";
      deleteReference(refId);
    });
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function addReference(): void {
  const authors = (document.getElementById("ref-authors") as HTMLInputElement).value.trim();
  const title = (document.getElementById("ref-title") as HTMLInputElement).value.trim();
  const year = (document.getElementById("ref-year") as HTMLInputElement).value.trim();
  const venue = (document.getElementById("ref-venue") as HTMLInputElement).value.trim();
  const doi = (document.getElementById("ref-doi") as HTMLInputElement).value.trim();
  const refType = (document.getElementById("ref-type") as HTMLSelectElement).value;

  if (!title) {
    toast(getReferencesToastScope(), t("referenceNeedTitle"), "warning");
    return;
  }

  send("add-reference", {
    authors,
    title,
    year,
    venue,
    doi,
    refType,
  });
}

export function importBibtex(): void {
  const textarea = document.getElementById("bibtex-input") as HTMLTextAreaElement;
  const bibtex = textarea ? textarea.value.trim() : "";

  if (!bibtex) {
    toast(getReferencesToastScope(), t("bibtexEmpty"), "warning");
    return;
  }

  send("import-bibtex", { bibtex });
}

export function deleteReference(refId: string): void {
  if (!refId) return;
  if (!confirm(t("referenceDeleteConfirm"))) return;
  send("delete-reference", { refId });
}

export function insertCitation(refId: string): void {
  if (!refId) return;

  const formatSelect = document.getElementById("citation-format") as HTMLSelectElement | null;
  const citationFormat = formatSelect ? formatSelect.value : "numeric";

  send("insert-citation", { refId, citationFormat });
}

export function updateAllCitations(): void {
  send("update-all-citations", {});
}

export function generateBibSlide(): void {
  send("generate-bib-slide", {});
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

export function onReferencesLoaded(message: any): void {
  cachedReferences = (message && message.references) || [];
  renderReferenceList();
}

export function onReferenceAdded(message: any): void {
  toast(getReferencesToastScope(), t("referenceAdded"), "success");
  loadReferences();

  // Clear form fields
  const fields = ["ref-authors", "ref-title", "ref-year", "ref-venue", "ref-doi"];
  for (let i = 0; i < fields.length; i++) {
    const el = document.getElementById(fields[i]) as HTMLInputElement | null;
    if (el) el.value = "";
  }
}

export function onBibtexImported(message: any): void {
  const count = (message && message.count) || 0;
  toast(getReferencesToastScope(), t("bibtexImported", { count }), "success");
  loadReferences();

  // Clear textarea
  const textarea = document.getElementById("bibtex-input") as HTMLTextAreaElement | null;
  if (textarea) textarea.value = "";
}

export function onReferenceDeleted(message: any): void {
  toast(getReferencesToastScope(), t("referenceDeleted"), "success");
  loadReferences();
}

export function onCitationInserted(message: any): void {
  toast(getReferencesToastScope(), t("citationInserted"), "success");
}

export function onCitationsUpdated(message: any): void {
  const count = (message && message.count) || 0;
  toast(getReferencesToastScope(), t("citationsUpdated", { count }), "success");
}

export function onBibSlideGenerated(message: any): void {
  const count = (message && message.count) || 0;
  toast(getReferencesToastScope(), t("bibSlideGenerated", { count }), "success");
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initReferencesUI(): void {
  // Wire up action buttons
  const addBtn = document.getElementById("ref-add-btn");
  if (addBtn) addBtn.addEventListener("click", addReference);

  const importBtn = document.getElementById("bibtex-import-btn");
  if (importBtn) importBtn.addEventListener("click", importBibtex);

  const updateCitationsBtn = document.getElementById("update-citations-btn");
  if (updateCitationsBtn) updateCitationsBtn.addEventListener("click", updateAllCitations);

  const genBibBtn = document.getElementById("generate-bib-slide-btn");
  if (genBibBtn) genBibBtn.addEventListener("click", generateBibSlide);

  // Load initial references
  loadReferences();
}
