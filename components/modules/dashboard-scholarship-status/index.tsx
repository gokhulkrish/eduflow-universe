import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("dashboard-scholarship-status");

export default function DashboardScholarshipStatusModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
