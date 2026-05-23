import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { CommunicationInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("communication");

export default function CommunicationForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={CommunicationInsertSchema} />;
}
