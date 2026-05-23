import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("hostel");

export default function HostelModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
