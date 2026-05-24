import "@/lib/runtime-storage";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { bootstrapShellRuntime } from "@/lib/shell-runtime";
import { bootstrapMobileShellRuntime } from "@/lib/mobile-shell";
import { bootstrapRuntimeDiagnostics } from "@/lib/runtime-diagnostics";
import { bootstrapLegacyAdapterLayer } from "@/lib/legacy-adapter";
import { bootstrapStorageNormalizationLayer } from "@/lib/storage-normalization";
import { bootstrapEnterpriseOrchestration } from "@/lib/enterprise-orchestration";

bootstrapShellRuntime();
bootstrapMobileShellRuntime();
bootstrapRuntimeDiagnostics();
bootstrapLegacyAdapterLayer();
bootstrapStorageNormalizationLayer();
bootstrapEnterpriseOrchestration();

createRoot(document.getElementById("root")!).render(<App />);
