import { api_client } from "@/api/axiosConf.ts";
import { getErrorDetail } from "@/api/errorUtils.ts";
import { UUID } from "@/api/types.ts";
import { AlbumUploadURLs } from "@/features/album-upload/api/endpoints.ts";
import { albumUploadKeys } from "@/features/album-upload/api/queryKeys.ts";
import { AlbumTrack } from "@/features/album-upload/types.ts";
import { collectionRemoveSong } from "@/features/collections/api/mutations.ts";
import { Mutation, useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface AlbumTrackUploadParams {
    // TODO: playlist/album song creation views
    operationID: UUID;
    position: number;
    title: string;
    audio: File;
    image?: File;
}

async function uploadAlbumTrack(
    albumUUID: UUID,
    params: AlbumTrackUploadParams,
): Promise<AlbumTrack> {
    const formData = new FormData();
    formData.append("operation_id", params.operationID);
    formData.append("position", String(params.position));
    formData.append("title", params.title);
    formData.append("audio", params.audio);
    if (params.image) {
        formData.append("image", params.image);
    }

    const res = await api_client.post<AlbumTrack>(AlbumUploadURLs.tracks(albumUUID), formData);
    return res.data;
}

export function useUploadAlbumTrack(albumUUID: UUID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: albumUploadKeys.uploads(albumUUID),
        mutationFn: (params: AlbumTrackUploadParams) => uploadAlbumTrack(albumUUID, params),
        // returning the promise keeps the upload pending until the new track is in the list,
        // so the track never disappears from the screen in between
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: albumUploadKeys.tracks(albumUUID) }),
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to upload song"));
        },
    });
}

function uploadVariables(mutation: Mutation): AlbumTrackUploadParams {
    return mutation.state.variables as AlbumTrackUploadParams;
}

export function useAlbumTrackUploadsInFlight(albumUUID: UUID): AlbumTrackUploadParams[] {
    return useMutationState({
        filters: { mutationKey: albumUploadKeys.uploads(albumUUID), status: "pending" },
        select: uploadVariables,
    });
}

export function useRemoveAlbumTrack(albumUUID: UUID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (collectionSongUUID: UUID) =>
            collectionRemoveSong({
                collectionUUID: albumUUID,
                songCollectionSongUUID: collectionSongUUID,
            }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: albumUploadKeys.tracks(albumUUID) }),
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to remove song"));
        },
    });
}
