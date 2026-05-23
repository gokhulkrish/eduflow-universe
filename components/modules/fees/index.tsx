import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("fees");

export default function FeesModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
