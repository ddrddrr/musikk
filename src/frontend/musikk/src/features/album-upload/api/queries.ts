import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { AlbumUploadURLs } from "@/features/album-upload/api/endpoints.ts";
import { albumUploadKeys } from "@/features/album-upload/api/queryKeys.ts";
import { AlbumTrack } from "@/features/album-upload/types.ts";
import { Query, useQuery } from "@tanstack/react-query";

// the WS event usually comes first, polling only covers a lost event
const IN_PROGRESS_REFETCH_INTERVAL_MS = 5_000;

async function fetchAlbumTracks(albumUUID: UUID): Promise<AlbumTrack[]> {
    const res = await api_client.get<AlbumTrack[]>(AlbumUploadURLs.tracks(albumUUID));
    return res.data;
}

function isTrackInProgress(track: AlbumTrack): boolean {
    return track.status === "queued" || track.status === "processing";
}

function refetchWhileInProgress(query: Query<AlbumTrack[]>): number | false {
    const inProgress = query.state.data?.some(isTrackInProgress) ?? false;
    return inProgress ? IN_PROGRESS_REFETCH_INTERVAL_MS : false;
}

function sortByPosition(tracks: AlbumTrack[]): AlbumTrack[] {
    return [...tracks].sort((a, b) => a.position - b.position);
}

export function useAlbumTracksQuery(albumUUID: UUID) {
    return useQuery({
        queryKey: albumUploadKeys.tracks(albumUUID),
        queryFn: () => fetchAlbumTracks(albumUUID),
        select: sortByPosition,
        refetchInterval: refetchWhileInProgress,
    });
}
