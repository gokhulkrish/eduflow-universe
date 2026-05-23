import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { AssignmentsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("assignments");

export default function AssignmentsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={AssignmentsInsertSchema} />;
}
