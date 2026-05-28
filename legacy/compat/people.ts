import { fetchStudentRegister, type StudentRegisterRow } from "../../src/lib/student-records";

export type LegacyPeopleFilter = {
  search?: string;
  grade?: string;
  section?: string;
  status?: string;
};

export async function listPeopleLegacy(filter: LegacyPeopleFilter = {}): Promise<StudentRegisterRow[]> {
  const all = await fetchStudentRegister();
  let filtered = all;

  if (filter.search) {
    const term = filter.search.toLowerCase();
    filtered = filtered.filter((p) =>
      p.display_name.toLowerCase().includes(term) ||
      p.admission_no.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  }

  if (filter.grade) filtered = filtered.filter((p) => p.grade === filter.grade);
  if (filter.section) filtered = filtered.filter((p) => p.section === filter.section);
  if (filter.status) filtered = filtered.filter((p) => p.status === filter.status);

  return filtered;
}
