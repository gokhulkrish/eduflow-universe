import {
  getAnnouncements,
  getPolls,
  getDeliveryStats,
  type Announcement,
  type Poll,
} from "../../src/lib/comms";

export type LegacyCommsFilter = {
  type?: "announcement" | "poll";
  limit?: number;
};

export type LegacyCommsResult = {
  announcements: Announcement[];
  polls: Poll[];
  total: number;
};

export async function listCommsLegacy(filter: LegacyCommsFilter = {}): Promise<LegacyCommsResult> {
  const limit = filter.limit ?? 20;
  const [announcements, polls] = await Promise.all([
    filter.type && filter.type !== "announcement" ? [] : getAnnouncements(),
    filter.type && filter.type !== "poll" ? [] : getPolls(),
  ]);

  return {
    announcements: announcements.slice(0, limit),
    polls: polls.slice(0, limit),
    total: announcements.length + polls.length,
  };
}

export { getDeliveryStats };
