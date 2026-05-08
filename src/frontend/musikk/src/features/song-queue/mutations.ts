import { api_client } from "@/api/axiosConf.ts";
import { QueueURLs } from "@/api/endpoints.ts";

export async function addSong(songUUID: string) {
    await api_client.post(QueueURLs.addSong(songUUID));
}

export async function addCollection(collectionUUID: string) {
    await api_client.post(QueueURLs.addCollection(collectionUUID));
}

export async function playSong(songUUID: string) {
    await api_client.post(QueueURLs.playSong(songUUID));
}

export async function playCollection(collectionUUID: string) {
    await api_client.post(QueueURLs.playCollection(collectionUUID));
}

export async function next() {
    await api_client.post(QueueURLs.next);
}

export async function skipTo(itemUUID: string) {
    await api_client.post(QueueURLs.skipTo(itemUUID));
}

export async function prev() {
    await api_client.post(QueueURLs.prev);
}

export async function removeItem(itemUUID: string) {
    await api_client.post(QueueURLs.removeItem(itemUUID));
}

export async function clearQueue() {
    await api_client.post(QueueURLs.clearQueue);
}

export async function appendRandom() {
    await api_client.post(QueueURLs.appendRandom);
}

export async function reorderItem(
    itemUUID: string,
    beforeUUID: string | null,
    afterUUID: string | null,
) {
    await api_client.post(QueueURLs.reorder, {
        item: itemUUID,
        before: beforeUUID,
        after: afterUUID,
    });
}

export async function moveToQueue(
    collectionSongUUID: string,
    beforeUUID: string | null,
    afterUUID: string | null,
) {
    await api_client.post(QueueURLs.moveToQueue, {
        collection_song: collectionSongUUID,
        before: beforeUUID,
        after: afterUUID,
    });
}
