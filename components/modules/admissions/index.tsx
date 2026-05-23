import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("admissions");

export default function AdmissionsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
