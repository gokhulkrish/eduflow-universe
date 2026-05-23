import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("lmsElearning");

export default function LmsElearningModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
