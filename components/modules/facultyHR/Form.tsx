import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { FacultyHRInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("facultyHR");

export default function FacultyHRForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={FacultyHRInsertSchema} />;
}
