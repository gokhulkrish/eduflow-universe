export interface AutoHeaderGroupRule {
  group: string;
  patterns: string[];
}

export const AUTO_HEADER_GROUP_RULES: AutoHeaderGroupRule[] = [
  { group: 'Basic Information', patterns: ['student name', 'name as on', 'register number', 'registration number', 'reg no', 'roll number', 'roll no', 'admission number', 'application number', 'student id', 'umis', 'emis'] },
  { group: 'Institute Information', patterns: ['college', 'campus', 'institution', 'institute', 'university', 'affiliation', 'college code', 'institution code', 'campus code'] },
  { group: 'Course Information', patterns: ['course', 'programme', 'program', 'degree', 'branch', 'department', 'specialization', 'specialisation', 'stream', 'major', 'minor', 'regulation', 'curriculum'] },
  { group: 'Academic Information', patterns: ['academic year', 'study year', 'studying year', 'year of study', 'year of admission', 'admission date', 'joining date', 'semester', 'term', 'section', 'shift', 'batch'] },
  { group: 'Family Information', patterns: ['father', 'mother', 'guardian', 'parent', 'family income', 'income certificate', 'family card'] },
  { group: 'Personal Information', patterns: ['gender', 'sex', 'date of birth', 'dob', 'birth date', 'blood group', 'religion', 'community', 'caste', 'nationality', 'mother tongue', 'disability', 'physically challenged', 'first graduate'] },
  { group: 'Contact Information', patterns: ['mobile', 'phone', 'whatsapp', 'email', 'contact', 'address', 'street', 'village', 'town', 'city', 'district', 'state', 'country', 'pincode', 'pin code', 'postal code'] },
  { group: 'Hostel Information', patterns: ['hostel', 'hosteller', 'boarding', 'residential'] },
  { group: 'Scholarship Information', patterns: ['scholarship', 'stipend', 'grant', 'fee concession', 'tuition waiver', 'beneficiary'] },
  { group: 'Banking Information', patterns: ['bank', 'account number', 'account no', 'ifsc', 'micr', 'bank branch'] },
  { group: 'Documents & Identity', patterns: ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'ration card', 'driving licence', 'transfer certificate', 'tc number', 'certificate', 'marksheet', 'mark sheet', 'document'] },
];

export function normalizeHeaderGroupingText(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferHeaderGroupFromCandidates(candidates: string[]): string {
  const hints = (Array.isArray(candidates) ? candidates : [candidates])
    .map(value => normalizeHeaderGroupingText(value))
    .filter(Boolean);
  if (!hints.length) return 'Other Information';

  for (const rule of AUTO_HEADER_GROUP_RULES) {
    const matched = hints.some(value =>
      rule.patterns.some(pattern => value.includes(pattern))
    );
    if (matched) return rule.group;
  }

  return 'Other Information';
}

export function getHeaderGroupingHints(
  header: string,
  label?: string,
  labelFromMeta?: string,
  aliases?: string[],
  metaAliases?: string[],
): string[] {
  const values = new Set([
    header,
    label,
    labelFromMeta,
    ...(aliases ?? []),
    ...(metaAliases ?? []),
  ]);
  return Array.from(values).filter(Boolean).map(v => normalizeHeaderGroupingText(v!));
}

export function inferAutomaticHeaderGroup(
  header: string,
  label?: string,
  labelFromMeta?: string,
  aliases?: string[],
  metaAliases?: string[],
): string {
  return inferHeaderGroupFromCandidates(
    getHeaderGroupingHints(header, label, labelFromMeta, aliases, metaAliases)
  );
}

export function getRequiredHeaderGroups(
  fields: { key: string; label?: string; aliases?: string[] }[],
): string[] {
  return Array.from(new Set(
    (Array.isArray(fields) ? fields : [])
      .map(f => inferAutomaticHeaderGroup(f.key, f.label, undefined, f.aliases))
      .filter(group => group && group !== 'Other Information')
  ));
}

export function findMismatchedFields(
  fields: { key: string; label?: string; groupKey: string; aliases?: string[] }[],
): { field: string; currentGroup: string; suggestedGroup: string }[] {
  const results: { field: string; currentGroup: string; suggestedGroup: string }[] = [];
  for (const f of fields) {
    const suggested = inferAutomaticHeaderGroup(f.key, f.label, undefined, f.aliases);
    if (suggested !== 'Other Information' && suggested !== f.groupKey) {
      results.push({ field: f.key, currentGroup: f.groupKey, suggestedGroup: suggested });
    }
  }
  return results;
}
