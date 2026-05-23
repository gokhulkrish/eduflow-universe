import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { LmsElearningInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("lmsElearning");

export default function LmsElearningForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={LmsElearningInsertSchema} />;
}
