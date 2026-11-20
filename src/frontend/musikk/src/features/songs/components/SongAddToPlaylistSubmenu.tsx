import {
    useAddSongToCollection,
    useRemoveSongFromCollection,
} from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { useCollectionMemberships } from "@/features/songs/api/queries.ts";
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { OverflowTooltip } from "@/features/ui/tooltip.tsx";
import { useUserLibrary } from "@/features/user/hooks/useUserLibrary.ts";
import { Check, ListPlus, Plus } from "lucide-react";

interface SongAddToPlaylistSubmenuProps {
    collectionSong: CollectionSong;
}

export function SongAddToPlaylistSubmenu({ collectionSong }: SongAddToPlaylistSubmenuProps) {
    const { data: library } = useUserLibrary();
    const created_collections = library?.created_collections;

    const { data: collectionEntries = [] } = useCollectionMemberships(collectionSong.uuid);

    const addSongMutation = useAddSongToCollection();
    const removeSongMutation = useRemoveSongFromCollection();

    // albums are immutable
    const playlists =
        created_collections?.filter((collection) => collection.type === "playlist") ?? [];

    const handleCollectionClick = (collectionUUID: string) => {
        const existing = collectionEntries.find((e) => e.collection_uuid === collectionUUID);
        if (existing) {
            removeSongMutation.mutate({
                collectionUUID,
                songCollectionSongUUID: existing.collection_song_uuid,
            });
            return;
        }
        addSongMutation.mutate({
            collectionUUID,
            songUUID: collectionSong.song.uuid,
        });
    };

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                {/*diff mr from other songmenubutton stuff due to listplus rendering shenanigans*/}
                <ListPlus className="mr-4 size-4" />
                Add to Playlist
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 w-64 overflow-y-auto">
                {playlists.length === 0 && (
                    <EmptyState variant="inline" message="No playlists yet" className="px-4 py-2" />
                )}
                {playlists.map((collection) => {
                    const isInCollection = collectionEntries.some(
                        (e) => e.collection_uuid === collection.uuid,
                    );
                    return (
                        <DropdownMenuItem
                            key={`${collectionSong.uuid}.${collection.uuid}`}
                            onSelect={() => handleCollectionClick(collection.uuid)}
                        >
                            <div className="flex size-5 items-center justify-center">
                                {isInCollection ? (
                                    <Check className="size-4 text-brand" />
                                ) : (
                                    <Plus className="size-4" />
                                )}
                            </div>
                            <OverflowTooltip label={collection.title}>
                                <span className="flex-1 truncate">{collection.title}</span>
                            </OverflowTooltip>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}
