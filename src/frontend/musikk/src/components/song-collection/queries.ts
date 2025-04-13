import { ISongCollectionDetailed } from "@/components/song-collection/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CollectionURLs } from "@/config/endpoints.ts";

export async function fetchCollectionList(): Promise<ISongCollectionDetailed[]> {
    const response = await api.get(CollectionURLs.collectionList);
    return response.data;
}

export async function fetchCollectionDetailed(collectionUUID: string): Promise<ISongCollectionDetailed> {
    const response = await api.get(CollectionURLs.collectionDetailed(collectionUUID));
    return response.data;
}
