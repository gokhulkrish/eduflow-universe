import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { SystemInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("system");

export default function SystemForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={SystemInsertSchema} />;
}
