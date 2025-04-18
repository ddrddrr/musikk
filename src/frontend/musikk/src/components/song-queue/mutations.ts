import { api } from "@/config/axiosConf.ts";
import { QueueURLs } from "@/config/endpoints.ts";

export async function addSong(songUUID: string) {
    await api.post(QueueURLs.addSong(songUUID));
}

export async function addCollection(collectionUUID: string) {
    await api.post(QueueURLs.addCollection(collectionUUID));
}

export async function setHeadSong(songUUID: string) {
    await api.post(QueueURLs.setHeadSong(songUUID));
}

export async function setHeadCollection(collectionUUID: string) {
    await api.post(QueueURLs.setHeadCollection(collectionUUID));
}

export async function shiftHead() {
    await api.post(QueueURLs.shiftHead);
}

export async function shiftHeadTo(nodeUUID: string) {
    await api.post(QueueURLs.shiftHeadTo(nodeUUID));
}

export async function shiftHeadBackwards() {
    await api.post(QueueURLs.shiftHeadBackwards);
}

export async function removeNode(nodeUUID: string) {
    await api.post(QueueURLs.removeNode(nodeUUID));
}

export async function clearQueue() {
    await api.post(QueueURLs.clearQueue);
}

export async function appendRandom() {
    await api.post(QueueURLs.appendRandom);
}
