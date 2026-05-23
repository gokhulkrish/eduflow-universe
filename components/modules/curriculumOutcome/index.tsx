import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("curriculumOutcome");

export default function CurriculumOutcomeModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
