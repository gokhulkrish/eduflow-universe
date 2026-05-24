export type DuplicateDecision =
  | 'keep_existing'
  | 'update_existing'
  | 'create_new'
  | 'merge_manual'
  | 'skip';

export interface MatchedRecord {
  id: string;
  score?: number;
  matchReason?: string;
}

export function classifyDuplicate(
  row: Record<string, unknown>,
  matches: MatchedRecord[],
): { status: 'new' | 'matched' | 'duplicate'; decision: DuplicateDecision; matchedId?: string; candidates?: MatchedRecord[] } {
  if (!matches.length) {
    return { status: 'new', decision: 'create_new' };
  }
  if (matches.length === 1) {
    return { status: 'matched', decision: 'update_existing', matchedId: matches[0].id };
  }
  return { status: 'duplicate', decision: 'merge_manual', candidates: matches };
}
