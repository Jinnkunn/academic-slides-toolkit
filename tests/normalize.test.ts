// ---------------------------------------------------------------------------
// Unit tests for src/plugin/normalize.ts
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import {
  emptyStorage,
  normalizeSettings,
  normalizeTemplateKind,
  normalizePlacementMode,
  defaultPlacementModeForKind,
  normalizeLayoutArea,
  defaultSafeAreaMargins,
  normalizeSafeArea,
  normalizeLayoutFrame,
  normalizePlacement,
  normalizeRanges,
  normalizeVariables,
  normalizeTemplate,
  normalizeStorage,
} from "../src/plugin/normalize";

// ── emptyStorage ─────────────────────────────────────────────────────────

describe("emptyStorage", () => {
  it("returns a valid empty structure", () => {
    const s = emptyStorage();
    expect(s.templates).toEqual({});
    expect(s.templateInstanceMap).toEqual({});
    expect(s.settings.language).toBe("zh-CN");
  });
});

// ── normalizeSettings ────────────────────────────────────────────────────

describe("normalizeSettings", () => {
  it("defaults to zh-CN for null/undefined input", () => {
    expect(normalizeSettings(null).language).toBe("zh-CN");
    expect(normalizeSettings(undefined).language).toBe("zh-CN");
    expect(normalizeSettings(42).language).toBe("zh-CN");
  });

  it("accepts en-US", () => {
    expect(normalizeSettings({ language: "en-US" }).language).toBe("en-US");
  });

  it("rejects unknown languages to zh-CN", () => {
    expect(normalizeSettings({ language: "fr-FR" }).language).toBe("zh-CN");
    expect(normalizeSettings({ language: "" }).language).toBe("zh-CN");
  });
});

// ── normalizeTemplateKind ────────────────────────────────────────────────

describe("normalizeTemplateKind", () => {
  it("accepts header and footer", () => {
    expect(normalizeTemplateKind("header")).toBe("header");
    expect(normalizeTemplateKind("footer")).toBe("footer");
  });

  it("defaults to custom for anything else", () => {
    expect(normalizeTemplateKind("sidebar")).toBe("custom");
    expect(normalizeTemplateKind(null)).toBe("custom");
    expect(normalizeTemplateKind(undefined)).toBe("custom");
  });
});

// ── normalizePlacementMode ───────────────────────────────────────────────

describe("normalizePlacementMode", () => {
  it("accepts all valid modes", () => {
    const modes = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right", "custom"];
    for (const m of modes) {
      expect(normalizePlacementMode(m)).toBe(m);
    }
  });

  it("defaults to custom for invalid input", () => {
    expect(normalizePlacementMode("center")).toBe("custom");
    expect(normalizePlacementMode(null)).toBe("custom");
  });
});

// ── defaultPlacementModeForKind ──────────────────────────────────────────

describe("defaultPlacementModeForKind", () => {
  it("header → top-center", () => {
    expect(defaultPlacementModeForKind("header")).toBe("top-center");
  });

  it("footer → bottom-center", () => {
    expect(defaultPlacementModeForKind("footer")).toBe("bottom-center");
  });

  it("custom → custom", () => {
    expect(defaultPlacementModeForKind("custom")).toBe("custom");
  });
});

// ── normalizeLayoutArea ──────────────────────────────────────────────────

describe("normalizeLayoutArea", () => {
  it("accepts safe-area", () => {
    expect(normalizeLayoutArea("safe-area")).toBe("safe-area");
  });

  it("defaults to slide", () => {
    expect(normalizeLayoutArea("full")).toBe("slide");
    expect(normalizeLayoutArea(null)).toBe("slide");
  });
});

// ── defaultSafeAreaMargins ───────────────────────────────────────────────

describe("defaultSafeAreaMargins", () => {
  it("returns correct default margins", () => {
    const m = defaultSafeAreaMargins();
    expect(m).toEqual({ top: 24, right: 32, bottom: 24, left: 32 });
  });
});

// ── normalizeSafeArea ────────────────────────────────────────────────────

