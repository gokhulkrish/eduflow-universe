import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("import-preview");

export default function ImportPreviewModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
