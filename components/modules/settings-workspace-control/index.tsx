import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("settings-workspace-control");

export default function SettingsWorkspaceControlModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
