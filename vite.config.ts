import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
const hmrHost = process.env.VITE_HMR_HOST?.trim();

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      protocol: "ws",
      ...(hmrHost ? { host: hmrHost } : {}),
      port: process.env.VITE_HMR_PORT ? parseInt(process.env.VITE_HMR_PORT) : 3000,
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router-dom") || id.includes("/react-dom") || id.includes("/react/")) return "vendor";
            if (id.includes("@tanstack/react-query")) return "query";
            if (id.includes("recharts")) return "charts";
            if (
              id.includes("@radix-ui/react-dialog") ||
              id.includes("@radix-ui/react-dropdown-menu") ||
              id.includes("@radix-ui/react-popover") ||
              id.includes("@radix-ui/react-select") ||
              id.includes("@radix-ui/react-tabs") ||
              id.includes("@radix-ui/react-tooltip") ||
              id.includes("@radix-ui/react-toast") ||
              id.includes("@radix-ui/react-switch")
            ) {
              return "ui";
            }
            if (id.includes("@supabase/supabase-js")) return "supabase";
            if (id.includes("jspdf")) return "jspdf";
            if (id.includes("html2canvas")) return "html2canvas";
            if (id.includes("xlsx")) return "xlsx";
          }

          const normalized = id.replace(/\\/g, "/");
          if (normalized.includes("/src/lib/import-engine/")) return "import-engine";
          if (normalized.includes("/src/lib/")) return "lib";
          if (normalized.includes("/src/components/")) return "components";
          if (normalized.includes("/src/hooks/")) return "hooks";
          return undefined;
        },
      },
    },
  },
}));
