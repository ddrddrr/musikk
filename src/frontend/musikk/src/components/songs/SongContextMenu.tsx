import { collectionRemoveSong } from "@/components/song-collections/mutations.ts";
import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { useSongPlayHandler } from "@/components/songs/hooks/useSongPlayHandler.ts";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuPortal,
    ContextMenuTrigger,
} from "@radix-ui/react-context-menu";
import { useMutation } from "@tanstack/react-query";
import { BetweenHorizonalStart, Play, Trash2 } from "lucide-react";
import { JSX } from "react";

interface SongContextMenuProps {
    children: JSX.Element | JSX.Element[];
    song: ISongCollectionSong;
    renderRemoveFromPlaylist?: boolean;
}

export function SongContextMenu({ children, song, renderRemoveFromPlaylist = false }: SongContextMenuProps) {
    const collectionRemoveSongMutation = useMutation({ mutationFn: collectionRemoveSong });
    const { onClick: onSongPlayClick } = useSongPlayHandler(song);
    const addToQueueMutation = useQueueAddAPI();

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuPortal>
                <ContextMenuContent className="w-48 bg-white rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1">
                    {renderRemoveFromPlaylist && (
                        <ContextMenuItem
                            className="flex items-center px-3 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
                            onSelect={() =>
                                collectionRemoveSongMutation.mutate({
                                    collectionUUID: song.song_collection,
                                    songCollectionSongUUID: song.uuid,
                                })
                            }
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove from playlist
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem
                        className="flex items-center px-3 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
                        onSelect={() =>
                            addToQueueMutation.mutate({
                                type: "song",
                                item: song,
                                action: "add",
                            })
                        }
                    >
                        <BetweenHorizonalStart className="w-4 h-4 mr-2" />
                        Add to queue
                    </ContextMenuItem>
                    <ContextMenuItem
                        className="flex items-center px-3 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
                        onSelect={onSongPlayClick}
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Play
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenuPortal>
        </ContextMenu>
    );
}
