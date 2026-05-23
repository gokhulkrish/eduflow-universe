import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { DocumentDmsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("documentDms");

export default function DocumentDmsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={DocumentDmsInsertSchema} />;
}
