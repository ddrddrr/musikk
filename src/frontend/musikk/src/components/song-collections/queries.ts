import { ISongCollection, ISongCollectionDetailed } from "@/components/song-collections/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CollectionURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";

export async function fetchCollectionsLatest(): Promise<ISongCollection[]> {
    const response = await api.get(CollectionURLs.collectionLatest);
    return response.data;
}

interface IFetchCollectionsPersonalParams {
    history: ISongCollection;
    liked_songs: ISongCollection;
    followed_collections: ISongCollection[];
}

export async function fetchCollectionsPersonal(): Promise<IFetchCollectionsPersonalParams> {
    const response = await api.get(CollectionURLs.collectionPersonal);
    return response.data;
}

export async function fetchCollectionDetailed(collectionUUID: string): Promise<ISongCollectionDetailed> {
    const response = await api.get(CollectionURLs.collectionDetail(collectionUUID));
    return response.data;
}

export async function fetchCollectionBasic(collectionUUID: UUID) {
    const res = await api.get(CollectionURLs.collectionRetrieve(collectionUUID));
    return res.data;
}
