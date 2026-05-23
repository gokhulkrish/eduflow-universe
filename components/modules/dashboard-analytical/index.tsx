import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("dashboard-analytical");

export default function DashboardAnalyticalModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
