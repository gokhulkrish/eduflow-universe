import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("partial-saved-students");

export default function PartialSavedStudentsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
