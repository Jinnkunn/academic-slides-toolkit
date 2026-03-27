import { normalizeLayoutFrame, normalizePlacement, normalizePlacementMode } from "./normalize";

export function getPositionInContainer(node: any, container: any): { x: number; y: number } {
  if (!node || !container) {
    return { x: 0, y: 0 };
  }

  if (node.parent === container) {
    return {
      x: Number(node.x) || 0,
      y: Number(node.y) || 0
    };
  }

  if ("absoluteTransform" in node && "absoluteTransform" in container) {
    return {
      x: (node.absoluteTransform && node.absoluteTransform[0] ? node.absoluteTransform[0][2] : 0)
        - (container.absoluteTransform && container.absoluteTransform[0] ? container.absoluteTransform[0][2] : 0),
      y: (node.absoluteTransform && node.absoluteTransform[1] ? node.absoluteTransform[1][2] : 0)
        - (container.absoluteTransform && container.absoluteTransform[1] ? container.absoluteTransform[1][2] : 0)
    };
  }

  return {
    x: Number(node.x) || 0,
    y: Number(node.y) || 0
  };
}

export function getLayoutRect(
  container: any,
  layoutFrame: any
): { x: number; y: number; width: number; height: number } {
  const width = Number(container && container.width) || 0;
  const height = Number(container && container.height) || 0;
  const frame = normalizeLayoutFrame(layoutFrame);

  if (frame.area !== "safe-area") {
    return {
      x: 0,
      y: 0,
      width,
      height
    };
  }

  const left = frame.safeArea.left;
  const top = frame.safeArea.top;
  const right = frame.safeArea.right;
  const bottom = frame.safeArea.bottom;

  return {
    x: left,
    y: top,
    width: Math.max(0, width - left - right),
    height: Math.max(0, height - top - bottom)
  };
}

export function buildPlacement(
  node: any,
  container: any,
  mode: string,
  fallbackPosition: any,
  layoutFrame: any
): { mode: string; x: number; y: number; offsetX: number; offsetY: number } {
  const position = fallbackPosition || getPositionInContainer(node, container);
  const nodeWidth = Number(node && node.width) || 0;
  const nodeHeight = Number(node && node.height) || 0;
  const normalizedMode = normalizePlacementMode(mode);
  const rect = getLayoutRect(container, layoutFrame);
  const relativeX = (Number(position.x) || 0) - rect.x;
  const relativeY = (Number(position.y) || 0) - rect.y;

  if (normalizedMode === "custom") {
    return {
      mode: normalizedMode,
      x: relativeX,
      y: relativeY,
      offsetX: 0,
      offsetY: 0
    };
  }

  const centeredX = (rect.width - nodeWidth) / 2;
  const rightX = rect.width - nodeWidth;
  const bottomY = rect.height - nodeHeight;

  switch (normalizedMode) {
    case "top-left":
      return { mode: normalizedMode, x: relativeX, y: relativeY, offsetX: relativeX, offsetY: relativeY };
    case "top-center":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: relativeX - centeredX,
        offsetY: relativeY
      };
    case "top-right":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: rightX - relativeX,
        offsetY: relativeY
      };
    case "bottom-left":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: relativeX,
        offsetY: bottomY - relativeY
      };
    case "bottom-center":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: relativeX - centeredX,
        offsetY: bottomY - relativeY
      };
    case "bottom-right":
      return {
        mode: normalizedMode,
        x: relativeX,
        y: relativeY,
        offsetX: rightX - relativeX,
        offsetY: bottomY - relativeY
      };
    default:
      return {
        mode: "custom",
        x: Number(position.x) || 0,
        y: Number(position.y) || 0,
        offsetX: 0,
        offsetY: 0
      };
  }
}

export function applyTemplatePosition(node: any, template: any, container: any): void {
  if (!node || !template) return;

  const placement = normalizePlacement(template.placement, template.position, template.templateKind);
  const rect = getLayoutRect(container, template.layoutFrame);
  if (placement.mode === "custom" || !container) {
    node.x = rect.x + (Number(placement.x) || 0);
    node.y = rect.y + (Number(placement.y) || 0);
    return;
  }

  const nodeWidth = Number(node.width) || 0;
  const nodeHeight = Number(node.height) || 0;
  const centeredX = (rect.width - nodeWidth) / 2;
  const rightX = rect.width - nodeWidth;
  const bottomY = rect.height - nodeHeight;

  switch (placement.mode) {
    case "top-left":
      node.x = rect.x + (Number(placement.offsetX) || 0);
      node.y = rect.y + (Number(placement.offsetY) || 0);
      break;
    case "top-center":
      node.x = rect.x + centeredX + (Number(placement.offsetX) || 0);
      node.y = rect.y + (Number(placement.offsetY) || 0);
      break;
    case "top-right":
      node.x = rect.x + rightX - (Number(placement.offsetX) || 0);
      node.y = rect.y + (Number(placement.offsetY) || 0);
      break;
    case "bottom-left":
      node.x = rect.x + (Number(placement.offsetX) || 0);
      node.y = rect.y + bottomY - (Number(placement.offsetY) || 0);
      break;
    case "bottom-center":
      node.x = rect.x + centeredX + (Number(placement.offsetX) || 0);
      node.y = rect.y + bottomY - (Number(placement.offsetY) || 0);
      break;
    case "bottom-right":
      node.x = rect.x + rightX - (Number(placement.offsetX) || 0);
      node.y = rect.y + bottomY - (Number(placement.offsetY) || 0);
      break;
    default:
      node.x = Number(placement.x) || 0;
      node.y = Number(placement.y) || 0;
      break;
  }
}

export function getAbsolutePosition(node: any): { x: number; y: number } {
  if (!node) {
    return { x: 0, y: 0 };
  }

  if ("absoluteTransform" in node && node.absoluteTransform) {
    return {
      x: node.absoluteTransform[0] ? Number(node.absoluteTransform[0][2]) || 0 : 0,
      y: node.absoluteTransform[1] ? Number(node.absoluteTransform[1][2]) || 0 : 0
    };
  }

  return {
    x: Number(node.x) || 0,
    y: Number(node.y) || 0
  };
}
