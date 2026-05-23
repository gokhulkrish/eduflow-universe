import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { DashboardDataProcessingInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("dashboard-data-processing");

export default function DashboardDataProcessingForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={DashboardDataProcessingInsertSchema} />;
}
