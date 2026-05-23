import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { QuizInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("quiz");

export default function QuizForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={QuizInsertSchema} />;
}
