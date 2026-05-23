import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ReportsAnalyticsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("reportsAnalytics");

export default function ReportsAnalyticsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ReportsAnalyticsInsertSchema} />;
}
