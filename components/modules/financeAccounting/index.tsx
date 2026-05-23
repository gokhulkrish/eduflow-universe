import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("financeAccounting");

export default function FinanceAccountingModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
