import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("settings-startup-trace");

export default function SettingsStartupTraceModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
