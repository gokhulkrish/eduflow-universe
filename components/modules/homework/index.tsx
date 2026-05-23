import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("homework");

export default function HomeworkModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
