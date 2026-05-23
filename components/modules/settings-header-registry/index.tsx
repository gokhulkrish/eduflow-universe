import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("settings-header-registry");

export default function SettingsHeaderRegistryModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
