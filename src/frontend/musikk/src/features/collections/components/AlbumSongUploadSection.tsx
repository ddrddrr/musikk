import { UUID } from "@/api/types.ts";
import { SongSchema } from "@/features/song-upload/schemas.ts";
import { useSongUpload, type SongUploadJob } from "@/features/song-upload/useSongUpload.ts";
import { Button } from "@/features/ui/button.tsx";
import { Form } from "@/features/ui/form.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import z from "zod";
import { SongUploadCard } from "../../song-upload/components/SongUploadCard.tsx";

const AlbumSongUploadSchema = z.object({
    songs: z.array(SongSchema).min(1, "At least one song is required"),
});

type AlbumSongUploadFormValues = z.infer<typeof AlbumSongUploadSchema>;

const DEFAULT_VALUES: AlbumSongUploadFormValues = {
    songs: [{ operationID: crypto.randomUUID(), title: "", audio: new File([], "") }],
};

type AlbumSongUploadSectionProps = {
    albumUUID: UUID;
    onComplete?: () => void;
};

export function AlbumSongUploadSection({ albumUUID, onComplete }: AlbumSongUploadSectionProps) {
    const form = useForm<AlbumSongUploadFormValues>({
        resolver: zodResolver(AlbumSongUploadSchema),
        defaultValues: DEFAULT_VALUES,
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

            const result = await uploadSongs(albumUUID, jobs);
            result.forEach((operationID, songUUID) => {
                const idx = data.songs.findIndex((s) => s.operationID === operationID);
                if (idx >= 0) {
                    form.setValue(`songs.${idx}.uuid`, songUUID);
                }
            });
        },
        [albumUUID, form, uploadSongs],
    );

    const allSongsReady = form
        .watch("songs")
        .every((s) => s.operationID && uploadState[s.operationID]?.status === "ready");

    return (
        <div className="space-y-4">
            <Form {...form}>
                <div className="space-y-4">
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

                <div className="flex flex-wrap gap-2 border-t pt-4">
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

                    <div className="flex-1" />

                    <Button type="button" disabled={!allSongsReady} onClick={onComplete}>
                        Complete Album
                    </Button>
                </div>
            </Form>
        </div>
    );
}
