import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("alumni");

export default function AlumniModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
