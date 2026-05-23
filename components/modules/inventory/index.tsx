import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("inventory");

export default function InventoryModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
