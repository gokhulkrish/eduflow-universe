import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("payroll");

export default function PayrollModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
