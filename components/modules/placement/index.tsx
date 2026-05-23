import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("placement");

export default function PlacementModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
