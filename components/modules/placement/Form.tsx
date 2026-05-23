import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { PlacementInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("placement");

export default function PlacementForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={PlacementInsertSchema} />;
}
