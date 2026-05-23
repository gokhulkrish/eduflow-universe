import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { HomeInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("home");

export default function HomeForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={HomeInsertSchema} />;
}
