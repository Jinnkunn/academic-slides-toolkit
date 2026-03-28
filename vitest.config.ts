import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      // Stub out Figma globals for plugin-side modules
      "./errors": "./src/plugin/errors.ts",
    },
  },
});
