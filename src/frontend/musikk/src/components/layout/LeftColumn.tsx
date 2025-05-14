import { SongCollectionCard } from "@/components/song-collections/SongCollectionCard";
import { UserCollectionsContext } from "@/providers/userCollectionsContext.ts";
import { useContext, useMemo } from "react";

export function LeftColumn() {
    const { liked_songs, history, followed_collections } = useContext(UserCollectionsContext);

    const collections = useMemo(() => {
        let all = Array.isArray(followed_collections) ? followed_collections : [];

        if (history != null) {
            all = [history, ...all];
        }
        if (liked_songs != null) {
            all = [liked_songs, ...all];
        }

        return all;
    }, [liked_songs, history, followed_collections]);

    return (
        <div className="w-1/5 bg-red-600 p-4 pb-40 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Your stuff</h2>

            {collections.length > 0 ? (
                <ul className="space-y-6" role="list">
                    {collections.map((collection) => (
                        <li key={collection.uuid}>
                            <SongCollectionCard collection={collection} size="big" />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-white bg-red-600 rounded-sm border-2 border-black">
                    <p>No song collections found</p>
                </div>
            )}
        </div>
    );
}
