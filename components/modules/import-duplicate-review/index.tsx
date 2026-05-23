import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("import-duplicate-review");

export default function ImportDuplicateReviewModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
