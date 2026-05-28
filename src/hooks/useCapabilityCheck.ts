import { useState } from "react";
import {
  loadCapabilityProfiles,
  can,
  type CapabilityKey,
  type ProfileId,
} from "@/lib/capability-profiles";

export function useCapabilityCheck(profileId: ProfileId | null) {
  const [profiles] = useState(() => loadCapabilityProfiles());

  const check = (moduleKey: string, capability: CapabilityKey): boolean => {
    if (!profileId) return false;
    return can(profiles, profileId, moduleKey, capability);
  };

  return { check, profiles, profileId };
}
