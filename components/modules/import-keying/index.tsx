import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("import-keying");

export default function ImportKeyingModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
