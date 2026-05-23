import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("securityCompliance");

export default function SecurityComplianceModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
