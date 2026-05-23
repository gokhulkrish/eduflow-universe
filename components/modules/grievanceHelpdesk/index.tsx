import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("grievanceHelpdesk");

export default function GrievanceHelpdeskModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
