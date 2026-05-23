import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("healthWellbeing");

export default function HealthWellbeingModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
