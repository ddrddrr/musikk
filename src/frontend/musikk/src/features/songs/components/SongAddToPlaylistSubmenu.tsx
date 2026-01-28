import { createCollectionSong } from "@/features/collections/api/mutations.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { UserCollectionsContext } from "@/features/user/providers/userCollectionsContext.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ListPlus, Plus } from "lucide-react";
import { useContext } from "react";
import { toast } from "sonner";
import { songUserCollections } from "../queries.ts";

interface SongAddToPlaylistSubmenuProps {
    collectionSong: CollectionSong;
}

export function SongAddToPlaylistSubmenu({ collectionSong }: SongAddToPlaylistSubmenuProps) {
    const { created_collections, liked_songs } = useContext(UserCollectionsContext);

    const { data: collectionUUIDs = [] } = useQuery({
        queryKey: ["songUserCollections", collectionSong.uuid],
        queryFn: () => songUserCollections(collectionSong.uuid),
    });

    const createCollectionSongMutation = useMutation({
        mutationFn: createCollectionSong,
        onSuccess: () => {
            toast.success("Added successfully");
        },
        onError: () => {
            toast.error("Failed to add song to playlist");
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
                <ListPlus className="mr-4 h-4 w-4" />
                Add to Playlist
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 w-64 overflow-y-auto">
                {userCollections.map((collection) => {
                    const isInCollection = collectionUUIDs.includes(collection.uuid);
                    return (
                        <DropdownMenuItem
                            key={`${collectionSong.uuid}.${collection.uuid}`}
                            onSelect={() => handleCollectionClick(collection.uuid)}
                            disabled={isInCollection}
                        >
                            <div className="flex h-5 w-5 items-center justify-center">
                                {isInCollection ? (
                                    <Check className="text-brand h-4 w-4" />
                                ) : (
                                    <Plus className="h-4 w-4" />
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
