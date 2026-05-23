import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("certificates");

export default function CertificatesModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
