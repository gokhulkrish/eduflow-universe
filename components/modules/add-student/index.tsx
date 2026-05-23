import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("add-student");

export default function AddStudentModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