describe("normalizeSafeArea", () => {
  it("uses provided values", () => {
    const result = normalizeSafeArea({ top: 10, right: 20, bottom: 30, left: 40 });
    expect(result).toEqual({ top: 10, right: 20, bottom: 30, left: 40 });
  });

  it("falls back to defaults for invalid input", () => {
    const result = normalizeSafeArea(null);
    expect(result).toEqual(defaultSafeAreaMargins());
  });

  it("clamps negative values to 0 via Math.max", () => {
    // Math.max(0, -5) = 0; Number("abc") is NaN so || fallback kicks in
    const result = normalizeSafeArea({ top: -5, right: 0, bottom: "abc", left: 10 });
    expect(result.top).toBe(0);       // Math.max(0, -5) = 0
    expect(result.right).toBe(32);    // Number(0) || fallback → fallback (0 is falsy)
    expect(result.bottom).toBe(24);   // NaN || fallback
    expect(result.left).toBe(10);
  });
});

// ── normalizeLayoutFrame ─────────────────────────────────────────────────

describe("normalizeLayoutFrame", () => {
  it("normalizes valid input", () => {
    const result = normalizeLayoutFrame({ area: "safe-area", safeArea: { top: 10, right: 10, bottom: 10, left: 10 } });
    expect(result.area).toBe("safe-area");
    expect(result.safeArea.top).toBe(10);
  });

  it("falls back for null input", () => {
    const result = normalizeLayoutFrame(null);
    expect(result.area).toBe("slide");
  });
});

// ── normalizePlacement ───────────────────────────────────────────────────

