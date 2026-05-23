import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { TimetableInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("timetable");

export default function TimetableForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={TimetableInsertSchema} />;
}
