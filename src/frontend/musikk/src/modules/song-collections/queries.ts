import { api_client } from "@/api/axiosConf.ts";
import { CollectionURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { ISongCollection, ISongCollectionDetailed } from "@/modules/song-collections/types.ts";

export async function fetchCollectionsLatest(): Promise<ISongCollection[]> {
    const response = await api_client.get(CollectionURLs.collectionLatest);
    return response.data;
}

interface IFetchCollectionsPersonalParams {
    history: ISongCollection;
    liked_songs: ISongCollection;
    followed_collections: ISongCollection[];
}

export async function fetchCollectionsPersonal(userUUID: UUID): Promise<IFetchCollectionsPersonalParams> {
    const response = await api_client.get(CollectionURLs.collectionPersonal(userUUID));
    return response.data;
}

export async function fetchCollectionDetailed(collectionUUID: string): Promise<ISongCollectionDetailed> {
    const response = await api_client.get(CollectionURLs.collectionDetail(collectionUUID));
    return response.data;
}

export async function fetchCollectionBasic(collectionUUID: UUID) {
    const res = await api_client.get(CollectionURLs.collectionRetrieve(collectionUUID));
    return res.data;
}
