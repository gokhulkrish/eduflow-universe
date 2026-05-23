import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("reportsAnalytics");

export default function ReportsAnalyticsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
