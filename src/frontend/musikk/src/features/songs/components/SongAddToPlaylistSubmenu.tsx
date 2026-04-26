import { getErrorDetail } from "@/api/errorUtils.ts";
import { createCollectionSong } from "@/features/collections/api/mutations.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { useSongUserCollectionsQuery } from "@/features/songs/queries.ts";
import { songKeys } from "@/features/songs/queryKeys.ts";
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { UserCollectionsContext } from "@/features/user/providers/userCollectionsContext.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ListPlus, Plus } from "lucide-react";
import { useContext } from "react";
import { toast } from "sonner";

interface SongAddToPlaylistSubmenuProps {
    collectionSong: CollectionSong;
}

export function SongAddToPlaylistSubmenu({ collectionSong }: SongAddToPlaylistSubmenuProps) {
    const queryClient = useQueryClient();
    const { created_collections, liked_songs } = useContext(UserCollectionsContext);

    const { data: collectionUUIDs = [] } = useSongUserCollectionsQuery(collectionSong.uuid);

    const createCollectionSongMutation = useMutation({
        mutationFn: createCollectionSong,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: songKeys.userCollections(collectionSong.uuid),
            });
            toast.success("Added successfully");
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to add song to playlist"));
        },
    });

    // albums are immutable
    const playlists =
        created_collections?.filter((collection) => collection.type === "playlist") ?? [];
    const userCollections: Collection[] = [...(liked_songs ? [liked_songs] : []), ...playlists];

    const handleCollectionClick = (collectionUUID: string) => {
        // TODO: delete the song if playlist includes it
        if (collectionUUIDs.includes(collectionUUID)) {
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
                    const isInCollection = collectionUUIDs.includes(collection.uuid);
                    return (
                        <DropdownMenuItem
                            key={`${collectionSong.uuid}.${collection.uuid}`}
                            onSelect={() => handleCollectionClick(collection.uuid)}
                            disabled={isInCollection}
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
