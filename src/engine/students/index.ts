export type {
  StudentRecord,
  StudentIdentity,
  StudentPersonal,
  StudentAcademic,
  StudentFamily,
  StudentContact,
  StudentAdministrative,
} from './types';

export {
  isComplete,
  getDisplayName,
} from './helpers';

export { createStudent, updateStudent, deactivateStudent, bulkTransfer } from '../../core/students/service';
export type { CreateStudentInput, UpdateStudentInput, DeactivateStudentInput } from '../../core/students/service';

export type { StudentListFilter, StudentListItemDTO, StudentDetailDTO } from '../../core/students/dto';

export { fetchStudentRegister, fetchStudentFormValues, saveStudentRecord, deleteStudentRecord } from '../../lib/student-records';
export type { StudentFormValues, StudentRegisterRow, SectionDef } from '../../lib/student-records';
