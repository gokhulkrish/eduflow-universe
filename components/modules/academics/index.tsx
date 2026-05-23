import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("academics");

export default function AcademicsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
