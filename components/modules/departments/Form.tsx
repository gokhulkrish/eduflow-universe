import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { DepartmentsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("departments");

export default function DepartmentsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={DepartmentsInsertSchema} />;
}
