import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { AttendanceInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("attendance");

export default function AttendanceForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={AttendanceInsertSchema} />;
}
