import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { LibraryInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("library");

export default function LibraryForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={LibraryInsertSchema} />;
}
