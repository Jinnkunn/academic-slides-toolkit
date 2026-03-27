// ---------------------------------------------------------------------------
// Appendix Structure — manage appendix divider, backup links, back links
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
  listPages,
} from "./slides";
import { getAbsolutePosition } from "./layout";

export const APPENDIX_KIND = "appendix";
export const APPENDIX_LINK_KIND = "appendix-link";

// ── Plugin data helpers ─────────────────────────────────────────────────────

export function isAppendixDivider(page: any): boolean {
  return !!page
    && typeof page.getPluginData === "function"
    && getPluginData(page, "managedByAcademicSlides") === "true"
    && getPluginData(page, "academicNodeKind") === APPENDIX_KIND
    && getPluginData(page, "appendixDivider") === "true";
}

export function isAppendixLink(node: any): boolean {
  return !!node
    && typeof node.getPluginData === "function"
    && getPluginData(node, "managedByAcademicSlides") === "true"
    && getPluginData(node, "academicNodeKind") === APPENDIX_LINK_KIND;
}

export function getAppendixStartIndex(): number {
  const targets = getAllTargets();
  for (let i = 0; i < targets.length; i++) {
    if (isAppendixDivider(targets[i])) {
      return i;
    }
  }
  return -1;
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function handleInsertAppendixDivider(message: any): Promise<void> {
  // Check if divider already exists
  const targets = getAllTargets();
  for (let i = 0; i < targets.length; i++) {
    if (isAppendixDivider(targets[i])) {
      postError("Appendix divider already exists", "errorAppendixDividerExists");
      return;
    }
  }

  // Create a new page (slide)
  const page = figma.createPage();
  page.name = "Appendix";

  await page.loadAsync();

  // Mark the page with plugin data
  page.setPluginData("managedByAcademicSlides", "true");
  page.setPluginData("academicNodeKind", APPENDIX_KIND);
  page.setPluginData("appendixDivider", "true");

  // Create full-size frame
  const frame = figma.createFrame();
  frame.name = "Appendix Divider";
  frame.resize(1280, 720);
  frame.fills = [{ type: "SOLID", color: { r: 30 / 255, g: 41 / 255, b: 59 / 255 } }];
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisAlignItems = "CENTER";
  frame.counterAxisAlignItems = "CENTER";
  frame.itemSpacing = 16;
  frame.paddingTop = 0;
  frame.paddingBottom = 0;
  frame.paddingLeft = 0;
  frame.paddingRight = 0;

  page.appendChild(frame);

  // Load fonts
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  // Title: "Appendix"
  const titleNode = figma.createText();
  titleNode.name = "Appendix Title";
  titleNode.fontName = { family: "Inter", style: "Bold" };
  titleNode.fontSize = 48;
  titleNode.characters = "Appendix";
  titleNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  titleNode.textAlignHorizontal = "CENTER";
  titleNode.layoutAlign = "STRETCH";
  titleNode.textAutoResize = "HEIGHT";
  frame.appendChild(titleNode);

  // Horizontal rule
  const rule = figma.createRectangle();
  rule.name = "Divider Rule";
  rule.resize(600, 1);
  rule.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.3 }];
  frame.appendChild(rule);

  // Subtitle: "Supplementary Materials"
  const subtitleNode = figma.createText();
  subtitleNode.name = "Appendix Subtitle";
  subtitleNode.fontName = { family: "Inter", style: "Regular" };
  subtitleNode.fontSize = 20;
  subtitleNode.characters = "Supplementary Materials";
  subtitleNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.6 }];
  subtitleNode.textAlignHorizontal = "CENTER";
  subtitleNode.layoutAlign = "STRETCH";
  subtitleNode.textAutoResize = "HEIGHT";
  frame.appendChild(subtitleNode);

  figma.currentPage = page;

  figma.ui.postMessage({
    type: "appendix-divider-inserted",
  });
}

