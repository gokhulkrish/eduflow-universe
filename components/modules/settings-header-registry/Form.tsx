import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { SettingsHeaderRegistryInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("settings-header-registry");

export default function SettingsHeaderRegistryForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={SettingsHeaderRegistryInsertSchema} />;
}
