import { api_client } from "@/api/axiosConf.ts";
import { getOffsetFromNextUrl } from "@/api/hooks.ts";
import { PaginatedRes, UUID } from "@/api/types.ts";
import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { ChatURLs, PublicationURLs } from "@/features/publications/api/urls.ts";
import { Chat, Publication } from "@/features/publications/types.ts";
import { Attachment } from "@/features/publications/types.ts";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

async function fetchPublicationPage(
    url: string,
    limit = 10,
    offset = 0,
    additionalParams?: Record<string, string>,
): Promise<PaginatedRes<Publication>> {
    const res = await api_client.get<PaginatedRes<Publication>>(url, {
        params: { limit, offset, ...additionalParams },
    });
    return res.data;
}

function usePublicationListInfinite(
    url: string,
    queryKey: unknown[],
    additionalParams?: Record<string, string>,
    limit = 10,
) {
    return useInfiniteQuery({
        queryKey: [...queryKey, url, "infinite", limit, additionalParams],
        initialPageParam: 0,
        queryFn: ({ pageParam }) => fetchPublicationPage(url, limit, pageParam, additionalParams),
        getNextPageParam: getOffsetFromNextUrl,
    });
}

export function useFeedPosts(userUUID: UUID, connection?: "friends" | "followed") {
    const params = connection ? { connection } : undefined;
    return usePublicationListInfinite(
        PublicationURLs.feedPosts(userUUID),
        [...publicationKeys.feed(userUUID)],
        params,
    );
}

export function useCollectionComments(collectionUUID: UUID) {
    return usePublicationListInfinite(PublicationURLs.collectionComments(collectionUUID), [
        ...publicationKeys.collectionComments(collectionUUID),
    ]);
}

export async function fetchPublicationChildren(pubUUID: UUID): Promise<Publication[]> {
    const res = await api_client.get<{ children: Publication[] }>(
        PublicationURLs.publicationChildren(pubUUID),
    );
    return res.data.children;
}

export function usePublicationChildren(pubUUID: UUID, enabled = true) {
    return useQuery<Publication[]>({
        queryFn: () => fetchPublicationChildren(pubUUID),
        queryKey: publicationKeys.children(pubUUID),
        enabled,
    });
}

async function fetchUserChats(userUUID: UUID): Promise<Chat[]> {
    const res = await api_client.get<Chat[]>(ChatURLs.userChats(userUUID));
    return res.data;
}

export function useUserChats(userUUID: UUID) {
    return useQuery<Chat[]>({
        queryFn: () => fetchUserChats(userUUID),
        queryKey: publicationKeys.userChats(userUUID),
    });
}

export function useChatMessages(userUUID: UUID, chatUUID: UUID) {
    return usePublicationListInfinite(ChatURLs.chatMessages(userUUID, chatUUID), [
        ...publicationKeys.chatMessages(userUUID, chatUUID),
    ]);
}

async function fetchChatDetail(userUUID: UUID, chatUUID: UUID): Promise<Chat> {
    const res = await api_client.get<Chat>(ChatURLs.chatDetail(userUUID, chatUUID));
    return res.data;
}

export function useChatDetail(userUUID: UUID, chatUUID: UUID) {
    return useQuery<Chat>({
        queryFn: () => fetchChatDetail(userUUID, chatUUID),
        queryKey: publicationKeys.chatDetail(userUUID, chatUUID),
    });
}

export function useChatAttachments(userUUID: UUID, chatUUID: UUID) {
    return useInfiniteQuery({
        queryKey: [...publicationKeys.chatAttachments(userUUID, chatUUID), "infinite"],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const res = await api_client.get<PaginatedRes<Attachment>>(
                ChatURLs.chatAttachments(userUUID, chatUUID),
                { params: { limit: 10, offset: pageParam } },
            );
            return res.data;
        },
        getNextPageParam: getOffsetFromNextUrl,
    });
}
