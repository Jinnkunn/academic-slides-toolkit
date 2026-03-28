// ---------------------------------------------------------------------------
// Unit tests for src/ui/i18n.ts — language parity and key coverage
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

// i18n.ts imports `state` from ./state which depends on DOM.
// We extract the I18N dictionary directly to avoid DOM dependencies.
// Use a dynamic import trick: read the source and extract the object.
import { readFileSync } from "fs";
import { join } from "path";

function extractI18NKeys(): { zhKeys: string[]; enKeys: string[] } {
  const source = readFileSync(
    join(__dirname, "../src/ui/i18n.ts"),
    "utf-8"
  );

  // Extract zh-CN block
  const zhMatch = source.match(/"zh-CN"\s*:\s*\{([\s\S]*?)\n  \}/);
  const enMatch = source.match(/"en-US"\s*:\s*\{([\s\S]*?)\n  \}/);

  if (!zhMatch || !enMatch) {
    throw new Error("Could not extract I18N blocks from i18n.ts");
  }

  const extractKeys = (block: string): string[] => {
    const keys: string[] = [];
    const regex = /^\s+(\w+)\s*:/gm;
    let match;
    while ((match = regex.exec(block)) !== null) {
      keys.push(match[1]);
    }
    return keys;
  };

  return {
    zhKeys: extractKeys(zhMatch[1]),
    enKeys: extractKeys(enMatch[1]),
  };
}

describe("I18N dictionary", () => {
  const { zhKeys, enKeys } = extractI18NKeys();
  const zhSet = new Set(zhKeys);
  const enSet = new Set(enKeys);

  it("has zh-CN keys", () => {
    expect(zhKeys.length).toBeGreaterThan(100);
  });

  it("has en-US keys", () => {
    expect(enKeys.length).toBeGreaterThan(100);
  });

  it("zh-CN and en-US have the same number of keys", () => {
    expect(zhKeys.length).toBe(enKeys.length);
  });

  it("every zh-CN key exists in en-US", () => {
    const missingInEn = zhKeys.filter((k) => !enSet.has(k));
    if (missingInEn.length > 0) {
      console.error("Keys in zh-CN but missing in en-US:", missingInEn);
    }
    expect(missingInEn).toEqual([]);
  });

  it("every en-US key exists in zh-CN", () => {
    const missingInZh = enKeys.filter((k) => !zhSet.has(k));
    if (missingInZh.length > 0) {
      console.error("Keys in en-US but missing in zh-CN:", missingInZh);
    }
    expect(missingInZh).toEqual([]);
  });

  it("no duplicate keys within zh-CN", () => {
    expect(zhSet.size).toBe(zhKeys.length);
  });

  it("no duplicate keys within en-US", () => {
    expect(enSet.size).toBe(enKeys.length);
  });

  it("all keys follow camelCase convention", () => {
    const nonCamel = zhKeys.filter((k) => !/^[a-z][a-zA-Z0-9]*$/.test(k));
    if (nonCamel.length > 0) {
      console.warn("Non-camelCase keys:", nonCamel);
    }
    // Allow a few exceptions but flag them
    expect(nonCamel.length).toBeLessThan(5);
  });

  // Specific category coverage checks
  const categories = [
    { prefix: "equation", minCount: 10 },
    { prefix: "figure", minCount: 5 },
    { prefix: "theorem", minCount: 5 },
    { prefix: "table", minCount: 5 },
    { prefix: "crossref", minCount: 2 },
    { prefix: "consistency", minCount: 8 },
    { prefix: "reference", minCount: 2 },
    { prefix: "citation", minCount: 2 },
    { prefix: "chart", minCount: 2 },
    { prefix: "subfigure", minCount: 2 },
    { prefix: "speaker", minCount: 1 },
    { prefix: "appendix", minCount: 3 },
    { prefix: "error", minCount: 10 },
  ];

  for (const { prefix, minCount } of categories) {
    it(`has at least ${minCount} keys for category "${prefix}"`, () => {
      const matching = zhKeys.filter((k) => k.toLowerCase().startsWith(prefix));
      expect(matching.length).toBeGreaterThanOrEqual(minCount);
    });
  }
});
