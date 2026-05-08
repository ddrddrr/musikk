import { getErrorDetail } from "@/api/errorUtils.ts";
import { UUID } from "@/api/types.ts";
import { albumBySongRetrieve } from "@/features/songs/queries.ts";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useNavigateToSongAlbum() {
    const navigate = useNavigate();

    return useCallback(
        async (songUUID: UUID) => {
            try {
                const album = await albumBySongRetrieve(songUUID);
                void navigate(`/collection/${album.uuid}/`);
            } catch (error) {
                toast.error(getErrorDetail(error, "Failed to load album"));
            }
        },
        [navigate],
    );
}
