import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("media");

export default function MediaModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
