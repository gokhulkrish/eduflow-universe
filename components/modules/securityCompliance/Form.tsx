import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { SecurityComplianceInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("securityCompliance");

export default function SecurityComplianceForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={SecurityComplianceInsertSchema} />;
}
