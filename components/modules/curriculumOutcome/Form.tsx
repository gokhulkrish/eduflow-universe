import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { CurriculumOutcomeInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("curriculumOutcome");

export default function CurriculumOutcomeForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={CurriculumOutcomeInsertSchema} />;
}
