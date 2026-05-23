import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { PayrollInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("payroll");

export default function PayrollForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={PayrollInsertSchema} />;
}
