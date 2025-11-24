import { api_client } from "@/api/axiosConf.ts";
import { QueueURLs } from "@/api/endpoints.ts";

export async function addSong(songUUID: string) {
    await api_client.post(QueueURLs.addSong(songUUID));
}

export async function addCollection(collectionUUID: string) {
    await api_client.post(QueueURLs.addCollection(collectionUUID));
}

export async function setHeadSong(songUUID: string) {
    await api_client.post(QueueURLs.setHeadSong(songUUID));
}

export async function setHeadCollection(collectionUUID: string) {
    await api_client.post(QueueURLs.setHeadCollection(collectionUUID));
}

export async function shiftHead() {
    await api_client.post(QueueURLs.shiftHead);
}

export async function shiftHeadTo(nodeUUID: string) {
    await api_client.post(QueueURLs.shiftHeadTo(nodeUUID));
}

export async function shiftHeadBackwards() {
    await api_client.post(QueueURLs.shiftHeadBackwards);
}

export async function removeNode(nodeUUID: string) {
    await api_client.post(QueueURLs.removeNode(nodeUUID));
}

export async function clearQueue() {
    await api_client.post(QueueURLs.clearQueue);
}

export async function appendRandom() {
    await api_client.post(QueueURLs.appendRandom);
}
