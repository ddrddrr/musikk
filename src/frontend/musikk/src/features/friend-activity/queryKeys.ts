import { UUID } from "@/api/types.ts";

export const friendActivityKeys = {
    listening: (userUUID: UUID) => ["friend-activity", "listening", userUUID] as const,
    latestAdded: (userUUID: UUID) => ["friend-activity", "latest-added", userUUID] as const,
};
