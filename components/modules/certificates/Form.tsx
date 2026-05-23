import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { CertificatesInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("certificates");

export default function CertificatesForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={CertificatesInsertSchema} />;
}
