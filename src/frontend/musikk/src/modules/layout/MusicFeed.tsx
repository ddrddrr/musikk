import { fetchCollections } from "@/modules/song-collections/api/queries";
import { SongCollectionCarousel } from "@/modules/song-collections/SongCollectionCarousel";
import { useQuery } from "@tanstack/react-query";

export function MusicFeed() {
    const playlists = useQuery({
        queryKey: ["collections.playlists.latest"],
        queryFn: () => fetchCollections({ type: "playlist" }),
    });

    const albums = useQuery({
        queryKey: ["collections.albums.latest"],
        queryFn: () => fetchCollections({ type: "album" }),
    });

    const followedCollections = useQuery({
        queryKey: ["collections.followed.latest"],
        queryFn: () =>
            fetchCollections({
                connection: "followed",
            }),
    });

    const friendsCollections = useQuery({
        queryKey: ["collections.friends.latest"],
        queryFn: () =>
            fetchCollections({
                connection: "friends",
            }),
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
            <SongCollectionCarousel collections={playlists.data?.results} title="New Playlists" />

            <SongCollectionCarousel collections={albums.data?.results} title="New Albums" />

            <SongCollectionCarousel
                collections={followedCollections.data?.results}
                title="Latest Added by Followed Users"
            />

            <SongCollectionCarousel
                collections={friendsCollections.data?.results}
                title="Latest Added by Friends"
            />
        </div>
    );
}
