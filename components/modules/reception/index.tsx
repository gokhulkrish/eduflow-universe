import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("reception");

export default function ReceptionModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
