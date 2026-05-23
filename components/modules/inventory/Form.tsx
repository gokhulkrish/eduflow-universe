import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { InventoryInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("inventory");

export default function InventoryForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={InventoryInsertSchema} />;
}
