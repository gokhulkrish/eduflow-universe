import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { AccreditationIQACInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("accreditationIQAC");

export default function AccreditationIQACForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={AccreditationIQACInsertSchema} />;
}
