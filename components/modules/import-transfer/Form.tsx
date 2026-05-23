import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { ImportTransferInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("import-transfer");

export default function ImportTransferForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={ImportTransferInsertSchema} />;
}
