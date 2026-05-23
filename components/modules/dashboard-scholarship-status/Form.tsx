import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { DashboardScholarshipStatusInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("dashboard-scholarship-status");

export default function DashboardScholarshipStatusForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={DashboardScholarshipStatusInsertSchema} />;
}
