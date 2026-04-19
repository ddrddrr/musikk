import { UUID } from "@/api/types.ts";
import { fetchPublicationPage } from "@/features/publications/api/queries.ts";
import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { PublicationURLs } from "@/features/publications/api/urls.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useNewFeedPosts(userUUID: UUID, currentNewestUUID: string | undefined) {
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: [...publicationKeys.feed(userUUID), "poll"],
        queryFn: () => fetchPublicationPage(PublicationURLs.feedPosts(userUUID), 1, 0),
        refetchInterval: 30_000,
    });

    const latestUUID = data?.results[0]?.uuid;
    const hasNewPosts = !!currentNewestUUID && !!latestUUID && latestUUID !== currentNewestUUID;

    const refresh = useCallback(() => {
        void queryClient.invalidateQueries({
            queryKey: publicationKeys.feed(userUUID),
        });
    }, [queryClient, userUUID]);

    return { hasNewPosts, refresh };
}
