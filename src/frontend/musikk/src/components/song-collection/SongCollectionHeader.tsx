import { SongCollectionPlayButton } from "@/components/song-collection/SongCollectionPlayButton.tsx";
import { ISongCollectionDetailed } from "@/components/song-collection/types.ts";
import { Button } from "@/components/ui/button";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
import { BetweenHorizonalStart } from "lucide-react";

interface SongCollectionHeaderProps {
    collection: ISongCollectionDetailed;
    showComments: boolean;
    toggleComments: () => void;
    songsCount: number;
}

export function SongCollectionHeader({
    collection,
    showComments,
    toggleComments,
    songsCount,
}: SongCollectionHeaderProps) {
    const addToQueueMutation = useQueueAddAPI();

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold text-blac ${showComments ? "text-xl" : ""}`}>{collection.title}</h2>
                <div className="w-24"></div>
            </div>

            <div className="flex items-center bg-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 ease-in-out">
                <img
                    src={collection.image || "/placeholder.svg?height=100&width=100"}
                    alt={collection.title}
                    className={` object-cover border-2 border-black rounded-lg ${
                        showComments ? "scale-75 w-24 h-24" : "scale-100 w-32 h-32"
                    }`}
                />
                <div className="ml-6 flex-1">
                    <p className={`text-xl font-bold ${showComments ? "text-lg" : "text-xl"}`}>{collection.title}</p>
                    {collection.description && (
                        <p className={`text-gray-600 mt-2 line-clamp-2 ${showComments ? "text-sm" : "text-base"}`}>
                            {collection.description}
                        </p>
                    )}
                </div>
                <div className="flex gap-3">
                    <div
                        className={`bg-red-500 hover:bg-red-600 text-white border-2
                         border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           p-0 flex items-center justify-center ${showComments ? "h-8 w-8" : "h-12 w-12"}`}
                    >
                        <SongCollectionPlayButton collection={collection} />
                    </div>
                    <Button
                        onClick={() =>
                            addToQueueMutation.mutate({
                                type: "collection",
                                item: collection,
                                action: "add",
                            })
                        }
                        disabled={addToQueueMutation.isPending}
                        className={`bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-0 flex items-center justify-center ${
                            showComments ? "h-8 w-8" : "h-12 w-12"
                        }`}
                    >
                        <BetweenHorizonalStart size={20} />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between px-2">
                <h3 className="text-black text-lg font-bold transition-all duration-300 ease-in-out">
                    Songs • {songsCount}
                </h3>
                <Button
                    onClick={toggleComments}
                    className={`bg-blue-500 hover:bg-blue-600 text-white border-2 border-black rounded-lg 
                    ${showComments ? "h-8 px-3 text-sm" : "h-12 px-4"} 
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                    active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                >
                    {showComments ? "Hide Comments" : "Show Comments"}
                </Button>
            </div>
        </>
    );
}
