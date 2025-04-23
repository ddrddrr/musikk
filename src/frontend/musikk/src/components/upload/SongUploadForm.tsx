import Spinner from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { uploadSong } from "@/components/upload/mutations";
import SongFields from "@/components/upload/SongFields";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { FormSchema, SongFormValues } from "./types";

export function SongUploadForm() {
    const form = useForm<SongFormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: { songs: [{ title: "", description: "" }] },
    });
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "songs",
    });

    const [statuses, setStatuses] = useState<Record<number, boolean>>({});

    const mutation = useMutation({ mutationFn: uploadSong });

    const onSubmit = async (values: SongFormValues) => {
        const newStatuses = { ...statuses };
        await Promise.allSettled(
            values.songs.map(async (song, i) => {
                if (statuses[i]) return;
                try {
                    if (!song.audio) {
                        newStatuses[i] = false;
                        return;
                    }
                    await mutation.mutateAsync(song);
                    newStatuses[i] = true;
                } catch {
                    newStatuses[i] = false;
                }
            }),
        );
        setStatuses(newStatuses);
    };

    return (
        <div className="max-h-screen overflow-y-auto p-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {fields.map((_, i) => (
                        <SongFields
                            key={i}
                            index={i}
                            control={form.control}
                            isSuccess={statuses[i]}
                            onRemove={() => remove(i)}
                        />
                    ))}

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            onClick={() => append({ title: "", description: "" })}
                            className="flex-1 bg-gray-200 border-2 border-black"
                        >
                            Add Song
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 bg-red-600 text-white border-2 border-black"
                        >
                            {mutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <Spinner />
                                    Uploading...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Upload />
                                    Upload All
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
