import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { SettingsAiPolicyInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("settings-ai-policy");

export default function SettingsAiPolicyForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={SettingsAiPolicyInsertSchema} />;
}
