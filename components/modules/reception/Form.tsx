import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ReceptionInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("reception");

export default function ReceptionForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ReceptionInsertSchema} />;
}
