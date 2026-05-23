import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { HostelInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("hostel");

export default function HostelForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={HostelInsertSchema} />;
}
