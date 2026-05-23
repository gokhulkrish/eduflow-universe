import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("procurementAssets");

export default function ProcurementAssetsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
