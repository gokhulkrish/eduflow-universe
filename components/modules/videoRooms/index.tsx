import { ModuleCardShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';

const definition = getModuleDefinition("videoRooms");

export default function VideoRoomsModuleCard() {
  if (!definition) return null;
  return <ModuleCardShell definition={definition} />;
}
