import { UUID } from "@/api/types.ts";

export const friendActivityKeys = {
    base: ["friend-activity"] as const,
    listening: (userUUID: UUID) => [...friendActivityKeys.base, "listening", userUUID] as const,
};
