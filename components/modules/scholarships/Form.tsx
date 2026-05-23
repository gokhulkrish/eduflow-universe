import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ScholarshipsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("scholarships");

export default function ScholarshipsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ScholarshipsInsertSchema} />;
}
