import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("settings-ai-policy");

export default function SettingsAiPolicyModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
