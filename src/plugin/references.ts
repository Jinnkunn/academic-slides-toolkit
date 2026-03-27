// ---------------------------------------------------------------------------
// References / Citations — academic bibliography management
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

export const REFERENCE_KIND = "reference";
export const CITATION_KIND = "citation";

const STORAGE_KEY = "academic-references";

// ── Data structures ─────────────────────────────────────────────────────────

export interface ReferenceEntry {
  id: string;
  key: string;
  authors: string;
  title: string;
  year: string;
  venue: string;
  doi: string;
  url: string;
  type: string;
  raw: string;
}

// ── Storage helpers ─────────────────────────────────────────────────────────

async function loadReferences(): Promise<ReferenceEntry[]> {
  const raw = await figma.clientStorage.getAsync(STORAGE_KEY);
  if (Array.isArray(raw)) return raw;
  return [];
}

async function saveReferences(refs: ReferenceEntry[]): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_KEY, refs);
}

// ── BibTeX parser ───────────────────────────────────────────────────────────

function parseBibtex(raw: string): Partial<ReferenceEntry>[] {
  const entries: Partial<ReferenceEntry>[] = [];
  const entryRegex = /@(\w+)\s*\{([^,]*),([^@]*)\}/g;
  let match;
  while ((match = entryRegex.exec(raw)) !== null) {
    const type = match[1].toLowerCase();
    const key = match[2].trim();
    const body = match[3];
    const fields: Record<string, string> = {};
    const fieldRegex = /(\w+)\s*=\s*[\{"]((?:[^}"]|\n)*)[\}"]/g;
    let fm;
    while ((fm = fieldRegex.exec(body)) !== null) {
      fields[fm[1].toLowerCase()] = fm[2].trim();
    }
    entries.push({
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      key,
      type,
      authors: fields.author || "",
      title: fields.title || "",
      year: fields.year || "",
      venue: fields.booktitle || fields.journal || "",
      doi: fields.doi || "",
      url: fields.url || "",
      raw: match[0],
    });
  }
  return entries;
}

// ── Citation node helpers ───────────────────────────────────────────────────

export function markCitationNode(node: any, data: any): void {
  if (!node || typeof node.setPluginData !== "function") return;
  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", CITATION_KIND);
  node.setPluginData("citationRoot", "true");
  node.setPluginData("citationRefId", data.refId || "");
  node.setPluginData("citationFormat", data.format || "numeric");
  node.setPluginData("citationIndex", String(data.index || 1));
}

export function isCitationNode(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === CITATION_KIND
    && getPluginData(node, "citationRoot") === "true";
}

export function findCitationRoot(node: any): any {
  let current = node || null;
  while (current) {
    if (isCitationNode(current)) return current;
    current = current.parent || null;
  }
  return null;
}

export function serializeCitationNode(node: any): any | null {
  if (!node) return null;
  return {
    nodeId: node.id,
    name: node.name,
    refId: getPluginData(node, "citationRefId"),
    format: getPluginData(node, "citationFormat") || "numeric",
    index: Number(getPluginData(node, "citationIndex")) || 1,
  };
}

// ── Collect all citation nodes ──────────────────────────────────────────────

export async function collectCitations(
  scope: string,
  currentTargetId: string
): Promise<Array<{ targetId: string; targetIndex: number; node: any }>> {
  const results: Array<{ targetId: string; targetIndex: number; node: any }> = [];
  const targets = getAllTargets();

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (scope === "current" && currentTargetId && target.id !== currentTargetId) {
      continue;
    }

    await loadTargetIfNeeded(target);
    walkScene(target, (node: any) => {
      if (isCitationNode(node)) {
        results.push({
          targetId: target.id,
          targetIndex: index,
          node,
        });
      }
    });
  }

  results.sort((a, b) => {
    if (a.targetIndex !== b.targetIndex) return a.targetIndex - b.targetIndex;
    const aPosition = getAbsolutePosition(a.node);
    const bPosition = getAbsolutePosition(b.node);
    const ay = Number(aPosition.y) || 0;
    const by = Number(bPosition.y) || 0;
    if (ay !== by) return ay - by;
    return (Number(aPosition.x) || 0) - (Number(bPosition.x) || 0);
  });

  return results;
}

// ── Format helpers ──────────────────────────────────────────────────────────

function getFirstAuthorSurname(authors: string): string {
  if (!authors) return "Unknown";
  const first = authors.split(" and ")[0].trim();
  // Handle "Surname, First" format
  if (first.includes(",")) return first.split(",")[0].trim();
  // Handle "First Surname" format — take last word
  const parts = first.split(/\s+/);
  return parts[parts.length - 1];
}

