import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form";
import { createSong } from "@/components/upload/mutations.ts";
import { SongField } from "@/components/upload/SongField.tsx";
import { CollectionUploadFormValues, CollectionUploadSchema, SongUploadState } from "@/components/upload/types";
import { useHandleUploadEvent } from "@/components/upload/useHandleUploadEvent.ts";
import { useUserEvent } from "@/events/useUserEvent.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";

export function CollectionUploadForm() {
    const [uploadStatuses, setUploadStatuses] = useState<SongUploadState[]>([]);

    const form = useForm<CollectionUploadFormValues>({
        resolver: zodResolver(CollectionUploadSchema),
        defaultValues: {
            title: "",
            private: false,
            description: "",
            image: undefined,
            songs: [{ title: "", description: "", audio: new File([], ""), image: undefined }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "songs",
    });

    async function uploadSongs(data: CollectionUploadFormValues) {
        console.log("▶ uploadSongs called with", data);

        setUploadStatuses((prev) => prev.map((v) => (v.status === "failed" ? { ...v, status: "processing" } : v)));
        for (let i = 0; i < data.songs.length; i++) {
            const song = data.songs[i];
            if (!song.uuid) {
                try {
                    const { uuid } = await createSong(song);
                    form.setValue(`songs.${i}.uuid`, uuid);
                    setUploadStatuses((prev) => [...prev, { uploadId: uuid, status: "processing" }]);
                } catch {
                    setUploadStatuses((prev) => [...prev, { uploadId: "", status: "failed" }]);
                }
            }
        }
    }

    const onSubmit: SubmitHandler<CollectionUploadFormValues> = async (data) => {
        console.log("submitted", data);
    };

    useUserEvent({
        handleEvent: useHandleUploadEvent(setUploadStatuses, form.setValue),
        eventKey: "upload",
    });

    // when all songs have a uuid, request to create a collection
    // if some is in the error state - disable submit
    // somehow allow to retry an upload of a specific song

    return (
        <div className="p-4 max-h-screen overflow-y-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    {fields.map((field, i) => {
                        const statusObj = uploadStatuses[i];
                        const status = statusObj?.status ?? "idle";

                        return (
                            <div key={field.id}>
                                <SongField songIndex={i} status={status} />
                                <Button onClick={() => remove(i)}>Remove Song</Button>
                            </div>
                        );
                    })}
                    <Button
                        onClick={() =>
                            append({ title: "", description: "", audio: new File([], ""), image: undefined })
                        }
                    >
                        Add Song
                    </Button>

                    <Button
                        type="button"
                        onClick={form.handleSubmit(uploadSongs, (errors) => console.log("validation errors", errors))}
                    >
                        Validate Songs
                    </Button>
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </div>
    );
}
