import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { AddStudentInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("add-student");

export default function AddStudentForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={AddStudentInsertSchema} />;
}
