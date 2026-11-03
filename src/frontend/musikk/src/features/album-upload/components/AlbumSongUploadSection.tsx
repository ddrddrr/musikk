import { UUID } from "@/api/types.ts";
import {
    useAlbumTrackUploadsInFlight,
    useRemoveAlbumTrack,
    useUploadAlbumTrack,
} from "@/features/album-upload/api/mutations.ts";
import { useAlbumTracksQuery } from "@/features/album-upload/api/queries.ts";
import { AlbumTrackCard } from "@/features/album-upload/components/AlbumTrackCard.tsx";
import { SongUploadCard } from "@/features/album-upload/components/SongUploadCard.tsx";
import { SongSchema } from "@/features/album-upload/schemas.ts";
import { AlbumTrack } from "@/features/album-upload/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Form } from "@/features/ui/form.tsx";
import { Spinner } from "@/features/ui/spinner.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import z from "zod";

const AlbumSongUploadSchema = z.object({
    songs: z.array(SongSchema),
});

type AlbumSongUploadFormValues = z.infer<typeof AlbumSongUploadSchema>;
type SongRow = AlbumSongUploadFormValues["songs"][number];

interface SentFiles {
    audio: File;
    image?: File;
}

const MAX_CONCURRENT_UPLOADS = 3;

function newRow(position: number, title = "", files?: SentFiles): SongRow {
    return {
        operationID: crypto.randomUUID(),
        position,
        title,
        audio: files?.audio ?? new File([], ""),
        image: files?.image,
    };
}

function hasFile(row: SongRow): boolean {
    return row.audio.name !== "";
}

function nextPosition(positions: number[]): number {
    return positions.length === 0 ? 0 : Math.max(...positions) + 1;
}

// the number a track gets in the finished album, so form rows and server tracks share one order
function trackNumbersByPosition(items: { key: UUID; position: number }[]): Map<UUID, number> {
    const sorted = [...items].sort((a, b) => a.position - b.position);
    return new Map(sorted.map((item, i) => [item.key, i + 1]));
}

function isUploadGone(error: unknown): boolean {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    return status === 403 || status === 404;
}

