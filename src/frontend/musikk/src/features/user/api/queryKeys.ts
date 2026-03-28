import { UUID } from "@/api/types.ts";

export const userKeys = {
    base: ["user"] as const,
    detail: (uuid: UUID) => [...userKeys.base, uuid] as const,
    friends: (uuid: UUID) => [...userKeys.base, uuid, "friends"] as const,
    followers: (uuid: UUID) => [...userKeys.base, uuid, "followers"] as const,
    followed: (uuid: UUID) => [...userKeys.base, uuid, "followed"] as const,
    collectionsPersonal: (uuid: UUID) => ["collectionsPersonal", uuid] as const,
};
