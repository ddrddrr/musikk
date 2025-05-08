import { CollectionAddToLikedButton } from "@/components/song-collections/CollectionAddToLikedButton.tsx";
import { CollectionAddToQueueButton } from "@/components/song-collections/CollectionAddToQueueButton.tsx";
import { SongCollectionPlayButton } from "@/components/song-collections/SongCollectionPlayButton.tsx";
import { ISongCollectionDetailed } from "@/components/song-collections/types.ts";
import { Button } from "@/components/ui/button";
import { memo } from "react";

interface SongCollectionHeaderProps {
    collection: ISongCollectionDetailed;
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
                className="flex items-center bg-white p-6 rounded-lg 
                   border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                   transition-all duration-300 ease-in-out"
            >
                {collection.image ? (
                    <img
                        src={collection.image}
                        alt={""}
                        className={`object-cover border-2 border-black rounded-lg ${
                            showComments ? "scale-75 w-24 h-24" : "scale-100 w-32 h-32"
                        }`}
                    />
                ) : (
                    <div>♫</div>
                )}

                <div className="ml-6 flex-1">
                    <p className="text-sm text-gray-500 truncate">{authors}</p>
                    <p className={`font-bold ${showComments ? "text-lg" : "text-xl"}`}>{collection.title}</p>
                    {collection.description && (
                        <p className={`text-gray-600 mt-2 line-clamp-2 ${showComments ? "text-sm" : "text-base"}`}>
                            {collection.description}
                        </p>
                    )}
                </div>
                <div className="flex gap-3">
                    <SongCollectionPlayButton collection={collection} showComments={showComments} />
                    {notPersonalCollection && (
                        <CollectionAddToLikedButton collection={collection} showComments={showComments} />
                    )}
                    <CollectionAddToQueueButton collection={collection} showComments={showComments} />
                </div>
            </div>

            <div className="flex items-center justify-between px-2">
                <h3 className="text-black text-lg font-bold transition-all duration-300 ease-in-out">
                    Songs • {songsCount}
                </h3>
                {notPersonalCollection && (
                    <Button
                        onClick={toggleComments}
                        className={`bg-blue-500 hover:bg-blue-600 text-white border-2 border-black rounded-lg 
                       ${showComments ? "h-8 px-3 text-sm" : "h-12 px-4"} 
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                       active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                    >
                        {showComments ? "Hide Comments" : "Show Comments"}
                    </Button>
                )}
            </div>
        </>
    );
});
