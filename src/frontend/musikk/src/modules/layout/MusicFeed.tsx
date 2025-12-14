import { PaginatedRes } from "@/api/types";
import { fetchCollections } from "@/modules/song-collections/api/queries";
import { SongCollectionCarousel } from "@/modules/song-collections/components/SongCollectionCarousel.tsx";
import { Collection } from "@/modules/song-collections/types";
import { useQueries } from "@tanstack/react-query";

export function MusicFeed() {
    const [playlists, albums, followedCollections, friendsCollections] = useQueries({
        queries: [
            {
                queryKey: ["collections", "playlists", "latest"],
                queryFn: () => fetchCollections({ type: "playlist" }),
                select: (data: PaginatedRes<Collection>) => data.results,
                staleTime: 60_000,
            },
            {
                queryKey: ["collections", "albums", "latest"],
                queryFn: () => fetchCollections({ type: "album" }),
                select: (data: PaginatedRes<Collection>) => data.results,
                staleTime: 60_000,
            },
            {
                queryKey: ["collections", "followed", "latest"],
                queryFn: () => fetchCollections({ connection: "followed" }),
                select: (data: PaginatedRes<Collection>) => data.results,
                staleTime: 30_000,
            },
            {
                queryKey: ["collections", "friends", "latest"],
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

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Something went wrong.</div>;

    return (
        <div className="flex flex-col gap-8">
            <SongCollectionCarousel collections={playlists.data} title="New Playlists" />

            <SongCollectionCarousel collections={albums.data} title="New Albums" />

            <SongCollectionCarousel
                collections={followedCollections.data}
                title="Latest Added by Followed Users"
            />

            <SongCollectionCarousel
                collections={friendsCollections.data}
                title="Latest Added by Friends"
            />
        </div>
    );
}