export async function handleInsertBackupLink(message: any): Promise<void> {
  const targetPageId = String(message.targetPageId || "").trim();
  const linkText = String(message.linkText || "").trim();

  if (!targetPageId) {
    postError("No target appendix page specified", "errorNoAppendixTarget");
    return;
  }

  // Resolve target page name for display
  const targets = getAllTargets();
  let targetName = linkText;
  if (!targetName) {
    for (let i = 0; i < targets.length; i++) {
      if (targets[i].id === targetPageId) {
        targetName = targets[i].name || `Slide ${i + 1}`;
        break;
      }
    }
  }
  if (!targetName) targetName = "Appendix";

  // Determine appendix numbering (A.n)
  const dividerIndex = getAppendixStartIndex();
  let appendixNumber = "";
  if (dividerIndex >= 0) {
    for (let i = dividerIndex + 1; i < targets.length; i++) {
      if (targets[i].id === targetPageId) {
        appendixNumber = `A.${i - dividerIndex}`;
        break;
      }
    }
  }

  const displayText = appendixNumber
    ? `\u2192 Appendix ${appendixNumber}`
    : `\u2192 See Appendix: ${targetName}`;

  // Insert on the current page/slide
  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("Cannot locate insertion target", "errorNoInsertTarget");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const textNode = figma.createText();
  textNode.name = "Appendix Link: " + targetName;
  textNode.fontName = { family: "Inter", style: "Regular" };
  textNode.fontSize = 12;
  textNode.characters = displayText;
  textNode.fills = [{ type: "SOLID", color: { r: 74 / 255, g: 144 / 255, b: 217 / 255 } }];

  // Mark with plugin data
  textNode.setPluginData("managedByAcademicSlides", "true");
  textNode.setPluginData("academicNodeKind", APPENDIX_LINK_KIND);
  textNode.setPluginData("appendixLinkTargetPage", targetPageId);

  target.appendChild(textNode);

  // Position at bottom-right of the target frame
  const targetWidth = Number(target.width) || 1280;
  const targetHeight = Number(target.height) || 720;
  textNode.x = Math.round(targetWidth - textNode.width - 24);
  textNode.y = Math.round(targetHeight - textNode.height - 20);

  figma.currentPage.selection = [textNode];
  figma.viewport.scrollAndZoomIntoView([textNode]);

  figma.ui.postMessage({
    type: "backup-link-inserted",
    nodeId: textNode.id,
    targetPageId,
  });
}

export async function handleInsertBackToMainLink(message: any): Promise<void> {
  const sourcePageId = String(message.sourcePageId || "").trim();

  if (!sourcePageId) {
    postError("No source main slide specified", "errorNoSourcePage");
    return;
  }

  // Find the page number of the source page
  const targets = getAllTargets();
  let pageNumber = 0;
  for (let i = 0; i < targets.length; i++) {
    if (targets[i].id === sourcePageId) {
      pageNumber = i + 1;
      break;
    }
  }

  const displayText = pageNumber > 0
    ? `\u2190 Back to Slide ${pageNumber}`
    : "\u2190 Back to Main";

  // Insert on the current page/slide
  const target = getEquationInsertionTarget();
  if (!target || typeof target.appendChild !== "function") {
    postError("Cannot locate insertion target", "errorNoInsertTarget");
    return;
  }

  if (typeof target.loadAsync === "function") {
    await target.loadAsync();
  }

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const textNode = figma.createText();
  textNode.name = "Back to Main Link";
  textNode.fontName = { family: "Inter", style: "Regular" };
  textNode.fontSize = 12;
  textNode.characters = displayText;
  textNode.fills = [{ type: "SOLID", color: { r: 107 / 255, g: 114 / 255, b: 128 / 255 } }];

  // Mark with plugin data
  textNode.setPluginData("managedByAcademicSlides", "true");
  textNode.setPluginData("academicNodeKind", APPENDIX_LINK_KIND);
  textNode.setPluginData("appendixLinkTargetPage", sourcePageId);
  textNode.setPluginData("appendixBackLink", "true");

  target.appendChild(textNode);

  // Position at top-right of the target frame
  const targetWidth = Number(target.width) || 1280;
  textNode.x = Math.round(targetWidth - textNode.width - 24);
  textNode.y = 20;

  figma.currentPage.selection = [textNode];
  figma.viewport.scrollAndZoomIntoView([textNode]);

  figma.ui.postMessage({
    type: "back-link-inserted",
    nodeId: textNode.id,
    sourcePageId,
  });
}

