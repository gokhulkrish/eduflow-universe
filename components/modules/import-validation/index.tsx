import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("import-validation");

export default function ImportValidationModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
