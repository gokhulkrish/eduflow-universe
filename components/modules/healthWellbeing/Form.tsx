import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { HealthWellbeingInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("healthWellbeing");

export default function HealthWellbeingForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={HealthWellbeingInsertSchema} />;
}
