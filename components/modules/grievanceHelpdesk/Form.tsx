import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { GrievanceHelpdeskInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("grievanceHelpdesk");

export default function GrievanceHelpdeskForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={GrievanceHelpdeskInsertSchema} />;
}
