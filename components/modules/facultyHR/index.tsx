import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("facultyHR");

export default function FacultyHRModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
