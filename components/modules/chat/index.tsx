import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("chat");

export default function ChatModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
