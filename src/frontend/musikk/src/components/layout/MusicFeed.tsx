import { LatestAdded } from "@/components/friend-activity/LatestAdded.tsx";
import { fetchCollectionsLatest } from "@/components/song-collections/queries.ts";
import { SongCollectionCarousel } from "@/components/song-collections/SongCollectionCarousel";
import { useQuery } from "@tanstack/react-query";

export function MusicFeed() {
    const {
        isPending: collectionsPending,
        error: collectionsError,
        data: collections,
    } = useQuery({
        queryKey: ["newCollections"],
        queryFn: () => fetchCollectionsLatest(),
    });

    if (collectionsPending) {
        return <div>Loading...</div>;
    }

    if (collectionsError) {
        return <div>Something went wrong.</div>;
    }

    return (
        <div className="flex flex-col gap-8">
            {collections && <SongCollectionCarousel collections={collections} title="New Collections" />}
            <LatestAdded />
        </div>
    );
}
