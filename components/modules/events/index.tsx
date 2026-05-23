import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("events");

export default function EventsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
