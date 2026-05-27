const retrying = new Set<string>();

function retryImport(url: string) {
  if (retrying.has(url)) return;
  retrying.add(url);

  let retries = 0;
  const maxRetries = 20;

  const attempt = () => {
    import(/* @vite-ignore */ url)
      .then(() => {
        retrying.delete(url);
      })
      .catch(() => {
        if (retries < maxRetries) {
          retries++;
          const delay = Math.min(1000 * 1.5 ** (retries - 1), 10000);
          setTimeout(attempt, delay);
        } else {
          retrying.delete(url);
        }
      });
  };

  attempt();
}

const IMPORT_FAILURE_RE = /Failed to fetch dynamically imported module: (.+)/;

export function bootstrapImportRetry() {
  if (typeof window === "undefined") return;
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message ?? "";
    const match = msg.match(IMPORT_FAILURE_RE);
    if (match) {
      event.preventDefault();
      retryImport(match[1]);
    }
  });
}