export async function handleGetAppendixInfo(message: any): Promise<void> {
  const targets = getAllTargets();

  let hasDivider = false;
  let dividerPageIndex = -1;

  // Find the divider
  for (let i = 0; i < targets.length; i++) {
    if (isAppendixDivider(targets[i])) {
      hasDivider = true;
      dividerPageIndex = i;
      break;
    }
  }

  // Build main slides and appendix slides lists
  const mainSlides: Array<{ pageId: string; pageName: string; index: number }> = [];
  const appendixSlides: Array<{ pageId: string; pageName: string; index: number }> = [];

  for (let i = 0; i < targets.length; i++) {
    const entry = {
      pageId: targets[i].id,
      pageName: targets[i].name || (isSlidesEditor() ? `Slide ${i + 1}` : `Page ${i + 1}`),
      index: i,
    };

    if (!hasDivider || i < dividerPageIndex) {
      mainSlides.push(entry);
    } else if (i > dividerPageIndex) {
      appendixSlides.push(entry);
    }
    // Skip the divider page itself
  }

  // Collect all appendix-link nodes
  const links: Array<{ nodeId: string; sourcePageId: string; targetPageId: string; isBackLink: boolean }> = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    await loadTargetIfNeeded(target);
    walkScene(target, (node: any) => {
      if (isAppendixLink(node)) {
        const targetPageId = getPluginData(node, "appendixLinkTargetPage");
        const isBack = getPluginData(node, "appendixBackLink") === "true";
        links.push({
          nodeId: node.id,
          sourcePageId: target.id,
          targetPageId,
          isBackLink: isBack,
        });
      }
    });
  }

  figma.ui.postMessage({
    type: "appendix-info",
    hasDivider,
    dividerPageIndex,
    appendixSlides,
    mainSlides,
    links,
  });
}

export async function handleReorderAppendix(message: any): Promise<void> {
  const pageIds: string[] = message.pageIds;
  if (!Array.isArray(pageIds) || pageIds.length === 0) {
    postError("No page IDs provided for reordering", "errorNoPageIds");
    return;
  }

  const dividerIndex = getAppendixStartIndex();
  if (dividerIndex < 0) {
    postError("No appendix divider found", "errorNoDivider");
    return;
  }

  // In Figma, reorder pages by moving children of figma.root
  // The appendix pages start after the divider
  const insertIndex = dividerIndex + 1;

  for (let i = 0; i < pageIds.length; i++) {
    const page = getTargetById(pageIds[i]);
    if (page && typeof figma.root.insertChild === "function") {
      figma.root.insertChild(insertIndex + i, page);
    }
  }

  figma.ui.postMessage({
    type: "appendix-reordered",
  });
}

export async function handleUpdateAllAppendixLinks(message: any): Promise<void> {
  const targets = getAllTargets();
  let updated = 0;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    await loadTargetIfNeeded(target);

    walkScene(target, (node: any) => {
      if (!isAppendixLink(node)) return;
      if (!isTextNode(node)) return;

      const linkedPageId = getPluginData(node, "appendixLinkTargetPage");
      const isBack = getPluginData(node, "appendixBackLink") === "true";

      // Find current page number of linked page
      let pageNumber = 0;
      for (let j = 0; j < targets.length; j++) {
        if (targets[j].id === linkedPageId) {
          pageNumber = j + 1;
          break;
        }
      }

      if (isBack) {
        // Back-to-main link — update with current slide number
        const newText = pageNumber > 0
          ? `\u2190 Back to Slide ${pageNumber}`
          : "\u2190 Back to Main";

        loadAllFonts(node).then(() => {
          node.characters = newText;
        });
        updated++;
      } else {
        // Backup link — update with appendix numbering
        const dividerIndex = getAppendixStartIndex();
        let appendixNumber = "";
        if (dividerIndex >= 0) {
          for (let j = dividerIndex + 1; j < targets.length; j++) {
            if (targets[j].id === linkedPageId) {
              appendixNumber = `A.${j - dividerIndex}`;
              break;
            }
          }
        }

        let targetName = "";
        for (let j = 0; j < targets.length; j++) {
          if (targets[j].id === linkedPageId) {
            targetName = targets[j].name || `Slide ${j + 1}`;
            break;
          }
        }

        const newText = appendixNumber
          ? `\u2192 Appendix ${appendixNumber}`
          : `\u2192 See Appendix: ${targetName}`;

        loadAllFonts(node).then(() => {
          node.characters = newText;
        });
        updated++;
      }
    });
  }

  figma.ui.postMessage({
    type: "appendix-links-updated",
    count: updated,
  });
}
