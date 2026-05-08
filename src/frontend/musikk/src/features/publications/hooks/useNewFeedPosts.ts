import { UUID } from "@/api/types.ts";
import { fetchPublicationPage } from "@/features/publications/api/queries.ts";
import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { PublicationURLs } from "@/features/publications/api/urls.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

function useNewPosts(
    url: string,
    queryKey: readonly unknown[],
    invalidateKey: readonly unknown[],
    currentNewestUUID: string | undefined,
) {
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: [...queryKey, "poll"],
        queryFn: () => fetchPublicationPage(url, 1, 0),
        refetchInterval: 10_000, // 10s
    });

    const latestUUID = data?.results[0]?.uuid;
    const hasNewPosts = !!currentNewestUUID && !!latestUUID && latestUUID !== currentNewestUUID;

    const refresh = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: [...invalidateKey] });
    }, [queryClient, invalidateKey]);

    return { hasNewPosts, refresh };
}

export function useNewGlobalFeedPosts(currentNewestUUID: string | undefined) {
    return useNewPosts(
        PublicationURLs.globalFeedPosts(),
        publicationKeys.globalFeed(),
        publicationKeys.globalFeed(),
        currentNewestUUID,
    );
}

export function useNewFeedPosts(userUUID: UUID, currentNewestUUID: string | undefined) {
    return useNewPosts(
        PublicationURLs.feedPosts(userUUID),
        publicationKeys.feed(userUUID),
        publicationKeys.feed(userUUID),
        currentNewestUUID,
    );
}
