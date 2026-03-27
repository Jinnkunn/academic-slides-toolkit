// ---------------------------------------------------------------------------
// Normalize / sanitise helpers – migrated from code.js lines 13-278
// ---------------------------------------------------------------------------

import { createPluginError } from "./errors";
import type {
  PluginSettings,
  PluginStorage,
  TemplateKind,
  PlacementMode,
  LayoutArea,
  SafeAreaMargins,
  LayoutFrame,
  Placement,
  VariableRange,
  TemplateVariable,
  TemplateConfig,
} from "./types";

// ── Storage ───────────────────────────────────────────────────────────────

export function emptyStorage(): PluginStorage {
  return {
    templates: {},
    templateInstanceMap: {},
    settings: {
      language: "zh-CN",
    },
  };
}

// ── Settings ──────────────────────────────────────────────────────────────

export function normalizeSettings(rawSettings: any): PluginSettings {
  const source =
    rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const language =
    typeof source.language === "string" ? source.language : "zh-CN";

  return {
    language: language === "en-US" ? "en-US" : "zh-CN",
  };
}

// ── Template kind ─────────────────────────────────────────────────────────

export function normalizeTemplateKind(rawKind: any): TemplateKind {
  return rawKind === "header" || rawKind === "footer" ? rawKind : "custom";
}

// ── Placement mode ────────────────────────────────────────────────────────

export function normalizePlacementMode(rawMode: any): PlacementMode {
  const allowed = new Set<PlacementMode>([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "custom",
  ]);
  return allowed.has(rawMode) ? rawMode : "custom";
}

export function defaultPlacementModeForKind(
  templateKind: TemplateKind
): PlacementMode {
  if (templateKind === "header") return "top-center";
  if (templateKind === "footer") return "bottom-center";
  return "custom";
}

// ── Layout area / safe-area ───────────────────────────────────────────────

export function normalizeLayoutArea(rawArea: any): LayoutArea {
  return rawArea === "safe-area" ? "safe-area" : "slide";
}

export function defaultSafeAreaMargins(): SafeAreaMargins {
  return {
    top: 24,
    right: 32,
    bottom: 24,
    left: 32,
  };
}

export function normalizeSafeArea(rawSafeArea: any): SafeAreaMargins {
  const fallback = defaultSafeAreaMargins();
  const source =
    rawSafeArea && typeof rawSafeArea === "object" ? rawSafeArea : {};
  return {
    top: Math.max(0, Number(source.top) || fallback.top),
    right: Math.max(0, Number(source.right) || fallback.right),
    bottom: Math.max(0, Number(source.bottom) || fallback.bottom),
    left: Math.max(0, Number(source.left) || fallback.left),
  };
}

export function normalizeLayoutFrame(rawLayoutFrame: any): LayoutFrame {
  const source =
    rawLayoutFrame && typeof rawLayoutFrame === "object"
      ? rawLayoutFrame
      : {};
  return {
    area: normalizeLayoutArea(source.area),
    safeArea: normalizeSafeArea(source.safeArea),
  };
}

// ── Placement ─────────────────────────────────────────────────────────────

export function normalizePlacement(
  rawPlacement: any,
  fallbackPosition: any,
  templateKind: TemplateKind
): Placement {
  const fallback =
    fallbackPosition && typeof fallbackPosition === "object"
      ? {
          x: Number(fallbackPosition.x) || 0,
          y: Number(fallbackPosition.y) || 0,
        }
      : { x: 0, y: 0 };
  const source =
    rawPlacement && typeof rawPlacement === "object" ? rawPlacement : {};
  const mode = normalizePlacementMode(
    source.mode || defaultPlacementModeForKind(templateKind)
  );

  if (mode === "custom") {
    return {
      mode,
      x: Number(source.x) || fallback.x,
      y: Number(source.y) || fallback.y,
      offsetX: 0,
      offsetY: 0,
    };
  }

  return {
    mode,
    x: fallback.x,
    y: fallback.y,
    offsetX: Number(source.offsetX) || 0,
    offsetY: Number(source.offsetY) || 0,
  };
}

// ── Variable ranges ───────────────────────────────────────────────────────

export function normalizeRanges(
  rawRanges: any,
  variableName: string,
  throwOnError: boolean = true
): VariableRange[] {
  const fail = (
    errorKey: string,
    fallbackMessage: string,
    vars?: Record<string, any>
  ): null => {
    if (throwOnError)
      throw createPluginError(errorKey, fallbackMessage, vars);
    return null;
  };

  if (!Array.isArray(rawRanges)) {
    return (
      fail(
        "errorVarMissingRanges",
        `变量「${variableName}」缺少范围配置`,
        { name: variableName }
      ) || []
    );
  }

  const ranges: (VariableRange | null)[] = rawRanges.map(
    (range: any, index: number) => {
      const from = Number(range && range.from);
      const to = Number(range && range.to);

      if (
        !Number.isFinite(from) ||
        from < 1 ||
        !Number.isFinite(to) ||
        to < 1
      ) {
        return fail(
          "errorVarInvalidRange",
          `变量「${variableName}」的第 ${index + 1} 个范围页码无效`,
          { name: variableName, index: index + 1 }
        );
      }
      if (from > to) {
        return fail(
          "errorVarRangeOrder",
          `变量「${variableName}」的第 ${index + 1} 个范围起始页不能大于结束页`,
          { name: variableName, index: index + 1 }
        );
      }

      return {
        from,
        to,
        value: String(
          range && range.value !== undefined && range.value !== null
            ? range.value
            : ""
        ),
        sourcePageId:
          range && typeof range.sourcePageId === "string"
            ? range.sourcePageId
            : null,
        sourcePageName:
          range && typeof range.sourcePageName === "string"
            ? range.sourcePageName
            : "",
      };
    }
  );

  if (ranges.includes(null)) {
    return [];
  }

  const validRanges = ranges as VariableRange[];
  validRanges.sort((a, b) => a.from - b.from || a.to - b.to);

  for (let i = 1; i < validRanges.length; i++) {
    if (validRanges[i].from <= validRanges[i - 1].to) {
      return (
        fail(
          "errorVarRangeOverlap",
          `变量「${variableName}」的范围发生重叠`,
          { name: variableName }
        ) || []
      );
    }
  }

  return validRanges;
}

