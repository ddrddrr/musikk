import { UUID } from "@/api/types.ts";

export const collectionKeys = {
    base: ["collections"] as const,
    latest: (type: string) => [...collectionKeys.base, type, "latest"] as const,
    detail: (uuid: UUID) => ["openCollection", uuid] as const,
    byAuthor: (authorUUID: UUID, type: string) =>
        [...collectionKeys.base, "byAuthor", authorUUID, type] as const,
};
