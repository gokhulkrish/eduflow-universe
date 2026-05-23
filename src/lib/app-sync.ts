const APP_SYNC_EVENT = "sms:app-sync";

export type AppSyncDetail = {
  key: string;
};

export function emitAppSync(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppSyncDetail>(APP_SYNC_EVENT, { detail: { key } }));
}

export function subscribeAppSync(keys: string[], listener: () => void) {
  if (typeof window === "undefined") return () => {};

  const keySet = new Set(keys.filter(Boolean));

  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<AppSyncDetail>).detail;
    if (!detail?.key || keySet.has(detail.key)) listener();
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (!event.key || keySet.has(event.key)) listener();
  };

  window.addEventListener(APP_SYNC_EVENT, handleCustomEvent as EventListener);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(APP_SYNC_EVENT, handleCustomEvent as EventListener);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
