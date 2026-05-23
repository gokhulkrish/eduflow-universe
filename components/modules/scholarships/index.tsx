import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("scholarships");

export default function ScholarshipsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
