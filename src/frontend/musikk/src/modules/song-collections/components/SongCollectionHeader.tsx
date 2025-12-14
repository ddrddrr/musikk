import { CollectionAddToLikedButton } from "@/modules/song-collections/components/CollectionAddToLikedButton.tsx";
import { CollectionAddToQueueButton } from "@/modules/song-collections/components/CollectionAddToQueueButton.tsx";
import { SongCollectionPlayButton } from "@/modules/song-collections/components/SongCollectionPlayButton.tsx";
import { CollectionDetailed } from "@/modules/song-collections/types.ts";
import { Button } from "@/modules/ui/button.tsx";
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
    const authors = collection.authors.map((author) => author.display_name).join(", ");

    return (
        <>
            <div
                className={`flex items-start bg-white p-6 rounded-lg 
                   border-2 border-black
                   transition-all duration-300 ease-in-out ${showComments ? "flex-col sm:flex-row gap-4" : "flex-row"}`}
            >
                {collection.image ? (
                    <img
                        src={collection.image}
                        alt=""
                        className={`object-cover border-2 border-black rounded-lg ${
                            showComments ? "scale-100 w-24 h-24" : "scale-100 w-32 h-32"
                        }`}
                    />
                ) : (
                    <div>♫</div>
                )}

                <div className="ml-0 sm:ml-6 flex-1 min-w-0">
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
                                <p className="text-sm text-gray-500 truncate">{authors}</p>
                                <p className="font-bold text-xl">{collection.title}</p>
                                {collection.description && (
                                    <p className="text-gray-600 mt-2 line-clamp-2 text-base">
                                        {collection.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3 ml-6 flex-shrink-0">
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

            <div className="flex items-center justify-between px-2 mt-2">
                <h3 className="text-black text-lg font-bold transition-all duration-300 ease-in-out">
                    Songs • {songsCount}
                </h3>
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
