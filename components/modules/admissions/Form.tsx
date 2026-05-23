import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { AdmissionsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("admissions");

export default function AdmissionsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={AdmissionsInsertSchema} />;
}
