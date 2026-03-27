import { isSlidesEditor, getTargetById } from "./slides";

export function serializeNode(node: any, depth: number = 0): any {
  const serialized: any = {
    id: node.id,
    name: node.name,
    type: node.type
  };

  if (depth < 5 && "children" in node) {
    serialized.children = node.children.map((child: any) => serializeNode(child, depth + 1));
  }

  return serialized;
}

export function getNodePath(root: any, targetId: string): number[] | null {
  if (root.id === targetId) return [];
  if (!("children" in root)) return null;

  for (let index = 0; index < root.children.length; index++) {
    const childPath = getNodePath(root.children[index], targetId);
    if (childPath !== null) {
      return [index].concat(childPath);
    }
  }

  return null;
}

export function getNodeByPath(root: any, path: number[]): any | null {
  let current = root;

  for (const index of path) {
    if (!("children" in current) || index >= current.children.length) {
      return null;
    }
    current = current.children[index];
  }

  return current;
}

export function isTextNode(node: any): boolean {
  return !!node && node.type === "TEXT";
}

const MAX_WALK_DEPTH = 64;

export function walkScene(node: any, visit: (node: any) => void, _depth: number = 0): void {
  if (!node || _depth > MAX_WALK_DEPTH) return;
  visit(node);
  if ("children" in node) {
    for (let index = 0; index < node.children.length; index++) {
      walkScene(node.children[index], visit, _depth + 1);
    }
  }
}

export async function loadTargetIfNeeded(target: any): Promise<void> {
  if (target && typeof target.loadAsync === "function") {
    await target.loadAsync();
  }
}

export async function getLoadedTargetById(targetId: string): Promise<any | null> {
  const fallbackTarget = getTargetById(targetId);
  if (fallbackTarget) {
    await loadTargetIfNeeded(fallbackTarget);
  }

  if (targetId && typeof figma.getNodeByIdAsync === "function") {
    const resolvedTarget = await figma.getNodeByIdAsync(targetId);
    if (
      resolvedTarget
      && resolvedTarget.id === targetId
      && (!isSlidesEditor() || resolvedTarget.type === "SLIDE")
    ) {
      await loadTargetIfNeeded(resolvedTarget);
      return resolvedTarget;
    }
    if (resolvedTarget && fallbackTarget && (resolvedTarget.id !== targetId || resolvedTarget.type !== fallbackTarget.type)) {
      console.error("[AcademicSlides][target-mismatch]", {
        requestedId: targetId,
        resolvedId: resolvedTarget.id,
        resolvedType: resolvedTarget.type,
        fallbackId: fallbackTarget.id,
        fallbackType: fallbackTarget.type
      });
    }
  }

  return fallbackTarget || null;
}

export function getNodeRect(node: any): { x: number; y: number; width: number; height: number } {
  return {
    x: Number(node && node.x) || 0,
    y: Number(node && node.y) || 0,
    width: Number(node && node.width) || 0,
    height: Number(node && node.height) || 0
  };
}

export function doRectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export async function loadAllFonts(node: any): Promise<boolean> {
  let loaded = true;
  if (node.type === "TEXT") {
    try {
      if (node.fontName !== figma.mixed) {
        await figma.loadFontAsync(node.fontName);
      } else if (typeof node.getStyledTextSegments === "function") {
        const segments = node.getStyledTextSegments(["fontName"]);
        const seen = new Set<string>();
        for (let i = 0; i < segments.length; i++) {
          const key = JSON.stringify(segments[i].fontName);
          if (!seen.has(key)) {
            seen.add(key);
            await figma.loadFontAsync(segments[i].fontName);
          }
        }
      } else {
        const seen = new Set<string>();
        for (let index = 0; index < node.characters.length; index++) {
          const fontName = node.getRangeFontName(index, index + 1);
          const key = JSON.stringify(fontName);
          if (!seen.has(key)) {
            seen.add(key);
            await figma.loadFontAsync(fontName);
          }
        }
      }
    } catch (_) {
      loaded = false;
    }
  }

  if ("children" in node) {
    for (const child of node.children) {
      const childLoaded = await loadAllFonts(child);
      if (!childLoaded) {
        loaded = false;
      }
    }
  }

  return loaded;
}
