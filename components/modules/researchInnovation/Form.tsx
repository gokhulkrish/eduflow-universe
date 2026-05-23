import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ResearchInnovationInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("researchInnovation");

export default function ResearchInnovationForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ResearchInnovationInsertSchema} />;
}
