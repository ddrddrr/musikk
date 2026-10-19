import { api_client } from "@/api/axiosConf.ts";
import { getOffsetFromNextUrl } from "@/api/hooks.ts";
import { PaginatedRes, UUID } from "@/api/types.ts";
import { ChatURLs, PublicationURLs } from "@/features/publications/api/endpoints.ts";
import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { Attachment, Chat, FeedConnection, Publication } from "@/features/publications/types.ts";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export async function fetchPublicationPage(
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

const PUBLICATION_PAGE_SIZE = 10;

const offsetPagination = {
    initialPageParam: 0,
    getNextPageParam: getOffsetFromNextUrl,
};

export function useGlobalFeedPosts(connection?: FeedConnection) {
    return useInfiniteQuery({
        ...offsetPagination,
        queryKey: publicationKeys.globalFeed(connection),
        queryFn: ({ pageParam }) =>
            fetchPublicationPage(
                PublicationURLs.globalFeedPosts(),
                PUBLICATION_PAGE_SIZE,
                pageParam,
                connection ? { connection } : undefined,
            ),
    });
}

export function useFeedPosts(userUUID: UUID) {
    return useInfiniteQuery({
        ...offsetPagination,
        queryKey: publicationKeys.feed(userUUID),
        queryFn: ({ pageParam }) =>
            fetchPublicationPage(
                PublicationURLs.feedPosts(userUUID),
                PUBLICATION_PAGE_SIZE,
                pageParam,
            ),
    });
}

export function useCollectionComments(collectionUUID: UUID) {
    return useInfiniteQuery({
        ...offsetPagination,
        queryKey: publicationKeys.collectionComments(collectionUUID),
        queryFn: ({ pageParam }) =>
            fetchPublicationPage(
                PublicationURLs.collectionComments(collectionUUID),
                PUBLICATION_PAGE_SIZE,
                pageParam,
            ),
    });
}

export async function fetchPublicationChildren(pubUUID: UUID): Promise<Publication[]> {
    const res = await api_client.get<{ children: Publication[] }>(
        PublicationURLs.publicationChildren(pubUUID),
    );
    return res.data.children;
}

export function usePublicationChildren(pubUUID: UUID, active = true) {
    return useQuery<Publication[]>({
        queryFn: () => fetchPublicationChildren(pubUUID),
        queryKey: publicationKeys.children(pubUUID),
        enabled: active,
        refetchInterval: active ? 30_000 : false,
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
    return useInfiniteQuery({
        ...offsetPagination,
        queryKey: publicationKeys.chatMessages(userUUID, chatUUID),
        queryFn: ({ pageParam }) =>
            fetchPublicationPage(
                ChatURLs.chatMessages(userUUID, chatUUID),
                PUBLICATION_PAGE_SIZE,
                pageParam,
            ),
    });
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
        ...offsetPagination,
        queryKey: publicationKeys.chatAttachments(userUUID, chatUUID),
        queryFn: async ({ pageParam }) => {
            const res = await api_client.get<PaginatedRes<Attachment>>(
                ChatURLs.chatAttachments(userUUID, chatUUID),
                { params: { limit: PUBLICATION_PAGE_SIZE, offset: pageParam } },
            );
            return res.data;
        },
    });
}
