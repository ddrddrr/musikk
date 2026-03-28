import { getErrorDetail } from "@/api/errorUtils.ts";
import { collectionRemoveSong } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { useQueueAddAPI } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useSongPlayHandler } from "@/features/songs/hooks/useSongPlayHandler.ts";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuPortal,
    ContextMenuTrigger,
} from "@/features/ui/context-menu.tsx";
import { collectionKeys } from "@/features/collections/api/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BetweenHorizonalStart, Play, Trash2 } from "lucide-react";
import { JSX } from "react";
import { toast } from "sonner";

interface SongContextMenuProps {
    children: JSX.Element | JSX.Element[];
    song: CollectionSong;
    renderRemoveFromPlaylist?: boolean;
}

export function SongContextMenu({
    children,
    song,
    renderRemoveFromPlaylist = false,
}: SongContextMenuProps) {
    const queryClient = useQueryClient();
    const collectionRemoveSongMutation = useMutation({
        mutationFn: collectionRemoveSong,
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionUUID),
            });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove song"));
        },
    });
    const { onClick: onSongPlayClick } = useSongPlayHandler(song);
    const addToQueueMutation = useQueueAddAPI();

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuPortal>
                <ContextMenuContent panel="card" className="w-48">
                    {renderRemoveFromPlaylist && (
                        <ContextMenuItem
                            onSelect={() =>
                                collectionRemoveSongMutation.mutate({
                                    collectionUUID: song.song_collection,
                                    songCollectionSongUUID: song.uuid,
                                })
                            }
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from playlist
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem
                        onSelect={() =>
                            addToQueueMutation.mutate({
                                type: "song",
                                item: song,
                                action: "add",
                            })
                        }
                    >
                        <BetweenHorizonalStart className="mr-2 h-4 w-4" />
                        Add to queue
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={onSongPlayClick}>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenuPortal>
        </ContextMenu>
    );
}
