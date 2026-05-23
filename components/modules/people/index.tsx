import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("people");

export default function PeopleModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
