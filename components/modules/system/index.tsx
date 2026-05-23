import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("system");

export default function SystemModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