describe("normalizePlacement", () => {
  it("custom mode uses source x/y", () => {
    const result = normalizePlacement(
      { mode: "custom", x: 100, y: 200 },
      { x: 50, y: 50 },
      "custom"
    );
    expect(result.mode).toBe("custom");
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
  });

  it("anchor mode uses fallback position + offsets", () => {
    const result = normalizePlacement(
      { mode: "top-center", offsetX: 5, offsetY: 10 },
      { x: 100, y: 200 },
      "header"
    );
    expect(result.mode).toBe("top-center");
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
    expect(result.offsetX).toBe(5);
    expect(result.offsetY).toBe(10);
  });

  it("defaults mode from template kind when not specified", () => {
    const result = normalizePlacement({}, { x: 0, y: 0 }, "header");
    expect(result.mode).toBe("top-center");
  });

  it("handles null input gracefully", () => {
    const result = normalizePlacement(null, null, "custom");
    expect(result.mode).toBe("custom");
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});

// ── normalizeRanges ──────────────────────────────────────────────────────

describe("normalizeRanges", () => {
  it("accepts valid ranges", () => {
    const ranges = normalizeRanges(
      [{ from: 1, to: 5, value: "A" }, { from: 6, to: 10, value: "B" }],
      "test"
    );
    expect(ranges).toHaveLength(2);
    expect(ranges[0].from).toBe(1);
    expect(ranges[1].value).toBe("B");
  });

  it("sorts ranges by from", () => {
    const ranges = normalizeRanges(
      [{ from: 6, to: 10, value: "B" }, { from: 1, to: 5, value: "A" }],
      "test"
    );
    expect(ranges[0].from).toBe(1);
    expect(ranges[1].from).toBe(6);
  });

  it("throws on non-array input (throwOnError=true)", () => {
    expect(() => normalizeRanges("not-array", "x")).toThrow();
  });

  it("returns empty on non-array input (throwOnError=false)", () => {
    expect(normalizeRanges("not-array", "x", false)).toEqual([]);
  });

  it("throws on invalid page numbers", () => {
    expect(() => normalizeRanges([{ from: 0, to: 5 }], "x")).toThrow();
    expect(() => normalizeRanges([{ from: -1, to: 5 }], "x")).toThrow();
  });

  it("throws when from > to", () => {
    expect(() => normalizeRanges([{ from: 10, to: 5 }], "x")).toThrow();
  });

  it("throws on overlapping ranges", () => {
    expect(() =>
      normalizeRanges(
        [{ from: 1, to: 5, value: "A" }, { from: 3, to: 8, value: "B" }],
        "x"
      )
    ).toThrow();
  });

  it("fills default sourcePageId and sourcePageName", () => {
    const ranges = normalizeRanges([{ from: 1, to: 3, value: "V" }], "test");
    expect(ranges[0].sourcePageId).toBeNull();
    expect(ranges[0].sourcePageName).toBe("");
  });
});

// ── normalizeVariables ───────────────────────────────────────────────────

describe("normalizeVariables", () => {
  it("accepts valid variables", () => {
    const vars = normalizeVariables([
      { name: "Title", path: [0, 1], ranges: [{ from: 1, to: 10, value: "A" }] },
    ], false);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("Title");
    expect(vars[0].path).toEqual([0, 1]);
  });

  it("returns empty for non-array input", () => {
    expect(normalizeVariables(null, false)).toEqual([]);
    expect(normalizeVariables("bad", false)).toEqual([]);
  });

  it("skips variables with invalid paths (silent mode)", () => {
    const vars = normalizeVariables([
      { name: "Bad", path: "not-array", ranges: [{ from: 1, to: 2, value: "" }] },
    ], false);
    expect(vars).toHaveLength(0);
  });

  it("skips duplicate paths (silent mode)", () => {
    const vars = normalizeVariables([
      { name: "A", path: [0], ranges: [{ from: 1, to: 2, value: "" }] },
      { name: "B", path: [0], ranges: [{ from: 3, to: 4, value: "" }] },
    ], false);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("A");
  });

  it("throws on duplicate paths (strict mode)", () => {
    expect(() => normalizeVariables([
      { name: "A", path: [0], ranges: [{ from: 1, to: 2, value: "" }] },
      { name: "B", path: [0], ranges: [{ from: 3, to: 4, value: "" }] },
    ], true)).toThrow();
  });
});

// ── normalizeTemplate ────────────────────────────────────────────────────

describe("normalizeTemplate", () => {
  it("produces valid defaults from empty input", () => {
    const tpl = normalizeTemplate("tpl-1", {});
    expect(tpl.id).toBe("tpl-1");
    expect(tpl.name).toBe("区域模板");
    expect(tpl.templateKind).toBe("custom");
    expect(tpl.pageFormat).toBe("%n");
    expect(tpl.totalMode).toBe("auto");
    expect(tpl.pageNumberStart).toBe(1);
    expect(tpl.excludedPageIds).toEqual([]);
    expect(tpl.variables).toEqual([]);
  });

  it("preserves provided values", () => {
    const tpl = normalizeTemplate("tpl-2", {
      name: "Header",
      templateKind: "header",
      nodeId: "node-123",
      pageId: "page-456",
      pageFormat: "%n / %t",
      totalMode: "custom",
      customTotal: 20,
      pageNumberStart: 3,
      excludedPageIds: ["p1", "p2"],
    });
    expect(tpl.name).toBe("Header");
    expect(tpl.templateKind).toBe("header");
    expect(tpl.nodeId).toBe("node-123");
    expect(tpl.pageFormat).toBe("%n / %t");
    expect(tpl.totalMode).toBe("custom");
    expect(tpl.customTotal).toBe(20);
    expect(tpl.pageNumberStart).toBe(3);
    expect(tpl.excludedPageIds).toEqual(["p1", "p2"]);
  });

  it("handles null/undefined gracefully", () => {
    const tpl = normalizeTemplate("tpl-3", null);
    expect(tpl.id).toBe("tpl-3");
    expect(tpl.templateKind).toBe("custom");
  });
});

// ── normalizeStorage ─────────────────────────────────────────────────────

describe("normalizeStorage", () => {
  it("produces valid defaults from empty input", () => {
    const s = normalizeStorage({});
    expect(s.templates).toEqual({});
    expect(s.templateInstanceMap).toEqual({});
    expect(s.settings.language).toBe("zh-CN");
  });

  it("normalizes templates within storage", () => {
    const s = normalizeStorage({
      templates: { "t1": { name: "Test", templateKind: "footer" } },
    });
    expect(s.templates["t1"].name).toBe("Test");
    expect(s.templates["t1"].templateKind).toBe("footer");
    expect(s.templates["t1"].id).toBe("t1");
  });

  it("preserves templateInstanceMap", () => {
    const s = normalizeStorage({
      templateInstanceMap: { "t1::p1": "inst-1" },
    });
    expect(s.templateInstanceMap["t1::p1"]).toBe("inst-1");
  });

  it("handles null input", () => {
    const s = normalizeStorage(null);
    expect(s.templates).toEqual({});
    expect(s.settings.language).toBe("zh-CN");
  });
});
