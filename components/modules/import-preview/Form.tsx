import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ImportPreviewInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("import-preview");

export default function ImportPreviewForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ImportPreviewInsertSchema} />;
}
