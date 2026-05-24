// Patch 00 — Skeleton. Stub for legacy fee compatibility.
// Fees are already 100% migrated via src/lib/fees.ts.

export interface LegacyFeeFilter {
  studentId?: string;
  status?: string;
  dueDate?: string;
}

export interface LegacyFeeSummary {
  studentId: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  status: string;
}

export async function getFeesLegacyCompatible(
  _filter: LegacyFeeFilter,
): Promise<LegacyFeeSummary[]> {
  throw new Error("getFeesLegacyCompatible: not implemented — fees use native module directly");
}
