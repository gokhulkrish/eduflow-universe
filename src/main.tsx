import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapShellRuntime } from "@/lib/shell-runtime";

bootstrapShellRuntime();

createRoot(document.getElementById("root")!).render(<App />);
