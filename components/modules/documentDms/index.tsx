import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("documentDms");

export default function DocumentDmsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
