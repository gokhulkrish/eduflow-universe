import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { CollegeInfoInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("collegeInfo");

export default function CollegeInfoForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={CollegeInfoInsertSchema} />;
}
