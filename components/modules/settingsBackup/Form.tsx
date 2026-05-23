import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { SettingsBackupInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("settingsBackup");

export default function SettingsBackupForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={SettingsBackupInsertSchema} />;
}
