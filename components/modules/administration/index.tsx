import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("administration");

export default function AdministrationModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
