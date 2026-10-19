import { PaginatedRes, UUID } from "@/api/types.ts";
import { PublicationURLs } from "@/features/publications/api/endpoints.ts";
import { fetchPublicationPage } from "@/features/publications/api/queries.ts";
import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { FeedConnection, Publication } from "@/features/publications/types.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const NEW_POSTS_POLL_INTERVAL_MS = 10_000;

function hasNewerPost(
    latestPage: PaginatedRes<Publication> | undefined,
    currentNewestUUID: string | undefined,
): boolean {
    const latestUUID = latestPage?.results[0]?.uuid;
    return !!currentNewestUUID && !!latestUUID && latestUUID !== currentNewestUUID;
}

export function useNewGlobalFeedPosts(
    connection: FeedConnection | undefined,
    currentNewestUUID: string | undefined,
) {
    const queryClient = useQueryClient();
    const { data } = useQuery({
        queryKey: publicationKeys.globalFeedPoll(connection),
        queryFn: () =>
            fetchPublicationPage(
                PublicationURLs.globalFeedPosts(),
                1,
                0,
                connection ? { connection } : undefined,
            ),
        refetchInterval: NEW_POSTS_POLL_INTERVAL_MS,
    });

    const refresh = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: publicationKeys.globalFeed(connection) });
    }, [queryClient, connection]);

    return { hasNewPosts: hasNewerPost(data, currentNewestUUID), refresh };
}

export function useNewFeedPosts(userUUID: UUID, currentNewestUUID: string | undefined) {
    const queryClient = useQueryClient();
    const { data } = useQuery({
        queryKey: publicationKeys.feedPoll(userUUID),
        queryFn: () => fetchPublicationPage(PublicationURLs.feedPosts(userUUID), 1, 0),
        refetchInterval: NEW_POSTS_POLL_INTERVAL_MS,
    });

    const refresh = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: publicationKeys.feed(userUUID) });
    }, [queryClient, userUUID]);

    return { hasNewPosts: hasNewerPost(data, currentNewestUUID), refresh };
}
