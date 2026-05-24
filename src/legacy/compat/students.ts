export {
  queryLegacyStudentRegister,
  getLegacyStudentById,
} from "../../../legacy/compat/studentReadAdapter";
export type { LegacyStudentQuery, LegacyStudentResponse } from "../../../legacy/compat/studentReadAdapter";

export {
  legacyListStudents,
  legacyGetStudentById,
} from "./studentsReadAdapter";
export type { LegacyStudentRow, LegacyStudentDetail } from "./studentsReadAdapter";
