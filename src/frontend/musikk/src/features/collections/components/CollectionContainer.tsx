import { UUID } from "@/api/types.ts";
import { Spinner } from "@/components/ui/spinner";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useCollectionDetailQuery } from "@/features/collections/api/queries.ts";
import { CollectionHeader } from "@/features/collections/components/CollectionHeader.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { CommentBox } from "@/features/publications/components/collection-comments/CommentBox.tsx";
import { DefaultSongActions, songButtonProps } from "@/features/songs/components/DefaultSongActions.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { SongMenuButton } from "@/features/songs/components/SongMenuButton.tsx";
import { UserCollectionsContext } from "@/features/user/providers/userCollectionsContext.ts";
import { cn } from "@/lib/utils.ts";
import { useContext } from "react";
import { useMatch, useNavigate } from "react-router-dom";

interface CollectionContainerProps {
    collectionUUID: UUID;
}

export function CollectionContainer({ collectionUUID }: CollectionContainerProps) {
    const navigate = useNavigate();
    const currUserUUID = useUserUUID();
    const { liked_songs, history, created_collections } = useContext(UserCollectionsContext);
    let showComments = !!useMatch("/collection/:uuid/comments");

    const {
        isPending,
        error,
        data: collection,
        refetch,
    } = useCollectionDetailQuery(collectionUUID);

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
                <Spinner className="size-8" />
            </div>
        );

    if (error)
        return (
            <QueryErrorBox
                message="Failed to load collection"
                onRetry={() => void refetch()}
            />
        );

    const songs = collection.songs;

    const notPersonalCollection =
        collection?.uuid !== liked_songs?.uuid && collection?.uuid !== history?.uuid;
    const isUserCreatedCollection = created_collections
        ?.map((c) => c.uuid)
        .includes(collection?.uuid);

    showComments = showComments && notPersonalCollection && !collection?.private;
    const removeFromPlaylistCtxBtn =
        !!currUserUUID && collection?.authors.map((a) => a.uuid).includes(currUserUUID);

    const songSize = showComments ? "compact" : "normal";
    const btn = songButtonProps[songSize];

    return (
        <div className="mx-auto max-w-7xl p-4">
            <div className={`flex gap-6 ${showComments ? "flex-row" : "flex-col"}`}>
                <div className={showComments ? "min-w-0 flex-1" : "w-full"}>
                    <div className="space-y-4">
                        <CollectionHeader
                            collection={collection}
                            toggleComments={toggleComments}
                            songsCount={songs.length}
                            renderAddToLikedButton={
                                notPersonalCollection && !isUserCreatedCollection
                            }
                            renderCommentsButton={notPersonalCollection && !collection?.private}
                            showComments={showComments}
                        />

                        {songs.length > 0 ? (
                            <ul className="space-y-2">
                                {songs.map((collectionSong, index) => {
                                    const songActions = showComments ? (
                                        <div className={cn("flex items-center", btn.gap)}>
                                            <SongMenuButton
                                                collectionSong={collectionSong}
                                                size={btn.size}
                                                className={btn.padding}
                                                iconSize={btn.iconSize}
                                                showRemoveFromPlaylist={removeFromPlaylistCtxBtn}
                                            />
                                        </div>
                                    ) : (
                                        <DefaultSongActions
                                            collectionSong={collectionSong}
                                            size={songSize}
                                            showRemoveFromPlaylist={removeFromPlaylistCtxBtn}
                                        />
                                    );

                                    return (
                                        <li key={`${collectionSong.uuid}-${index}`}>
                                            <SongContainer
                                                collectionSong={collectionSong}
                                                size={songSize}
                                                actions={songActions}
                                            />
                                        </li>
                                    );
                                })}
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
