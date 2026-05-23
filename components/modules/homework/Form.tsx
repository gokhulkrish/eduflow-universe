import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { HomeworkInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("homework");

export default function HomeworkForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={HomeworkInsertSchema} />;
}
