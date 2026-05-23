import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("collegeInfo");

export default function CollegeInfoModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
