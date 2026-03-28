// ---------------------------------------------------------------------------
// Unit tests for src/plugin/errors.ts
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { createPluginError } from "../src/plugin/errors";
import type { PluginError } from "../src/plugin/errors";

describe("createPluginError", () => {
  it("creates an Error with message", () => {
    const err = createPluginError("errorTest", "Something went wrong");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Something went wrong");
  });

  it("attaches errorKey", () => {
    const err = createPluginError("errorNodeNotFound", "Node missing");
    expect(err.errorKey).toBe("errorNodeNotFound");
  });

  it("attaches errorVars", () => {
    const err = createPluginError("errorVarInvalidRange", "Invalid", { name: "Title", index: 2 });
    expect(err.errorVars).toEqual({ name: "Title", index: 2 });
  });

  it("defaults errorVars to empty object", () => {
    const err = createPluginError("errorTest", "Test");
    expect(err.errorVars).toEqual({});
  });

  it("can be caught as a standard Error", () => {
    try {
      throw createPluginError("errorTest", "Boom");
    } catch (e: any) {
      expect(e.message).toBe("Boom");
      expect(e.errorKey).toBe("errorTest");
    }
  });

  it("has a proper stack trace", () => {
    const err = createPluginError("errorTest", "Stack test");
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain("Stack test");
  });
});
