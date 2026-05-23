import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { RegisteredStudentsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("registered-students");

export default function RegisteredStudentsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={RegisteredStudentsInsertSchema} />;
}
