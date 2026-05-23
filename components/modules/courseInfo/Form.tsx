import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { CourseInfoInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("courseInfo");

export default function CourseInfoForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={CourseInfoInsertSchema} />;
}
