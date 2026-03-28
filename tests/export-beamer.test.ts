// ---------------------------------------------------------------------------
// Unit tests for src/plugin/export-beamer.ts — pure logic functions
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { escapeLatex, generateBibContent } from "../src/plugin/export-beamer";
import type { ReferenceEntry } from "../src/plugin/references";

// ── escapeLatex ──────────────────────────────────────────────────────────

describe("escapeLatex", () => {
  it("escapes ampersand", () => {
    expect(escapeLatex("A & B")).toBe("A \\& B");
  });

  it("escapes percent", () => {
    expect(escapeLatex("100% done")).toBe("100\\% done");
  });

  it("escapes dollar sign", () => {
    expect(escapeLatex("$10")).toBe("\\$10");
  });

  it("escapes hash", () => {
    expect(escapeLatex("#1")).toBe("\\#1");
  });

  it("escapes underscore", () => {
    expect(escapeLatex("my_var")).toBe("my\\_var");
  });

  it("escapes curly braces", () => {
    expect(escapeLatex("{x}")).toBe("\\{x\\}");
  });

  it("escapes tilde", () => {
    expect(escapeLatex("~")).toBe("\\textasciitilde{}");
  });

  it("escapes caret", () => {
    expect(escapeLatex("^")).toBe("\\textasciicircum{}");
  });

  it("escapes backslash", () => {
    expect(escapeLatex("\\")).toBe("\\textbackslash{}");
  });

  it("handles multiple special chars", () => {
    expect(escapeLatex("A & B $10 #1")).toBe("A \\& B \\$10 \\#1");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeLatex("Hello World 123")).toBe("Hello World 123");
  });

  it("handles empty string", () => {
    expect(escapeLatex("")).toBe("");
  });

  it("handles unicode text (CJK)", () => {
    expect(escapeLatex("你好世界")).toBe("你好世界");
  });
});

// ── generateBibContent ───────────────────────────────────────────────────

describe("generateBibContent", () => {
  it("uses raw BibTeX when available", () => {
    const refs: ReferenceEntry[] = [
      {
        id: "r1", key: "smith2024", authors: "Smith, J.", title: "A Paper",
        year: "2024", venue: "Nature", doi: "", url: "", type: "article",
        raw: "@article{smith2024,\n  author = {Smith, J.},\n  title = {A Paper},\n  year = {2024}\n}",
      },
    ];
    const bib = generateBibContent(refs);
    expect(bib).toContain("@article{smith2024,");
    expect(bib).toContain("author = {Smith, J.}");
  });

  it("constructs BibTeX when raw is empty", () => {
    const refs: ReferenceEntry[] = [
      {
        id: "r2", key: "doe2023", authors: "Doe, A.", title: "Another Paper",
        year: "2023", venue: "Science", doi: "10.1234/test", url: "", type: "inproceedings",
        raw: "",
      },
    ];
    const bib = generateBibContent(refs);
    expect(bib).toContain("@inproceedings{doe2023,");
    expect(bib).toContain("author = {Doe, A.}");
    expect(bib).toContain("title = {Another Paper}");
    expect(bib).toContain("year = {2023}");
    expect(bib).toContain("doi = {10.1234/test}");
  });

  it("handles empty references array", () => {
    expect(generateBibContent([])).toBe("");
  });

  it("handles multiple references", () => {
    const refs: ReferenceEntry[] = [
      { id: "r1", key: "a", authors: "A", title: "T1", year: "2020", venue: "", doi: "", url: "", type: "article", raw: "" },
      { id: "r2", key: "b", authors: "B", title: "T2", year: "2021", venue: "", doi: "", url: "", type: "article", raw: "" },
    ];
    const bib = generateBibContent(refs);
    expect(bib).toContain("@article{a,");
    expect(bib).toContain("@article{b,");
  });

  it("omits empty fields in constructed BibTeX", () => {
    const refs: ReferenceEntry[] = [
      { id: "r1", key: "x", authors: "", title: "Only Title", year: "", venue: "", doi: "", url: "", type: "misc", raw: "" },
    ];
    const bib = generateBibContent(refs);
    expect(bib).toContain("@misc{x,");
    expect(bib).toContain("title = {Only Title}");
    expect(bib).not.toContain("author");
    expect(bib).not.toContain("year");
  });
});
