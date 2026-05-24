import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { clearRuntimeDiagnostics, recordRuntimeError, recordRuntimeRecovery, getRuntimeDiagnostics } from "@/lib/runtime-diagnostics";
import { clearShellRuntimeStorage } from "@/lib/shell-runtime";
import { clearThemeRuntimeStorage } from "@/lib/theme-runtime";
import { buildRuntimeResilienceSnapshot, recordRuntimeAudit } from "@/lib/runtime-resilience";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    recordRuntimeError(error, "error-boundary");
  }

  render() {
    if (!this.state.error) return this.props.children;
    const diagnostics = getRuntimeDiagnostics();
    const resilience = buildRuntimeResilienceSnapshot();
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="max-w-2xl rounded-2xl border border-border/60 bg-card/80 p-6 shadow-elegant">
          <p className="text-sm font-medium text-destructive">Something went wrong</p>
          <p className="mt-2 max-w-md text-xs text-muted-foreground">{this.state.error.message}</p>
          <div className="mt-4 grid gap-2 text-left text-[11px] text-muted-foreground sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-background/70 p-3">
              <p className="font-medium text-foreground">Recent diagnostics</p>
              <p>{diagnostics.entries.length} entries captured</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/70 p-3">
              <p className="font-medium text-foreground">Latest source</p>
              <p>{diagnostics.entries[0]?.source ?? "n/a"}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/70 p-3">
              <p className="font-medium text-foreground">Resilience status</p>
              <p className="capitalize">{resilience.status}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/70 p-3">
              <p className="font-medium text-foreground">Retry attempts</p>
              <p>{resilience.summary.retries}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                recordRuntimeRecovery("error-boundary", "Retry requested");
                recordRuntimeAudit("error-boundary", "User requested retry", this.state.error.message);
                this.setState({ error: null });
              }}
            >
              Try again
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                clearRuntimeDiagnostics();
                recordRuntimeRecovery("error-boundary", "Recovery reset requested");
                recordRuntimeAudit("error-boundary", "User requested reset", this.state.error.message);
                clearShellRuntimeStorage();
                clearThemeRuntimeStorage();
                window.location.reload();
              }}
            >
              Reset runtime
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
