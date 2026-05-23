import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { MediaInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("media");

export default function MediaForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={MediaInsertSchema} />;
}
