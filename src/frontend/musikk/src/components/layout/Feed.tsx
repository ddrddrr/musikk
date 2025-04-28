import { fetchCollectionsLatest } from "@/components/song-collections/queries.ts";
import { SongCollectionsCarousel } from "@/components/song-collections/SongCollectionCarousel";
import { useQuery } from "@tanstack/react-query";

export function Feed() {
    const {
        isPending: collectionsPending,
        error: collectionsError,
        data: collections,
    } = useQuery({
        queryKey: ["newCollections"],
        queryFn: () => fetchCollectionsLatest(),
    });
    // const {
    //     isPending: songsPending,
    //     error: songsError,
    //     data: songs,
    // } = useQuery({
    //     queryKey: ["newSongs"],
    //     queryFn: () => fetchSongList(),
    // });

    if (collectionsPending ) {
        return <div>Loading...</div>;
    }

    if (collectionsError ) {
        return <div>Something went wrong.</div>;
    }

    return (
        <div className="flex flex-col gap-8">
            {collections && <SongCollectionsCarousel collections={collections} title="New Collections" />}
            {/*{songs && <SongCarousel songs={songs} title="Latest Songs" />}*/}
        </div>
    );
}
