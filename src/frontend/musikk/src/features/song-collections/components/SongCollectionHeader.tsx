import { CollectionAddToLikedButton } from "@/features/song-collections/components/CollectionAddToLikedButton.tsx";
import { CollectionAddToQueueButton } from "@/features/song-collections/components/CollectionAddToQueueButton.tsx";
import { SongCollectionPlayButton } from "@/features/song-collections/components/SongCollectionPlayButton.tsx";
import { CollectionDetailed } from "@/features/song-collections/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { memo } from "react";

interface SongCollectionHeaderProps {
    collection: CollectionDetailed;
    showComments: boolean;
    toggleComments: () => void;
    songsCount: number;
    notPersonalCollection: boolean;
}

export const SongCollectionHeader = memo(function SongCollectionHeader({
    collection,
    showComments,
    toggleComments,
    songsCount,
    notPersonalCollection,
}: SongCollectionHeaderProps) {
    // TODO: make author clickable, probably factor out to a sep component
    const authors = collection.authors.map((author) => author.display_name).join(", ");

    return (
        <>
            <div className={`flex bg-white p-6 rounded-sm border-2 border-black gap-4`}>
                {collection.image ? (
                    <img
                        src={collection.image}
                        alt="♫"
                        className={`object-cover rounded-sm border-2 border-black ${
                            showComments ? "w-20 h-20" : "w-32 h-32"
                        }`}
                    />
                ) : (
                    <div>♫</div>
                )}

                <div className="flex-1">
                    {showComments ? (
                        <div className="mb-2">
                            <p className="font-bold text-sm truncate">{collection.title}</p>
                            <div className="flex gap-3 mt-2">
                                {songsCount > 0 && (
                                    <SongCollectionPlayButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                {notPersonalCollection && (
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
                                <p className="font-bold text-xl">{collection.title}</p>
                                <p className="text-sm text-gray-500 truncate">{authors}</p>
                                {collection.description && (
                                    <p className="text-gray-600 mt-2 line-clamp-2 text-base">
                                        {collection.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 ml-2 flex-shrink-0">
                                {songsCount > 0 && (
                                    <SongCollectionPlayButton
                                        collection={collection}
                                        showComments={showComments}
                                    />
                                )}
                                {notPersonalCollection && (
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
                <div className={"border-black bg-white border-2 rounded-sm"}>
                    <h3 className="text-black  text-lg font-bold p-1">Songs • {songsCount}</h3>
                </div>
                {notPersonalCollection && (
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
