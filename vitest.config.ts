import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "lib/**/*.{test,spec}.{ts,tsx}", "legacy/**/*.{test,spec}.{ts,tsx}", "core/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "legacy/**/*.{ts,tsx}", "core/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "lib/**/*.{test,spec}.{ts,tsx}",
        "src/components/ui/**",
        "src/integrations/**",
        "src/test/**",
        "**/*.d.ts",
        "**/types.ts",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
