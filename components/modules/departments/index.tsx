import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("departments");

export default function DepartmentsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
