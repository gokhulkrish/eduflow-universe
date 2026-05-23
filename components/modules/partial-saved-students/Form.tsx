import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { PartialSavedStudentsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("partial-saved-students");

export default function PartialSavedStudentsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={PartialSavedStudentsInsertSchema} />;
}
