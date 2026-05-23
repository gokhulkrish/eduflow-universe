import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("home");

export default function HomeModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
