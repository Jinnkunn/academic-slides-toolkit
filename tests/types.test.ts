// ---------------------------------------------------------------------------
// Unit tests for src/plugin/types.ts — AcademicNodeKind registry
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import {
  AcademicNodeKind,
  ACADEMIC_NODE_KINDS,
} from "../src/plugin/types";
import type { AcademicNodeKindValue } from "../src/plugin/types";

describe("AcademicNodeKind", () => {
  it("has all 11 expected node kinds", () => {
    expect(Object.keys(AcademicNodeKind)).toHaveLength(11);
  });

  it("maps to correct string values", () => {
    expect(AcademicNodeKind.Equation).toBe("equation");
    expect(AcademicNodeKind.Figure).toBe("figure");
    expect(AcademicNodeKind.Table).toBe("table");
    expect(AcademicNodeKind.Theorem).toBe("theorem");
    expect(AcademicNodeKind.Crossref).toBe("crossref");
    expect(AcademicNodeKind.Citation).toBe("citation");
    expect(AcademicNodeKind.Chart).toBe("chart");
    expect(AcademicNodeKind.Subfigure).toBe("subfigure");
    expect(AcademicNodeKind.Appendix).toBe("appendix");
    expect(AcademicNodeKind.AppendixLink).toBe("appendix-link");
    expect(AcademicNodeKind.SlideTemplate).toBe("slide-template");
  });

  it("all values are unique", () => {
    const values = Object.values(AcademicNodeKind);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("values are lowercase/kebab-case strings", () => {
    for (const value of Object.values(AcademicNodeKind)) {
      expect(value).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});

describe("ACADEMIC_NODE_KINDS", () => {
  it("is a Set containing all kind values", () => {
    expect(ACADEMIC_NODE_KINDS).toBeInstanceOf(Set);
    expect(ACADEMIC_NODE_KINDS.size).toBe(11);
  });

  it("contains every AcademicNodeKind value", () => {
    for (const value of Object.values(AcademicNodeKind)) {
      expect(ACADEMIC_NODE_KINDS.has(value)).toBe(true);
    }
  });

  it("does not contain unknown values", () => {
    expect(ACADEMIC_NODE_KINDS.has("unknown")).toBe(false);
    expect(ACADEMIC_NODE_KINDS.has("")).toBe(false);
  });
});

describe("AcademicNodeKindValue type", () => {
  it("can be used for runtime type narrowing", () => {
    const testValue: AcademicNodeKindValue = "equation";
    expect(ACADEMIC_NODE_KINDS.has(testValue)).toBe(true);
  });
});
