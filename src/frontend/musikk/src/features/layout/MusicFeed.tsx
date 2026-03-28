import { PaginatedRes } from "@/api/types";
import { Spinner } from "@/components/ui/spinner";
import { collectionKeys } from "@/features/collections/api/queryKeys.ts";
import { fetchCollections } from "@/features/collections/api/queries";
import { CollectionCarousel } from "@/features/collections/components/CollectionCarousel.tsx";
import { Collection } from "@/features/collections/types";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useQueries, useQueryClient } from "@tanstack/react-query";

export function MusicFeed() {
    const queryClient = useQueryClient();
    const [playlists, albums, followedCollections, friendsCollections] = useQueries({
        queries: [
            {
                queryKey: collectionKeys.latest("playlists"),
                queryFn: () => fetchCollections({ type: "playlist" }),
                select: (data: PaginatedRes<Collection>) => data.results,
            },
            {
                queryKey: collectionKeys.latest("albums"),
                queryFn: () => fetchCollections({ type: "album" }),
                select: (data: PaginatedRes<Collection>) => data.results,
            },
            {
                queryKey: collectionKeys.latest("followed"),
                queryFn: () => fetchCollections({ connection: "followed" }),
                select: (data: PaginatedRes<Collection>) => data.results,
                staleTime: 30_000,
            },
            {
                queryKey: collectionKeys.latest("friends"),
                queryFn: () => fetchCollections({ connection: "friends" }),
                select: (data: PaginatedRes<Collection>) => data.results,
                staleTime: 30_000,
            },
        ],
    });

    const isLoading =
        playlists.isPending ||
        albums.isPending ||
        followedCollections.isPending ||
        friendsCollections.isPending;

    const isError =
        playlists.isError ||
        albums.isError ||
        followedCollections.isError ||
        friendsCollections.isError;

    if (isLoading)
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner className="size-8" />
            </div>
        );
    if (isError)
        return (
            <QueryErrorBox
                message="Failed to load music feed"
                onRetry={() => void queryClient.invalidateQueries({ queryKey: collectionKeys.base })}
            />
        );

    return (
        <div className="flex flex-col gap-8">
            <CollectionCarousel collections={playlists.data} title="New Playlists" />

            <CollectionCarousel collections={albums.data} title="New Albums" />

            <CollectionCarousel
                collections={followedCollections.data}
                title="Latest Added by Followed Users"
            />

            <CollectionCarousel
                collections={friendsCollections.data}
                title="Latest Added by Friends"
            />
        </div>
    );
}
