import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("dashboard-data-processing");

export default function DashboardDataProcessingModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
