import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ExamsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("exams");

export default function ExamsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ExamsInsertSchema} />;
}