// ── Variables ─────────────────────────────────────────────────────────────

export function normalizeVariables(
  rawVariables: any,
  throwOnError: boolean = true
): TemplateVariable[] {
  const fail = (
    errorKey: string,
    fallbackMessage: string,
    vars?: Record<string, any>
  ): null => {
    if (throwOnError)
      throw createPluginError(errorKey, fallbackMessage, vars);
    return null;
  };

  if (!Array.isArray(rawVariables)) {
    return [];
  }

  const seenPaths = new Set<string>();
  const variables: TemplateVariable[] = [];

  for (let index = 0; index < rawVariables.length; index++) {
    const variable = rawVariables[index];
    const name = String(
      (variable && variable.name) ||
        (variable && variable.nodeName) ||
        `变量 ${index + 1}`
    ).trim();
    const path: number[] | null = Array.isArray(variable && variable.path)
      ? (variable.path as any[]).map((part: any) => Number(part))
      : null;

    if (!name) {
      const error = fail(
        "errorVarMissingName",
        `第 ${index + 1} 个变量缺少名称`,
        { index: index + 1 }
      );
      if (error === null) continue;
    }
    if (!path || path.some((part) => !Number.isInteger(part) || part < 0)) {
      const error = fail(
        "errorVarInvalidNode",
        `变量「${name || index + 1}」的目标节点无效`,
        { name: name || String(index + 1) }
      );
      if (error === null) continue;
    }

    const pathKey = JSON.stringify(path);
    if (seenPaths.has(pathKey)) {
      const error = fail(
        "errorVarDuplicateBinding",
        `变量「${name}」重复绑定了同一个节点`,
        { name: name }
      );
      if (error === null) continue;
    }
    seenPaths.add(pathKey);

    const ranges = normalizeRanges(
      (variable && variable.ranges) || [],
      name,
      throwOnError
    );
    if (!ranges.length) {
      const error = fail(
        "errorVarNeedsRange",
        `变量「${name}」至少需要一个范围`,
        { name: name }
      );
      if (error === null) continue;
    }

    variables.push({
      id: String(
        (variable && variable.id) || `var_${Date.now()}_${index}`
      ),
      name,
      path,
      nodeName: String((variable && variable.nodeName) || ""),
      ranges,
    });
  }

  return variables;
}

// ── Template ──────────────────────────────────────────────────────────────

export function normalizeTemplate(
  templateId: string,
  template: any
): TemplateConfig {
  const source =
    template && typeof template === "object" ? template : {};
  const templateKind = normalizeTemplateKind(source.templateKind);
  const position =
    source.position && typeof source.position === "object"
      ? {
          x: Number(source.position.x) || 0,
          y: Number(source.position.y) || 0,
        }
      : { x: 0, y: 0 };

  return {
    id: source.id || templateId,
    name:
      typeof source.name === "string" && source.name.trim()
        ? source.name.trim()
        : "区域模板",
    nodeId: typeof source.nodeId === "string" ? source.nodeId : "",
    pageId: typeof source.pageId === "string" ? source.pageId : "",
    templateKind,
    position,
    layoutFrame: normalizeLayoutFrame(source.layoutFrame),
    placement: normalizePlacement(source.placement, position, templateKind),
    indicatorPath: Array.isArray(source.indicatorPath)
      ? (source.indicatorPath as any[]).map((part: any) => Number(part))
      : null,
    pageFormat:
      typeof source.pageFormat === "string" && source.pageFormat
        ? source.pageFormat
        : "%n",
    totalMode: source.totalMode === "custom" ? "custom" : "auto",
    customTotal:
      source.customTotal !== undefined && source.customTotal !== null
        ? Number(source.customTotal) || null
        : null,
    pageNumberStart: Number.isFinite(Number(source.pageNumberStart))
      ? Number(source.pageNumberStart)
      : 1,
    excludedPageIds: Array.isArray(source.excludedPageIds)
      ? source.excludedPageIds.filter((id: any) => typeof id === "string")
      : [],
    variables: normalizeVariables(source.variables || [], false),
    createdAt: Number.isFinite(Number(source.createdAt))
      ? Number(source.createdAt)
      : Date.now(),
  };
}

// ── Storage (top-level) ───────────────────────────────────────────────────

export function normalizeStorage(rawStorage: any): PluginStorage {
  const source =
    rawStorage && typeof rawStorage === "object" ? rawStorage : {};
  const templates: Record<string, TemplateConfig> = {};
  const templateInstanceMap: Record<string, string> = {};
  const settings = normalizeSettings(source.settings);

  for (const [templateId, template] of Object.entries(
    source.templates || {}
  )) {
    templates[templateId] = normalizeTemplate(templateId, template);
  }

  if (
    source.templateInstanceMap &&
    typeof source.templateInstanceMap === "object"
  ) {
    for (const key in source.templateInstanceMap) {
      if (
        Object.prototype.hasOwnProperty.call(
          source.templateInstanceMap,
          key
        )
      ) {
        templateInstanceMap[key] = source.templateInstanceMap[key];
      }
    }
  }

  return {
    templates,
    templateInstanceMap,
    settings,
  };
}
