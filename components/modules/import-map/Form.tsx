import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ImportMapInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("import-map");

export default function ImportMapForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ImportMapInsertSchema} />;
}
