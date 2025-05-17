import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { SongFields } from "@/components/upload/SongFields";
import { CollectionFormValues } from "@/components/upload/types";
import { useUpload } from "@/components/upload/useUpload";
import { useEffect } from "react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";

interface SongUploadProps {
    form: UseFormReturn<CollectionFormValues>;
    fields: FieldArrayWithId<CollectionFormValues, "songs", "id">[];
    remove: (index: number) => void;
}

export function SongUpload({ form, fields, remove }: SongUploadProps) {
    const { statuses, createSongsMutation, createCollectionMutation, changeSongStatuses } = useUpload();

    useEffect(() => {
        if (fields.length === 0) {
            form.setValue("songs", [{ title: "", description: "" }], { shouldValidate: true, shouldDirty: true });
        }
    }, [fields.length, form]);

    const onSubmit = form.handleSubmit(async (vals) => {
        changeSongStatuses(0, {});
        const song = vals.songs[0];
        const payload = {
            authors: [],
            songs: [
                {
                    key: "song_0",
                    title: song.title,
                    description: song.description || "",
                    audio: song.audio!,
                    image: song.image,
                },
            ],
        };

        try {
            const { succeeded, failed } = await createSongsMutation.mutateAsync(payload);
            if (failed.length) {
                const err = failed[0];
                changeSongStatuses(0, {
                    success: false,
                    errorMsg: err.errors?.[0] || "Upload error",
                });
                return;
            }
            const uuid = succeeded[0].uuid;
            changeSongStatuses(0, { success: true, uuid });
            await createCollectionMutation.mutateAsync({
                title: song.title,
                description: song.description,
                private: false,
                authors: [],
                songs: [uuid],
            });
        } catch (error) {
            console.log(error);
        }
    });

    const isPending = createSongsMutation.status === "pending" || createCollectionMutation.status === "pending";

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {fields.map((f, i) => (
                <SongFields
                    key={f.id}
                    index={i}
                    isSuccess={statuses[i]?.success === true}
                    errorMsg={statuses[i]?.errorMsg}
                    hideRemove
                    onRemove={() => remove(i)}
                />
            ))}

            <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner /> : "Upload Song"}
            </Button>
        </form>
    );
}
