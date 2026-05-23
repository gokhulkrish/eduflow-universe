import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("library");

export default function LibraryModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
