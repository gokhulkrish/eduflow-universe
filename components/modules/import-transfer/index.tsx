import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("import-transfer");

export default function ImportTransferModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
