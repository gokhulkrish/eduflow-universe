import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("userManagement");

export default function UserManagementModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
