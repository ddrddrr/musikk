import { UUID } from "@/api/types.ts";
import { CenteredSpinner } from "@/features/common/CenteredSpinner.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useAlbumBySong } from "@/features/songs/api/queries.ts";
import { Navigate, useParams } from "react-router-dom";

/**
 * Opens a song thread from places that have no collection page behind them, such as the player bar or a
 * notification. A song thread shows next to a collection's song list, so this route finds the song's album and
 * replaces itself with the album's song thread URL.
 */
export function SongCommentsRouteHandler() {
    const { songUUID } = useParams<{ songUUID: string }>();
    if (!songUUID) return null;
    return <SongCommentsRedirect songUUID={songUUID} />;
}

function SongCommentsRedirect({ songUUID }: { songUUID: UUID }) {
    const { data: album, error, refetch } = useAlbumBySong(songUUID);

    if (error) {
        return <QueryErrorBox message="Failed to load album" onRetry={() => void refetch()} />;
    }

    if (!album) return <CenteredSpinner className="min-h-[400px]" />;

    return <Navigate to={`/collection/${album.uuid}/songs/${songUUID}/comments`} replace />;
}
