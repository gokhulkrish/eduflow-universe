import { ModuleFormShell } from '../shared';
import { getModuleDefinition } from '../../../lib/module-registry';
import { VideoRoomsInsertSchema } from '../../../lib/validations';

const definition = getModuleDefinition("videoRooms");

export default function VideoRoomsForm() {
  if (!definition) return null;
  return <ModuleFormShell definition={definition} schema={VideoRoomsInsertSchema} />;
}
