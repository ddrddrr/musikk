import { ApiSchemas } from "@/api/types.ts";
import { ConnectionType } from "@/features/user/types.ts";

export type CollectionType = ApiSchemas["CollectionTypeEnum"];

export interface CollectionListParams {
    type?: CollectionType;
    connection?: ConnectionType;
    author?: string;
    limit?: number;
    offset?: number;
}

export type Collection = ApiSchemas["CollectionSerializerBasic"] & { kind?: "collection" };

export type CollectionSong = ApiSchemas["CollectionSongRetrieve"] & { kind?: "collectionSong" };

export type CollectionDetailed = ApiSchemas["CollectionSerializerDetailed"];

export type CreatedCollection = ApiSchemas["CollectionCreate"];
