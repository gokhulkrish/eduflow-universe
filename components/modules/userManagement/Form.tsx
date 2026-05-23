import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { UserManagementInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("userManagement");

export default function UserManagementForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={UserManagementInsertSchema} />;
}
