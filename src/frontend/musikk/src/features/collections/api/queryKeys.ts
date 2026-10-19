import { UUID } from "@/api/types.ts";

export const collectionKeys = {
    base: ["collections"] as const,
    latest: (type: string) => [...collectionKeys.base, "latest", type] as const,
    details: () => [...collectionKeys.base, "detail"] as const,
    detail: (uuid: UUID) => [...collectionKeys.details(), uuid] as const,
    byAuthor: (authorUUID: UUID, type: string) =>
        [...collectionKeys.base, "by-author", authorUUID, type] as const,
};
