import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("import-map");

export default function ImportMapModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
