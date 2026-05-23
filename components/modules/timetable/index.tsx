import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("timetable");

export default function TimetableModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
