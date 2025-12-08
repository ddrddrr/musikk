import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/modules/auth/hooks/useUserUUID.ts";
import { CommentBox } from "@/modules/publications/CommentBox";
import { fetchCollectionDetailed } from "@/modules/song-collections/queries";
import { SongCollectionHeader } from "@/modules/song-collections/SongCollectionHeader";
import { SongContainer } from "@/modules/songs/SongContainer.tsx";
import { UserCollectionsContext } from "@/modules/user/providers/userCollectionsContext.ts";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { useMatch, useNavigate } from "react-router-dom";

interface SongCollectionContainerProps {
    collectionUUID: UUID;
}

export function SongCollectionContainer({ collectionUUID }: SongCollectionContainerProps) {
    const navigate = useNavigate();
    const currUserUUID = useUserUUID();
    const { liked_songs, history } = useContext(UserCollectionsContext);
    let showComments = !!useMatch("/collection/:uuid/comments");

    const {
        isPending,
        error,
        data: collection,
    } = useQuery({
        queryKey: ["openCollection", collectionUUID],
        queryFn: () => fetchCollectionDetailed(collectionUUID),
    });

    const toggleComments = () => {
        navigate(
            showComments
                ? `/collection/${collectionUUID}`
                : `/collection/${collectionUUID}/comments`,
        );
    };

    if (isPending)
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );

    if (error)
        return (
            <div className="text-white text-center p-6 bg-red-600 rounded-lg border-2 border-black">
                An error has occurred: {error.message}
            </div>
        );

    const songs = collection.songs;
    const notPersonalCollection =
        collection?.uuid !== liked_songs?.uuid && collection?.uuid !== history?.uuid;
    showComments = showComments && notPersonalCollection;
    const removeFromPlaylistCtxBtn =
        !!currUserUUID && collection?.authors.map((a) => a.uuid).includes(currUserUUID);

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className={`flex gap-6 ${showComments ? "flex-row" : "flex-col"}`}>
                <div className={showComments ? "flex-1 min-w-0" : "w-full"}>
                    <div className="space-y-4">
                        <SongCollectionHeader
                            collection={collection}
                            toggleComments={toggleComments}
                            songsCount={songs.length}
                            notPersonalCollection={notPersonalCollection}
                            showComments={showComments}
                        />

                        {songs.length > 0 ? (
                            <ul className="space-y-2" role="list">
                                {songs.map((collectionSong, index) => (
                                    <li key={`${collectionSong.uuid}-${index}`}>
                                        <SongContainer
                                            collectionSong={collectionSong}
                                            className="bg-white p-4 rounded-sm border border-gray-200 transition-colors hover:bg-gray-50"
                                            renderItems={{ removeFromPlaylistCtxBtn }}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12 text-gray-700 bg-white rounded-lg border-2 border-black">
                                <p className="font-medium">No songs in this collection</p>
                            </div>
                        )}
                    </div>
                </div>

                {showComments && (
                    <div className="flex-1 min-w-0">
                        <CommentBox objType="collection" objUUID={collectionUUID} />
                    </div>
                )}
            </div>
        </div>
    );
}
