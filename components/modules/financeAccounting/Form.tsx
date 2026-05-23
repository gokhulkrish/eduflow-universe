import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { FinanceAccountingInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("financeAccounting");

export default function FinanceAccountingForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={FinanceAccountingInsertSchema} />;
}
