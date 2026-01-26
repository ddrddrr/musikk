import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { fetchCollectionDetailed } from "@/features/collections/api/queries.ts";
import { CollectionHeader } from "@/features/collections/components/CollectionHeader.tsx";
import { CommentBox } from "@/features/publications/components/collection-comments/CommentBox.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { UserCollectionsContext } from "@/features/user/providers/userCollectionsContext.ts";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { useMatch, useNavigate } from "react-router-dom";

interface CollectionContainerProps {
    collectionUUID: UUID;
}

export function CollectionContainer({ collectionUUID }: CollectionContainerProps) {
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
        void navigate(
            showComments
                ? `/collection/${collectionUUID}`
                : `/collection/${collectionUUID}/comments`,
        );
    };

    if (isPending)
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-sm border-4 border-black border-t-transparent"></div>
            </div>
        );

    if (error)
        return (
            <div className="rounded-sm border-2 border-black bg-red-600 p-6 text-center text-white">
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
        <div className="mx-auto max-w-7xl p-4">
            <div className={`flex gap-6 ${showComments ? "flex-row" : "flex-col"}`}>
                <div className={showComments ? "min-w-0 flex-1" : "w-full"}>
                    <div className="space-y-4">
                        <CollectionHeader
                            collection={collection}
                            toggleComments={toggleComments}
                            songsCount={songs.length}
                            notPersonalCollection={notPersonalCollection}
                            showComments={showComments}
                        />

                        {songs.length > 0 ? (
                            <ul className="space-y-2">
                                {songs.map((collectionSong, index) => (
                                    <li key={`${collectionSong.uuid}-${index}`}>
                                        <SongContainer
                                            collectionSong={collectionSong}
                                            size={showComments ? "compact" : "normal"}
                                            renderItems={{
                                                removeFromPlaylistCtxBtn,
                                                playButton: !showComments,
                                                addToLikedButton: !showComments,
                                                addToQueueButton: !showComments,
                                            }}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="rounded-sm border-2 border-black bg-white py-12 text-center text-gray-700">
                                <p className="font-medium">No songs in this collection</p>
                            </div>
                        )}
                    </div>
                </div>

                {showComments && (
                    <div className="min-w-0 flex-1">
                        <CommentBox collectionUUID={collectionUUID} />
                    </div>
                )}
            </div>
        </div>
    );
}
