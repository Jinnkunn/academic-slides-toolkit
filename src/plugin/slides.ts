import { getAbsolutePosition } from "./layout";

let allPagesLoadedPromise: Promise<void> | null = null;

export function isSlidesEditor(): boolean {
  return figma.editorType === "slides" && typeof (figma as any).getSlideGrid === "function";
}

export async function ensureAllPagesLoaded(): Promise<void> {
  if (!isSlidesEditor() || typeof (figma as any).loadAllPagesAsync !== "function") {
    return;
  }

  if (!allPagesLoadedPromise) {
    allPagesLoadedPromise = (figma as any).loadAllPagesAsync().catch((error: any) => {
      allPagesLoadedPromise = null;
      throw error;
    });
  }

  await allPagesLoadedPromise;
}

export function getSlideList(): any[] {
  const slideGrid: any[][] = (figma as any).getSlideGrid ? (figma as any).getSlideGrid() : [];
  const slides: any[] = [];
  const seenIds = new Set<string>();

  for (let rowIndex = 0; rowIndex < slideGrid.length; rowIndex++) {
    const row = slideGrid[rowIndex];
    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      const slide = row[columnIndex];
      if (slide && slide.type === "SLIDE" && !seenIds.has(slide.id)) {
        seenIds.add(slide.id);
        slides.push(slide);
      }
    }
  }

  return slides;
}

export function getAllTargets(): any[] {
  return isSlidesEditor() ? getSlideList() : figma.root.children.slice();
}

export function getTargetById(targetId: string): any | null {
  const targets = getAllTargets();
  for (let index = 0; index < targets.length; index++) {
    if (targets[index].id === targetId) {
      return targets[index];
    }
  }
  return null;
}

export function getContainerIdForNode(node: any): string {
  if (!node) return "";

  if (isSlidesEditor()) {
    let current: any = node;
    while (current) {
      if (current.type === "SLIDE") {
        return current.id;
      }
      current = current.parent || null;
    }
    return "";
  }

  return figma.currentPage.id;
}

export function findViewportTarget(): any {
  const targets = getAllTargets();
  const center = figma.viewport.center;

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    const absolute = getAbsolutePosition(target);
    const width = Number(target.width) || 0;
    const height = Number(target.height) || 0;

    if (
      center.x >= absolute.x &&
      center.x <= absolute.x + width &&
      center.y >= absolute.y &&
      center.y <= absolute.y + height
    ) {
      return target;
    }
  }

  return targets.length ? targets[0] : figma.currentPage;
}

export function getEquationInsertionTarget(): any {
  const selection = figma.currentPage.selection;
  if (selection.length) {
    const containerId = getContainerIdForNode(selection[0]);
    const target = getTargetById(containerId);
    if (target) return target;
  }

  return findViewportTarget();
}

export function listPages(): Array<{ id: string; name: string; index: number }> {
  const targets = getAllTargets();

  return targets.map((target: any, index: number) => ({
    id: target.id,
    name: target.name || (isSlidesEditor() ? `Slide ${index + 1}` : `Page ${index + 1}`),
    index
  }));
}
