import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ImportDuplicateReviewInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("import-duplicate-review");

export default function ImportDuplicateReviewForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ImportDuplicateReviewInsertSchema} />;
}
