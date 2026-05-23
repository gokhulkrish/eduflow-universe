import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("courseInfo");

export default function CourseInfoModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
