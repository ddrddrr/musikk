import { getErrorDetail } from "@/api/errorUtils.ts";
import { collectionRemoveSong } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { useAddSong } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useSongPlayHandler } from "@/features/songs/hooks/useSongPlayHandler.ts";
import { Button } from "@/features/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { collectionKeys } from "@/features/collections/api/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BetweenHorizonalStart, EllipsisVertical, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SongAddToPlaylistSubmenu } from "./SongAddToPlaylistSubmenu.tsx";

interface SongMenuButtonProps {
    collectionSong: CollectionSong;
    size: number;
    className?: string;
    iconSize: string;
    showRemoveFromPlaylist?: boolean;
    onRemoveFromQueue?: () => void;
}

export function SongMenuButton({
    collectionSong,
    iconSize,
    showRemoveFromPlaylist = false,
    onRemoveFromQueue,
}: SongMenuButtonProps) {
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
    const { onClick: onSongPlayClick } = useSongPlayHandler(collectionSong);
    const addSongMutation = useAddSong();

    // TODO: improve styling
    return (
        <div className="flex items-center gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"} size="icon" className={"hover:text-accent-foreground"}>
                        <EllipsisVertical className={iconSize} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                    {showRemoveFromPlaylist && (
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                                collectionRemoveSongMutation.mutate({
                                    collectionUUID: collectionSong.collection,
                                    songCollectionSongUUID: collectionSong.uuid,
                                })
                            }
                        >
                            <Trash2 className="mr-2 size-4" />
                            Remove from playlist
                        </DropdownMenuItem>
                    )}
                    {onRemoveFromQueue && (
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={onRemoveFromQueue}
                        >
                            <Trash2 className="mr-2 size-4" />
                            Remove from queue
                        </DropdownMenuItem>
                    )}
                    <SongAddToPlaylistSubmenu collectionSong={collectionSong} />
                    <DropdownMenuItem
                        onSelect={() => addSongMutation.mutate(collectionSong.uuid)}
                    >
                        <BetweenHorizonalStart className="mr-2 size-4" />
                        Add to queue
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onSongPlayClick}>
                        <Play className="mr-2 size-4" />
                        Play
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
