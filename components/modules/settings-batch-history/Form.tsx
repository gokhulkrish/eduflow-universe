import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { SettingsBatchHistoryInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("settings-batch-history");

export default function SettingsBatchHistoryForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={SettingsBatchHistoryInsertSchema} />;
}
