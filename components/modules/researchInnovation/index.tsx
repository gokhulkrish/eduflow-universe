import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("researchInnovation");

export default function ResearchInnovationModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
