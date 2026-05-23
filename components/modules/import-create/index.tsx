import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("import-create");

export default function ImportCreateModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
