import { UUID } from "@/api/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { Form } from "@/features/ui/form.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import z from "zod";
import { SongSchema } from "../schemas.ts";
import { useSongUpload, type SongUploadJob } from "../useSongUpload.ts";
import { SongUploadCard } from "./SongUploadCard.tsx";

const AlbumSongUploadSchema = z.object({
    songs: z.array(SongSchema).min(1, "At least one song is required"),
});

type AlbumSongUploadFormValues = z.infer<typeof AlbumSongUploadSchema>;

type AlbumSongUploadSectionProps = {
    albumUUID: UUID;
    onComplete?: () => void;
};

export function AlbumSongUploadSection({ albumUUID, onComplete }: AlbumSongUploadSectionProps) {
    const form = useForm<AlbumSongUploadFormValues>({
        resolver: zodResolver(AlbumSongUploadSchema),
        defaultValues: {
            songs: [{ operationID: crypto.randomUUID(), title: "", audio: new File([], "") }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "songs" });
    const { uploadState, uploadSongs, clearUploadState } = useSongUpload();

    const appendSong = useCallback(() => {
        append({
            operationID: crypto.randomUUID(),
            title: "",
            audio: new File([], ""),
        });
    }, [append]);

    const removeSong = useCallback(
        (i: number) => {
            const songs = form.getValues("songs");
            const operationID = songs[i]?.operationID;

            if (operationID) {
                clearUploadState(operationID);
            }
            remove(i);
        },
        [form, remove, clearUploadState],
    );

    const processSongs = useCallback(
        async (data: AlbumSongUploadFormValues) => {
            const jobs: SongUploadJob[] = data.songs.map((song) => ({
                operationID: song.operationID || crypto.randomUUID(),
                data: {
                    title: song.title,
                    audio: song.audio,
                    image: song.image,
                    uuid: song.uuid,
                },
            }));

            jobs.forEach((job, i) => {
                if (!data.songs[i].operationID) {
                    form.setValue(`songs.${i}.operationID`, job.operationID);
                }
            });

            const songUUIDByOperationID = await uploadSongs(albumUUID, jobs);
            songUUIDByOperationID.forEach((songUUID, operationID) => {
                const idx = data.songs.findIndex((s) => s.operationID === operationID);
                if (idx >= 0) {
                    form.setValue(`songs.${idx}.uuid`, songUUID);
                }
            });
        },
        [albumUUID, form, uploadSongs],
    );

    const watchedSongs = form.watch("songs");
    const readyCount = watchedSongs.filter(
        (s) => s.operationID && uploadState[s.operationID]?.status === "ready",
    ).length;
    const totalCount = watchedSongs.length;
    const allSongsReady = readyCount === totalCount && totalCount > 0;

    return (
        <div className="flex flex-col gap-4">
            <Form {...form}>
                <div className="flex flex-col gap-4">
                    {fields.map((field, i) => (
                        <SongUploadCard
                            key={field.id}
                            index={i}
                            operationID={form.watch(`songs.${i}.operationID`)}
                            uploadState={uploadState}
                            onRemove={() => removeSong(i)}
                        />
                    ))}
                </div>

                <div className="flex flex-col gap-3 border-t pt-4">
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={appendSong}>
                            Add Song
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={form.handleSubmit(processSongs)}
                        >
                            Upload Songs
                        </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                            {allSongsReady
                                ? "All songs uploaded. You can create the album."
                                : `${readyCount} of ${totalCount} songs uploaded. Upload all songs to create.`}
                        </p>
                        <Button
                            type="button"
                            disabled={!allSongsReady}
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
