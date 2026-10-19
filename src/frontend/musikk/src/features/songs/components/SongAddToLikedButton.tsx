import { useLikeSong, useUnlikeSong } from "@/features/collections/api/mutations.ts";
import { CollectionSong } from "@/features/collections/types.ts";
import { LikeToggleButton } from "@/features/common/LikeToggleButton.tsx";
import { ActionButtonSize } from "@/features/common/types.ts";
import { useIsSongLiked } from "@/features/user/hooks/useUserLikes.ts";

interface SongAddToLikedButtonProps {
    collectionSong: CollectionSong;
    size?: ActionButtonSize;
}

export function SongAddToLikedButton({ collectionSong, size = "md" }: SongAddToLikedButtonProps) {
    const isLiked = useIsSongLiked(collectionSong.song.uuid);
    const likeSongMutation = useLikeSong();
    const unlikeSongMutation = useUnlikeSong();
    const variables = { collectionSongUUID: collectionSong.uuid };

    return (
        <LikeToggleButton
            isLiked={isLiked}
            size={size}
            onLike={() => likeSongMutation.mutate(variables)}
            onUnlike={() => unlikeSongMutation.mutate(variables)}
        />
    );
}
