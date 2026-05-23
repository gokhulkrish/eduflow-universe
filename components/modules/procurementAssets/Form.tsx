import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ProcurementAssetsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("procurementAssets");

export default function ProcurementAssetsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ProcurementAssetsInsertSchema} />;
}
