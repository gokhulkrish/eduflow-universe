import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ChatInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("chat");

export default function ChatForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ChatInsertSchema} />;
}
