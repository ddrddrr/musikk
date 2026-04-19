import { CollectionSong } from "@/features/collections/types.ts";
import { useSongActions } from "@/features/songs/hooks/useSongActions.ts";
import { Button } from "@/features/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { BetweenHorizonalStart, EllipsisVertical, Play, Trash2 } from "lucide-react";
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
    const { removeSongMutation, onPlay, addSongMutation } = useSongActions(collectionSong);

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
                                removeSongMutation.mutate({
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
                    <DropdownMenuItem onSelect={onPlay}>
                        <Play className="mr-2 size-4" />
                        Play
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
