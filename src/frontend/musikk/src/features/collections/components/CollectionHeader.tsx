import { CollectionAddToLikedButton } from "@/features/collections/components/CollectionAddToLikedButton.tsx";
import { CollectionAddToQueueButton } from "@/features/collections/components/CollectionAddToQueueButton.tsx";
import { CollectionPlayButton } from "@/features/collections/components/CollectionPlayButton.tsx";
import { CollectionDetailed } from "@/features/collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { memo } from "react";

interface SongCollectionHeaderProps {
    collection: CollectionDetailed;
    showComments: boolean;
    toggleComments: () => void;
    songsCount: number;
    renderAddToLikedButton: boolean;
    renderCommentsButton: boolean;
}

// TODO: make user-created playlists deletable
export const CollectionHeader = memo(function SongCollectionHeader({
    collection,
    showComments,
    toggleComments,
    songsCount,
    renderAddToLikedButton,
    renderCommentsButton,
}: SongCollectionHeaderProps) {
    // TODO: make author clickable, probably factor out to a sep component
    const authors = collection.authors.map((author) => author.display_name).join(", ");

    return (
        <>
            <div className={`flex gap-4 rounded-sm border-2 border-black bg-white p-6`}>
                {collection.image ? (
                    <img
                        src={collection.image}
                        alt="♫"
                        className={`rounded-sm border-2 border-black object-cover ${
                            showComments ? "h-20 w-20" : "h-32 w-32"
                        }`}
                    />
                ) : (
                    <div>♫</div>
                )}

                <div className="flex-1">
                    {showComments ? (
                        <div className="mb-2">
                            <p className="truncate text-sm font-bold">{collection.title}</p>
                            <div className="mt-2 flex gap-3">
                                {songsCount > 0 && (
                                    <CollectionPlayButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                {renderAddToLikedButton && (
                                    <CollectionAddToLikedButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                <CollectionAddToQueueButton
                                    collection={collection}
                                    showComments={showComments}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-xl font-bold">{collection.title}</p>
                                <p className="truncate text-sm text-gray-500">{authors}</p>
                                {collection.description && (
                                    <p className="mt-2 line-clamp-2 text-base text-gray-600">
                                        {collection.description}
                                    </p>
                                )}
                            </div>
                            <div className="ml-2 flex flex-shrink-0 gap-2">
                                {songsCount > 0 && (
                                    <CollectionPlayButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                {renderAddToLikedButton && (
                                    <CollectionAddToLikedButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                <CollectionAddToQueueButton
                                    collection={collection}
                                    showComments={showComments}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h3 className={`p-1 font-bold text-black ${showComments ? "text-sm" : "text-lg"}`}>
                    Songs • {songsCount}
                </h3>
                {renderCommentsButton && (
                    <Button
                        onClick={toggleComments}
                        variant="accent"
                        size={showComments ? "sm" : "lg"}
                    >
                        {showComments ? "Hide Comments" : "Show Comments"}
                    </Button>
                )}
            </div>
        </>
    );
});
