import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("communication");

export default function CommunicationModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
