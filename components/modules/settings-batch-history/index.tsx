import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("settings-batch-history");

export default function SettingsBatchHistoryModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
