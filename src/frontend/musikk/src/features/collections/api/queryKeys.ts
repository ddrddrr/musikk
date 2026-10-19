import { UUID } from "@/api/types.ts";
import { CollectionListParams } from "@/features/collections/types.ts";

export const collectionKeys = {
    base: ["collections"] as const,
    latest: (params: CollectionListParams) => [...collectionKeys.base, "latest", params] as const,
    details: () => [...collectionKeys.base, "detail"] as const,
    detail: (uuid: UUID) => [...collectionKeys.details(), uuid] as const,
    byAuthor: (authorUUID: UUID, type: string) =>
        [...collectionKeys.base, "by-author", authorUUID, type] as const,
};
