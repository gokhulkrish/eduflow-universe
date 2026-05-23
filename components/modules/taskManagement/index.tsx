import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("taskManagement");

export default function TaskManagementModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
