import { collectionRemoveSong } from "@/components/song-collections/mutations.ts";
import { SongAddToLikedButton } from "@/components/songs/SongAddToLikedButton.tsx";
import { SongPlayButton } from "@/components/songs/SongPlayButton";
import { ISong } from "@/components/songs/types";
import { Button } from "@/components/ui/button.tsx";
import { UUID } from "@/config/types.ts";
import { useQueueAddAPI } from "@/hooks/useQueueAPI";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { useMutation } from "@tanstack/react-query";
import { BetweenHorizonalStart, Trash2 } from "lucide-react";
import { memo } from "react";

interface SongContainerProps {
    song: ISong;
    collectionUUID?: UUID;
    buttonSize?: number;
    buttonClass?: string;
    titleMaxWidth?: string;
    showImage?: boolean;
    showAddToQueueButton?: boolean;
}

export const SongContainer = memo(function SongContainer({
    song,
    collectionUUID,
    buttonSize = 20,
    buttonClass = "p-2",
    titleMaxWidth = "max-w-[200px]",
    showImage = true,
    showAddToQueueButton = true,
}: SongContainerProps) {
    const addToQueueMutation = useQueueAddAPI();
    const collectionRemoveSongMutation = useMutation({ mutationFn: collectionRemoveSong });

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className="flex items-center justify-between w-full h-full">
                    <div className="flex items-center gap-3">
                        {showImage &&
                            (song.image ? (
                                <img
                                    src={song.image}
                                    alt={song.title}
                                    className="w-10 h-10 object-cover rounded-sm border border-black"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gray-200 flex items-center justify-center rounded-sm border border-black">
                                    <span className="text-gray-400 text-xl">♪</span>
                                </div>
                            ))}

                        <div className="flex flex-col">
                            <p className={`font-bold text-sm text-black truncate ${titleMaxWidth}`}>{song.title}</p>
                            {/*<p className={`text-xs text-gray-600 truncate ${titleMaxWidth}`}>{song.authors}</p>*/}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <SongPlayButton song={song} size={buttonSize} className={buttonClass} />
                        <SongAddToLikedButton song={song} size={buttonSize} className={buttonClass} />
                        {showAddToQueueButton && (
                            <Button
                                onClick={() => addToQueueMutation.mutate({ type: "song", item: song, action: "add" })}
                                disabled={addToQueueMutation.isPending}
                                className="bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-lg p-0 flex items-center justify-center"
                            >
                                <BetweenHorizonalStart size={buttonSize} />
                            </Button>
                        )}
                    </div>
                </div>
            </ContextMenuTrigger>
            {/*/ TODO: implement add to playlist /*/}
            <ContextMenuContent className="w-48 bg-white rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1">
                {collectionUUID && (
                    <ContextMenuItem
                        className="flex items-center px-3 py-2 text-sm text-black 
                       hover:bg-gray-100 transition-colors"
                        onSelect={() =>
                            collectionRemoveSongMutation.mutate({
                                collectionUUID,
                                songUUID: song.uuid,
                            })
                        }
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from playlist
                    </ContextMenuItem>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
});
