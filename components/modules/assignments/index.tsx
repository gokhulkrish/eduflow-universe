import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("assignments");

export default function AssignmentsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
