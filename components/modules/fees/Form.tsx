import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { FeesInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("fees");

export default function FeesForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={FeesInsertSchema} />;
}
