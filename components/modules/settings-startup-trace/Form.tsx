import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { SettingsStartupTraceInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("settings-startup-trace");

export default function SettingsStartupTraceForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={SettingsStartupTraceInsertSchema} />;
}
