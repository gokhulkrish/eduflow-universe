import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ImportValidationInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("import-validation");

export default function ImportValidationForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ImportValidationInsertSchema} />;
}
