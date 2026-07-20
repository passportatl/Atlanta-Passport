import { defineConfig } from "vitest/config";
import path from "node:path";

// Standalone vitest config: the app's vite.config.ts requires PORT (dev
// server), which unit tests don't need.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
