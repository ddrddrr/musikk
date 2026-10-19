import { UUID } from "@/api/types.ts";

export const userKeys = {
    base: ["user"] as const,
    me: () => [...userKeys.base, "me"] as const,
    detail: (uuid: UUID) => [...userKeys.base, "detail", uuid] as const,
    friends: (uuid: UUID) => [...userKeys.base, "friends", uuid] as const,
    followers: (uuid: UUID) => [...userKeys.base, "followers", uuid] as const,
    followed: (uuid: UUID) => [...userKeys.base, "followed", uuid] as const,
    libraries: () => [...userKeys.base, "library"] as const,
    library: (uuid: UUID) => [...userKeys.libraries(), uuid] as const,
    likedSongs: () => [...userKeys.base, "liked-songs"] as const,
    likedCollections: () => [...userKeys.base, "liked-collections"] as const,
};
