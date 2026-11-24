import { UUID } from "@/api/types.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useCollectionDetailQuery } from "@/features/collections/api/queries.ts";
import { CollectionHeader } from "@/features/collections/components/CollectionHeader.tsx";
import { DeleteCollectionDialog } from "@/features/collections/components/DeleteCollectionDialog.tsx";
import { useCollectionDeletion } from "@/features/collections/hooks/useCollectionDeletion.ts";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { BackButton } from "@/features/common/BackButton.tsx";
import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { CommentBox } from "@/features/publications/components/comments/CommentBox.tsx";
import { COMMENTS_BORDER_BY_TYPE } from "@/features/publications/components/comments/commentsBorder.ts";
import { CommentableObjectRef } from "@/features/publications/types.ts";
import { DefaultSongActions } from "@/features/songs/components/DefaultSongActions.tsx";
import { SongCommentsButton } from "@/features/songs/components/SongCommentsButton.tsx";
import { SongContainer } from "@/features/songs/components/SongContainer.tsx";
import { SongMenuButton } from "@/features/songs/components/SongMenuButton.tsx";
import { useUserLibrary } from "@/features/user/hooks/useUserLibrary.ts";
import { cn } from "@/lib/utils.ts";
import { useState } from "react";
import { useMatch } from "react-router-dom";

interface CollectionContainerProps {
    collectionUUID: UUID;
}

interface OpenCommentThread {
    commentable: CommentableObjectRef;
    title: string;
}

/**
 * Finds the thread that the URL opens in the side panel: the collection's own thread, or the thread of one of its
 * songs. A song that is not in the collection opens nothing, because the panel takes its title from the song's row.
 */
function findOpenCommentThread(
    collection: CollectionDetailed,
    isCollectionCommentsRoute: boolean,
    openSongUUID: UUID | undefined,
): OpenCommentThread | null {
    if (isCollectionCommentsRoute) {
        return {
            commentable: { type: "collection", uuid: collection.uuid },
            title: collection.title,
        };
    }
    const openSong = collection.songs.find((cs) => cs.song.uuid === openSongUUID)?.song;
    if (!openSong) return null;
    return { commentable: { type: "song", uuid: openSong.uuid }, title: openSong.title };
}

export function CollectionContainer({ collectionUUID }: CollectionContainerProps) {
    const currUserUUID = useUserUUID();
    const { data: library } = useUserLibrary();
    const { liked_songs, history, created_collections } = library ?? {};
    const isCollectionCommentsRoute = !!useMatch("/collection/:uuid/comments");
    const openSongUUID = useMatch("/collection/:uuid/songs/:songUUID/comments")?.params.songUUID;

    const {
        isPending,
        error,
        data: collection,
        refetch,
    } = useCollectionDetailQuery(collectionUUID);

    const collectionPath = `/collection/${collectionUUID}`;
    const commentsToggleTo = isCollectionCommentsRoute
        ? collectionPath
        : `${collectionPath}/comments`;

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { deleteCollection, isDeleting } = useCollectionDeletion();

    if (isPending) return <CenteredSpinner className="min-h-[400px]" />;

    if (error)
        return <QueryErrorBox message="Failed to load collection" onRetry={() => void refetch()} />;

    const songs = collection.songs;

    const notPersonalCollection =
        collection?.uuid !== liked_songs?.uuid && collection?.uuid !== history?.uuid;
    const isUserCreatedCollection = created_collections
        ?.map((c) => c.uuid)
        .includes(collection?.uuid);

    const canComment = notPersonalCollection && !collection.private;
    const openThread = canComment
        ? findOpenCommentThread(collection, isCollectionCommentsRoute, openSongUUID)
        : null;
    const showComments = openThread !== null;
    const isCollectionThreadOpen = openThread?.commentable.type === "collection";
    const openThreadSongUUID =
        openThread?.commentable.type === "song" ? openThread.commentable.uuid : undefined;
    const isAuthor = !!currUserUUID && collection.authors.map((a) => a.uuid).includes(currUserUUID);
    const songsRemovableFrom = isAuthor ? collection.type : undefined;
    const canDelete = isAuthor && (collection.type === "playlist" || collection.type === "album");

    const songSize = showComments ? "sm" : "md";

    return (
        <div className="mx-auto max-w-7xl p-4">
            <BackButton />
            <div className={cn("flex gap-6", showComments ? "flex-row" : "flex-col")}>
                <div className={showComments ? "min-w-0 flex-1" : "w-full"}>
                    <div className="flex flex-col gap-4">
                        <CollectionHeader
                            collection={collection}
                            commentsToggleTo={commentsToggleTo}
                            songsCount={songs.length}
                            renderAddToLikedButton={
                                notPersonalCollection && !isUserCreatedCollection
                            }
                            renderCommentsButton={canComment}
                            compact={showComments}
                            isCommentsOpen={isCollectionThreadOpen}
                            canDelete={canDelete}
                            onDeleteClick={() => setDeleteDialogOpen(true)}
                        />

                        {songs.length === 0 && (
                            <EmptyState message="No songs in this collection" className="py-12" />
                        )}
                        {songs.length > 0 && (
                            <ul className="flex flex-col gap-2">
                                {songs.map((collectionSong) => {
                                    const songUUID = collectionSong.song.uuid;
                                    const isSongThreadOpen = songUUID === openThreadSongUUID;
                                    const songCommentsTo = isSongThreadOpen
                                        ? collectionPath
                                        : `${collectionPath}/songs/${songUUID}/comments`;
                                    const commentsButton = (
                                        <SongCommentsButton
                                            to={songCommentsTo}
                                            isOpen={isSongThreadOpen}
                                            size={songSize}
                                        />
                                    );
                                    const songActions = showComments ? (
                                        <div className="flex items-center gap-1">
                                            {commentsButton}
                                            <SongMenuButton
                                                collectionSong={collectionSong}
                                                size="sm"
                                                removableFrom={songsRemovableFrom}
                                            />
                                        </div>
                                    ) : (
                                        <DefaultSongActions
                                            collectionSong={collectionSong}
                                            size={songSize}
                                            commentsButton={commentsButton}
                                            showComments={canComment}
                                            removableFrom={songsRemovableFrom}
                                        />
                                    );

                                    return (
                                        <li key={collectionSong.uuid}>
                                            <SongContainer
                                                collectionSong={collectionSong}
                                                size={songSize}
                                                showDuration
                                                actions={songActions}
                                                className={cn(
                                                    isSongThreadOpen &&
                                                        COMMENTS_BORDER_BY_TYPE.song,
                                                )}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {openThread && (
                    <div className="min-w-0 flex-1">
                        {/* sticky, so the thread stays in view next to a song far down the list */}
                        <CommentBox
                            key={`${openThread.commentable.type}-${openThread.commentable.uuid}`}
                            commentable={openThread.commentable}
                            title={openThread.title}
                            closeTo={collectionPath}
                            className="sticky top-0"
                        />
                    </div>
                )}
            </div>

            {canDelete && (
                <DeleteCollectionDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    collection={collection}
                    onConfirm={() => deleteCollection(collection)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
}
