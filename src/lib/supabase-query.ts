type SupabaseQueryError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
  status?: number;
};

export function isMissingSupabaseTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as SupabaseQueryError;
  const message = [err.message, err.details, err.hint]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  return (
    err.status === 404 ||
    err.code === "PGRST205" ||
    err.code === "42P01" ||
    message.includes("could not find the table") ||
    message.includes("relation does not exist") ||
    message.includes("relation") && message.includes("does not exist") ||
    message.includes("not found")
  );
}

export function readSupabaseRows<T>(result: { data: T | null; error: unknown }, fallback: T): T {
  if (result.error) {
    if (isMissingSupabaseTableError(result.error)) return fallback;
    throw result.error;
  }

  return (result.data ?? fallback) as T;
}
