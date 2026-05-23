import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { AlumniInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("alumni");

export default function AlumniForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={AlumniInsertSchema} />;
}
