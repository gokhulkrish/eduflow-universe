import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("attendance");

export default function AttendanceModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
