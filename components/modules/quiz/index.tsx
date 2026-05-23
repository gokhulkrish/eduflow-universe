import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("quiz");

export default function QuizModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
