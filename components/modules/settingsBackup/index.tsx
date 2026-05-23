import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("settingsBackup");

export default function SettingsBackupModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
