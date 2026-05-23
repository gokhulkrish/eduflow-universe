import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("exams");

export default function ExamsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
