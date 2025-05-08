import { CommentBox } from "@/components/comments/CommentBox";
import { fetchCollectionDetailed } from "@/components/song-collections/queries";
import { SongCollectionHeader } from "@/components/song-collections/SongCollectionHeader";
import { SongContainer } from "@/components/songs/SongContainer.tsx";
import { UUID } from "@/config/types.ts";
import { UserCollectionsContext } from "@/providers/userCollectionsContext.ts";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { useMatch, useNavigate } from "react-router-dom";

interface SongCollectionContainerProps {
    collectionUUID: UUID;
}

export function SongCollectionContainer({ collectionUUID }: SongCollectionContainerProps) {
    const navigate = useNavigate();
    const { liked_songs, history } = useContext(UserCollectionsContext);
    let showComments = Boolean(useMatch("/collection/:uuid/comments"));

    const {
        isPending,
        error,
        data: collection,
    } = useQuery({
        queryKey: ["openCollection", collectionUUID],
        queryFn: () => fetchCollectionDetailed(collectionUUID),
    });

    const toggleComments = () => {
        navigate(showComments ? `/collection/${collectionUUID}` : `/collection/${collectionUUID}/comments`);
    };

    if (isPending)
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );

    if (error)
        return (
            <div className="text-white text-center p-6 bg-red-600 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                An error has occurred: {error.message}
            </div>
        );

    const songs = collection.songs;
    const notPersonalCollection = collection?.uuid !== liked_songs?.uuid && collection?.uuid !== history?.uuid;
    showComments = showComments && notPersonalCollection;

    return (
        <div className={`flex gap-4 ${showComments ? "flex-row" : "flex-col"} max-w-4xl mx-auto p-4`}>
            <div className={showComments ? "w-1/2 pr-2" : "space-y-4"}>
                <SongCollectionHeader
                    collection={collection}
                    toggleComments={toggleComments}
                    songsCount={songs.length}
                    notPersonalCollection={notPersonalCollection}
                    showComments={showComments}
                />

                {songs.length > 0 ? (
                    <ul className="space-y-4" role="list">
                        {songs.map((collectionSong, index) => (
                            <li
                                key={`${collectionSong.uuid}-${index}`}
                                className="bg-white p-4 rounded-sm border border-gray-200 transition-colors hover:bg-gray-50"
                            >
                                <SongContainer collectionSong={collectionSong} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12 text-gray-700 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <p className="font-medium">No songs in this collection</p>
                    </div>
                )}
            </div>

            <div
                className={`w-1/2 pl-2 transition-all duration-500 ease-in-out transform ${
                    showComments ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
            >
                {showComments && <CommentBox objType="collection" objUUID={collectionUUID} />}
            </div>
        </div>
    );
}
