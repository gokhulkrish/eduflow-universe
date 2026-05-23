import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { DashboardAnalyticalInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("dashboard-analytical");

export default function DashboardAnalyticalForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={DashboardAnalyticalInsertSchema} />;
}
