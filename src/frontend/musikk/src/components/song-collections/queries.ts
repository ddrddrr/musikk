import { ISongCollection, ISongCollectionDetailed } from "@/components/song-collections/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CollectionURLs } from "@/config/endpoints.ts";

export async function fetchCollectionsLatest(): Promise<ISongCollection[]> {
    const response = await api.get(CollectionURLs.collectionLatest);
    return response.data;
}

export async function fetchCollectionsPersonal(): Promise<ISongCollection[]> {
    const response = await api.get(CollectionURLs.collectionPersonal);
    return response.data;
}

export async function fetchCollectionDetailed(collectionUUID: string): Promise<ISongCollectionDetailed> {
    const response = await api.get(CollectionURLs.collectionDetail(collectionUUID));
    return response.data;
}
