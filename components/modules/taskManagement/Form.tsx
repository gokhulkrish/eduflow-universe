import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { TaskManagementInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("taskManagement");

export default function TaskManagementForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={TaskManagementInsertSchema} />;
}
