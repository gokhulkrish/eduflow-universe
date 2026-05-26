import type { ImportMatchConfig, ImportMatchStrategy, ImportTransferMode } from "./types";

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function makeBatchId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `batch_${timestamp}_${random}`;
}

export function normalizeText(value: string | null | undefined): string {
  return String(value || "").trim().substring(0, 500);
}

export function nowIso(): string {
  return new Date().toISOString();
}

const ruleToMode: Record<string, ImportTransferMode> = {
  "new entry only": "newentry",
  "update existing only": "update",
  "insert new, ignore existing": "newentry",
  "update if blank": "update",
  "overwrite always (safe)": "update",
  "overwrite including blanks": "update",
  "reject if changed": "skip",
  "skip if changed": "skip",
  newentry: "newentry",
  update: "update",
  upsert: "upsert",
  skip: "skip",
};

export function normalizeImportDefaultType(value: string | null | undefined): ImportTransferMode {
  return ruleToMode[String(value || "").toLowerCase().trim()] ?? "newentry";
}

export function normalizeImportMatchConfig(
  config: Partial<ImportMatchConfig> | null | undefined,
  strategy: ImportMatchStrategy
): ImportMatchConfig {
  if (!config || typeof config !== "object") {
    return buildDefaultImportMatchConfig(strategy);
  }
  return {
    type: config.type || "student_key",
    strategy: config.strategy || strategy || "reg_umis_emis",
    fields: Array.isArray(config.fields) ? config.fields : [],
    enabled: config.enabled !== false,
  };
}

export function cloneImportMatchConfig(
  config: ImportMatchConfig | null | undefined
): ImportMatchConfig | null {
  if (!config) return null;
  return {
    ...config,
    fields: [...(config.fields || [])],
    strategy: String(config.strategy) as ImportMatchStrategy,
  };
}

export function buildDefaultImportMatchConfig(
  strategy: ImportMatchStrategy
): ImportMatchConfig {
  const configs: Record<string, ImportMatchConfig> = {
    reg_umis_emis: {
      type: "student_key",
      strategy: "reg_umis_emis",
      fields: ["enrollmentNumber", "umisId", "emis"],
      enabled: true,
    },
    email: {
      type: "email",
      strategy: "reg_umis_emis",
      fields: ["email"],
      enabled: true,
    },
    phone: {
      type: "phone",
      strategy: "reg_umis_emis",
      fields: ["phone"],
      enabled: true,
    },
  };
  return configs[strategy] || configs.reg_umis_emis;
}

export function escapeHtml(value: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (ch) => map[ch] || ch);
}

export function normalizeLoose(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeKey(value: string): string {
  return normalizeLoose(value).replace(/\s+/g, "");
}

export function normalizeDate(value: string | null | undefined): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const slashed = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashed) {
    const [, a, b, c] = slashed;
    const year = c.length === 2 ? `20${c}` : c;
    const first = Number(a);
    const second = Number(b);
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second > 12 ? first : second;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  return new Date(parsed).toISOString().slice(0, 10);
}

export function splitFullName(value: string): { firstName: string; lastName: string } {
  const parts = normalizeLoose(value).split(" ").filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function similarity(left: string, right: string): number {
  const a = normalizeLoose(left);
  const b = normalizeLoose(right);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const max = Math.max(a.length, b.length);
  return 1 - matrix[a.length][b.length] / max;
}

export function maybeTrim(value: string | null | undefined): string {
  return String(value || "").trim();
}
