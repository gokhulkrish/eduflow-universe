import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { AcademicsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("academics");

export default function AcademicsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={AcademicsInsertSchema} />;
}