// starts the next upload as soon as one finishes, so one big file doesn't hold back the rest
async function runWithLimit<T>(items: T[], limit: number, run: (item: T) => Promise<void>) {
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            await run(items[next++]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

type AlbumSongUploadSectionProps = {
    albumUUID: UUID;
    onComplete?: () => void;
};

export function AlbumSongUploadSection({ albumUUID, onComplete }: AlbumSongUploadSectionProps) {
    const tracksQuery = useAlbumTracksQuery(albumUUID);
    // a failed background refetch keeps the last data, and the form must stay mounted then,
    // otherwise the rows that were not sent yet are lost
    const tracks = tracksQuery.data;

    if (tracks !== undefined) {
        return (
            <AlbumSongUploadForm albumUUID={albumUUID} tracks={tracks} onComplete={onComplete} />
        );
    }

    if (tracksQuery.isPending) {
        return (
            <div className="flex justify-center">
                <Spinner />
            </div>
        );
    }

    if (isUploadGone(tracksQuery.error)) {
        return (
            <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
                <p>This album upload is not available anymore.</p>
                <Button asChild variant="outline">
                    <Link to="/upload">Start a new album</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
            <p>Could not load the songs of this album.</p>
            <Button type="button" variant="outline" onClick={() => void tracksQuery.refetch()}>
                Try again
            </Button>
        </div>
    );
}

function AlbumSongUploadForm({
    albumUUID,
    tracks,
    onComplete,
}: AlbumSongUploadSectionProps & { tracks: AlbumTrack[] }) {
    const form = useForm<AlbumSongUploadFormValues>({
        resolver: zodResolver(AlbumSongUploadSchema),
        defaultValues: { songs: tracks.length === 0 ? [newRow(0)] : [] },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "songs" });

    const uploadTrack = useUploadAlbumTrack(albumUUID);
    const removeTrack = useRemoveAlbumTrack(albumUUID);
    const uploadsInFlight = useAlbumTrackUploadsInFlight(albumUUID);
    // kept so a retry after a failed processing doesn't make the user pick the file again
    const sentFiles = useRef(new Map<UUID, SentFiles>());
    // rows of the running batch, also the ones still waiting for a free upload slot.
    // They are locked, because the batch sends the values from the moment of the click
    const [batchIDs, setBatchIDs] = useState<ReadonlySet<UUID>>(new Set());

    const rows = useWatch({ control: form.control, name: "songs" });
    const uploadingIDs = new Set(uploadsInFlight.map((upload) => upload.operationID));

    const appendRow = (title?: string, files?: SentFiles, position?: number) => {
        const knownPositions = [
            ...tracks.map((track) => track.position),
            ...uploadsInFlight.map((upload) => upload.position),
            ...form.getValues("songs").map((row) => row.position),
        ];
        append(newRow(position ?? nextPosition(knownPositions), title, files));
    };

    const removeRow = (operationID: UUID) => {
        const index = form.getValues("songs").findIndex((row) => row.operationID === operationID);
        if (index >= 0) {
            remove(index);
        }
    };

    const uploadRow = async (row: SongRow) => {
        sentFiles.current.set(row.operationID, { audio: row.audio, image: row.image });
        try {
            await uploadTrack.mutateAsync({
                operationID: row.operationID,
                position: row.position,
                title: row.title,
                audio: row.audio,
                image: row.image,
            });
            removeRow(row.operationID);
        } catch {
            // the mutation hook shows the error, and the row stays in the form for another try
        }
    };

    const uploadRows = async (data: AlbumSongUploadFormValues) => {
        setBatchIDs(new Set(data.songs.map((row) => row.operationID)));
        try {
            await runWithLimit(data.songs, MAX_CONCURRENT_UPLOADS, uploadRow);
        } finally {
            setBatchIDs(new Set());
        }
    };

    const retryTrack = (track: AlbumTrack) => {
        const files = track.operation_id ? sentFiles.current.get(track.operation_id) : undefined;
        removeTrack
            .mutateAsync(track.collection_song_uuid)
            .then(() => appendRow(track.title, files, track.position))
            .catch(() => {
                // the mutation hook shows the error, and the failed track stays in the list
            });
    };

    const trackNumbers = trackNumbersByPosition([
        ...tracks.map((track) => ({ key: track.collection_song_uuid, position: track.position })),
        ...fields.map((field) => ({ key: field.operationID, position: field.position })),
    ]);

    const isUploading = uploadsInFlight.length > 0 || form.formState.isSubmitting;
    const readyCount = tracks.filter((track) => track.status === "ready").length;
    const unsentCount = rows.filter(hasFile).length;
    const totalCount = tracks.length + unsentCount;
    const canCreate =
        tracks.length > 0 && readyCount === tracks.length && !isUploading && unsentCount === 0;

    return (
        <div className="flex flex-col gap-4">
            {tracks.length > 0 && (
                <div className="flex flex-col gap-2">
                    {tracks.map((track) => (
                        <AlbumTrackCard
                            key={track.collection_song_uuid}
                            track={track}
                            trackNumber={trackNumbers.get(track.collection_song_uuid)}
                            disabled={removeTrack.isPending}
                            onRemove={() => removeTrack.mutate(track.collection_song_uuid)}
                            onRetry={() => retryTrack(track)}
                        />
                    ))}
                </div>
            )}

            <Form {...form}>
                <div className="flex flex-col gap-4">
                    {fields.map((field, i) => (
                        <SongUploadCard
                            key={field.id}
                            index={i}
                            trackNumber={trackNumbers.get(field.operationID)}
                            uploading={uploadingIDs.has(field.operationID)}
                            locked={batchIDs.has(field.operationID)}
                            onRemove={() => removeRow(field.operationID)}
                        />
                    ))}
                </div>

                <div className="flex flex-col gap-3 border-t pt-4">
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => appendRow()}>
                            Add Song
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            disabled={isUploading || fields.length === 0}
                            onClick={(e) => void form.handleSubmit(uploadRows)(e)}
                        >
                            Upload Songs
                        </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                            {canCreate
                                ? "All songs uploaded. You can create the album."
                                : `${readyCount} of ${totalCount} songs ready. Upload all songs to create.`}
                        </p>
                        <Button
                            type="button"
                            disabled={!canCreate}
                            onClick={onComplete}
                            className="shrink-0"
                        >
                            Create Album
                        </Button>
                    </div>
                </div>
            </Form>
        </div>
    );
}
