import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ImportKeyingInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("import-keying");

export default function ImportKeyingForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ImportKeyingInsertSchema} />;
}
