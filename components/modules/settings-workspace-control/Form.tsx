import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { SettingsWorkspaceControlInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("settings-workspace-control");

export default function SettingsWorkspaceControlForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={SettingsWorkspaceControlInsertSchema} />;
}
