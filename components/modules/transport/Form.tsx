import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { TransportInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("transport");

export default function TransportForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={TransportInsertSchema} />;
}
