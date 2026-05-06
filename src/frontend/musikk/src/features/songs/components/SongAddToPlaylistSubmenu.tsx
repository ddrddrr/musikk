import { getErrorDetail } from "@/api/errorUtils.ts";
import {
    collectionRemoveSong,
    createCollectionSong,
} from "@/features/collections/api/mutations.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { useCollectionMemberships } from "@/features/songs/queries.ts";
import { songKeys } from "@/features/songs/queryKeys.ts";
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { usePersonalCollections } from "@/features/user/hooks/usePersonalCollections.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ListPlus, Plus } from "lucide-react";
import { toast } from "sonner";

interface SongAddToPlaylistSubmenuProps {
    collectionSong: CollectionSong;
}

export function SongAddToPlaylistSubmenu({ collectionSong }: SongAddToPlaylistSubmenuProps) {
    const queryClient = useQueryClient();
    const { data: personal } = usePersonalCollections();
    const created_collections = personal?.created_collections;
    const liked_songs = personal?.liked_songs;

    const { data: collectionEntries = [] } = useCollectionMemberships(collectionSong.uuid);

    const invalidateUserCollections = () =>
        queryClient.invalidateQueries({
            queryKey: songKeys.userCollections(collectionSong.uuid),
        });

    const createCollectionSongMutation = useMutation({
        mutationFn: createCollectionSong,
        onSuccess: () => {
            void invalidateUserCollections();
            toast.success("Added successfully");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to add song to playlist"));
        },
    });

    const removeCollectionSongMutation = useMutation({
        mutationFn: collectionRemoveSong,
        onSuccess: () => {
            void invalidateUserCollections();
            toast.success("Removed successfully");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove song from playlist"));
        },
    });

    // albums are immutable
    const playlists =
        created_collections?.filter((collection) => collection.type === "playlist") ?? [];
    const userCollections: Collection[] = [...(liked_songs ? [liked_songs] : []), ...playlists];

    const handleCollectionClick = (collectionUUID: string) => {
        const existing = collectionEntries.find((e) => e.collection_uuid === collectionUUID);
        if (existing) {
            removeCollectionSongMutation.mutate({
                collectionUUID,
                songCollectionSongUUID: existing.collection_song_uuid,
            });
            return;
        }
        createCollectionSongMutation.mutate({
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
                {userCollections.length === 0 && (
                    <EmptyState variant="inline" message="No playlists yet" className="px-4 py-2" />
                )}
                {userCollections.map((collection) => {
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
                            <span className="flex-1 truncate">{collection.title}</span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}
