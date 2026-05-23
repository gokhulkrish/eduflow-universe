import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { EventsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("events");

export default function EventsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={EventsInsertSchema} />;
}
