import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { AdministrationInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("administration");

export default function AdministrationForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={AdministrationInsertSchema} />;
}
