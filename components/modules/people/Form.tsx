import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { PeopleInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("people");

export default function PeopleForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={PeopleInsertSchema} />;
}
