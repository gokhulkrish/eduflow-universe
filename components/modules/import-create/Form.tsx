import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ImportCreateInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("import-create");

export default function ImportCreateForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ImportCreateInsertSchema} />;
}
