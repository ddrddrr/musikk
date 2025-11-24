import { useFriendsLatestAddedQuery } from "@/modules/friend-activity/queries.ts";
import { SongCollectionCarousel } from "@/modules/song-collections/SongCollectionCarousel.tsx";
import { SongCarousel } from "@/modules/songs/SongCarousel.tsx";

export function LatestAdded() {
    const { isPending, isError, data: latestAdded } = useFriendsLatestAddedQuery();
    if (isPending || isError) {
        return null;
    }
    return (
        <>
            <SongCollectionCarousel
                collections={latestAdded.collections}
                title="Collections that your friends have favourited"
            />
            <SongCarousel songs={latestAdded.songs} title="Songs recently liked by your friends" />
        </>
    );
}
