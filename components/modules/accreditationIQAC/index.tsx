import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("accreditationIQAC");

export default function AccreditationIQACModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