function formatCitationText(
  format: string,
  index: number,
  ref: ReferenceEntry | null
): string {
  if (format === "author-year" && ref) {
    const surname = getFirstAuthorSurname(ref.authors);
    return `[${surname}, ${ref.year || "n.d."}]`;
  }
  return `[${index}]`;
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function handleGetReferences(message: any): Promise<void> {
  const refs = await loadReferences();
  figma.ui.postMessage({
    type: "references-loaded",
    references: refs,
  });
}

export async function handleAddReference(message: any): Promise<void> {
  const refs = await loadReferences();

  const entry: ReferenceEntry = {
    id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    key: String(message.key || "").trim() || `ref${refs.length + 1}`,
    authors: String(message.authors || "").trim(),
    title: String(message.title || "").trim(),
    year: String(message.year || "").trim(),
    venue: String(message.venue || "").trim(),
    doi: String(message.doi || "").trim(),
    url: String(message.url || "").trim(),
    type: String(message.refType || "article").trim(),
    raw: "",
  };

  refs.push(entry);
  await saveReferences(refs);

  figma.ui.postMessage({
    type: "reference-added",
    reference: entry,
  });
}

export async function handleImportBibtex(message: any): Promise<void> {
  const bibtexStr = String(message.bibtex || "").trim();
  if (!bibtexStr) {
    postError("BibTeX content is empty", "errorEmptyBibtex");
    return;
  }

  const parsed = parseBibtex(bibtexStr);
  if (parsed.length === 0) {
    postError("No valid BibTeX entries found", "errorNoBibtexEntries");
    return;
  }

  const refs = await loadReferences();

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    refs.push({
      id: p.id || `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      key: p.key || `imported${i + 1}`,
      authors: p.authors || "",
      title: p.title || "",
      year: p.year || "",
      venue: p.venue || "",
      doi: p.doi || "",
      url: p.url || "",
      type: p.type || "misc",
      raw: p.raw || "",
    });
  }

  await saveReferences(refs);

  figma.ui.postMessage({
    type: "bibtex-imported",
    count: parsed.length,
  });
}

export async function handleDeleteReference(message: any): Promise<void> {
  const refId = String(message.refId || "").trim();
  if (!refId) {
    postError("No reference ID specified", "errorNoRefId");
    return;
  }

  const refs = await loadReferences();
  const filtered = refs.filter((r) => r.id !== refId);
  await saveReferences(filtered);

  figma.ui.postMessage({
    type: "reference-deleted",
    refId,
  });
}

export async function handleInsertCitation(message: any): Promise<void> {
  const refId = String(message.refId || "").trim();
  const citationFormat = String(message.citationFormat || "numeric").trim();

  if (!refId) {
    postError("No reference selected for citation", "errorNoRefForCitation");
    return;
  }

  const refs = await loadReferences();
  const ref = refs.find((r) => r.id === refId) || null;

  // Determine index: count how many unique refs have been cited already + 1
  // For simplicity, assign based on position in refs array
  const refIndex = refs.findIndex((r) => r.id === refId);
  const displayIndex = refIndex >= 0 ? refIndex + 1 : 1;

  const displayText = formatCitationText(citationFormat, displayIndex, ref);

  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("当前无法定位插入位置", "errorNoInsertTarget");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  // Create text node
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  const textNode = figma.createText();
  textNode.name = "Citation: " + (ref ? ref.key : refId);
  textNode.fontName = { family: "Inter", style: "Regular" };
  textNode.fontSize = 16;
  textNode.characters = displayText;
  textNode.fills = [{ type: "SOLID", color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 } }];

  markCitationNode(textNode, {
    refId,
    format: citationFormat,
    index: displayIndex,
  });

  target.appendChild(textNode);

  // Position at viewport center
  const center = figma.viewport.center;
  const targetAbsolute = getAbsolutePosition(target);
  textNode.x = Math.round(center.x - targetAbsolute.x - textNode.width / 2);
  textNode.y = Math.round(center.y - targetAbsolute.y - textNode.height / 2);

  figma.currentPage.selection = [textNode];
  figma.viewport.scrollAndZoomIntoView([textNode]);

  figma.ui.postMessage({
    type: "citation-inserted",
    citation: serializeCitationNode(textNode),
  });
}

export async function handleUpdateAllCitations(message: any): Promise<void> {
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length
    ? getTargetById(getContainerIdForNode(selection[0]))
    : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const scope = message && message.scope === "current" ? "current" : "all";

  const citations = await collectCitations(scope, currentTargetId);
  const refs = await loadReferences();

  // Build ref→number map based on first-appearance order
  const refNumberMap = new Map<string, number>();
  let counter = 0;

  for (let i = 0; i < citations.length; i++) {
    const node = citations[i].node;
    const refId = getPluginData(node, "citationRefId");
    if (refId && !refNumberMap.has(refId)) {
      counter++;
      refNumberMap.set(refId, counter);
    }
  }

  let updated = 0;

  for (let i = 0; i < citations.length; i++) {
    const node = citations[i].node;
    const refId = getPluginData(node, "citationRefId");
    const citationFormat = getPluginData(node, "citationFormat") || "numeric";
    const ref = refs.find((r) => r.id === refId) || null;

    const newIndex = refNumberMap.get(refId) || Number(getPluginData(node, "citationIndex")) || 1;
    const displayText = formatCitationText(citationFormat, newIndex, ref);

    node.setPluginData("citationIndex", String(newIndex));

    if (isTextNode(node)) {
      await loadAllFonts(node);
      node.characters = displayText;
      updated++;
    }
  }

  figma.ui.postMessage({
    type: "citations-updated",
    count: updated,
    scope,
  });
}

export async function handleGenerateBibliographySlide(message: any): Promise<void> {
  const refs = await loadReferences();
  if (refs.length === 0) {
    postError("No references to generate bibliography from", "errorNoRefsForBib");
    return;
  }

  // Collect citations to build ordering map based on first appearance
  const selection = figma.currentPage.selection;
  const currentTarget = selection.length
    ? getTargetById(getContainerIdForNode(selection[0]))
    : findViewportTarget();
  const currentTargetId = currentTarget ? currentTarget.id : "";
  const citations = await collectCitations("all", currentTargetId);

  // Build ref→number map by first appearance; unmentioned refs get appended
  const refNumberMap = new Map<string, number>();
  let counter = 0;

  for (let i = 0; i < citations.length; i++) {
    const refId = getPluginData(citations[i].node, "citationRefId");
    if (refId && !refNumberMap.has(refId)) {
      counter++;
      refNumberMap.set(refId, counter);
    }
  }

  // Add any refs not yet cited
  for (let i = 0; i < refs.length; i++) {
    if (!refNumberMap.has(refs[i].id)) {
      counter++;
      refNumberMap.set(refs[i].id, counter);
    }
  }

  // Sort refs by their assigned number
  const sortedRefs = [...refs].sort((a, b) => {
    return (refNumberMap.get(a.id) || 999) - (refNumberMap.get(b.id) || 999);
  });

  // Create a new page (slide) for bibliography
  const page = figma.createPage();
  page.name = "References";

  // Switch to the new page
  await page.loadAsync();

  // Create outer frame
  const frame = figma.createFrame();
  frame.name = "Bibliography";
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
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const titleNode = figma.createText();
  titleNode.name = "Title";
  titleNode.fontName = { family: "Inter", style: "Bold" };
  titleNode.fontSize = 28;
  titleNode.characters = "References";
  titleNode.fills = [{ type: "SOLID", color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 } }];
  titleNode.layoutAlign = "STRETCH";
  titleNode.textAutoResize = "HEIGHT";
  frame.appendChild(titleNode);

  // Spacer
  const spacer = figma.createFrame();
  spacer.name = "Spacer";
  spacer.resize(860, 16);
  spacer.fills = [];
  spacer.layoutAlign = "STRETCH";
  frame.appendChild(spacer);

  // Reference entries
  for (let i = 0; i < sortedRefs.length; i++) {
    const ref = sortedRefs[i];
    const num = refNumberMap.get(ref.id) || (i + 1);

    let entryText = `[${num}] `;
    if (ref.authors) entryText += ref.authors + ". ";
    if (ref.title) entryText += ref.title + ". ";
    if (ref.venue) entryText += ref.venue + ", ";
    if (ref.year) entryText += ref.year + ".";
    else entryText = entryText.replace(/,\s*$/, ".");

    const entryNode = figma.createText();
    entryNode.name = `Ref ${num}`;
    entryNode.fontName = { family: "Inter", style: "Regular" };
    entryNode.fontSize = 14;
    entryNode.characters = entryText.trim();
    entryNode.fills = [{ type: "SOLID", color: { r: 0.27, g: 0.30, b: 0.33 } }];
    entryNode.layoutAlign = "STRETCH";
    entryNode.textAutoResize = "HEIGHT";
    frame.appendChild(entryNode);
  }

  figma.currentPage = page;

  figma.ui.postMessage({
    type: "bib-slide-generated",
    count: sortedRefs.length,
  });
}
