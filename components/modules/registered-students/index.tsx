import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("registered-students");

export default function RegisteredStudentsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
