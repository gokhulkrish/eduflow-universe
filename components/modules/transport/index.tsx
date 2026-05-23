import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("transport");

export default function TransportModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
