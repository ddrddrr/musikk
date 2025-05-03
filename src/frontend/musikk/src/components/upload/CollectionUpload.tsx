import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageField } from "@/components/common/ImageField.tsx";
import { SongFields } from "@/components/upload/SongFields";
import { CollectionFormValues } from "@/components/upload/types";
import { useUpload } from "@/components/upload/useUpload";
import { UUID } from "@/config/types";
import { useEffect } from "react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";

interface CollectionUploadProps {
    form: UseFormReturn<CollectionFormValues>;
    fields: FieldArrayWithId<CollectionFormValues, "songs", "id">[];
    append: (value: CollectionFormValues["songs"][number]) => void;
    remove: (index: number | number[]) => void;
}

export function CollectionUpload({ form, fields, append, remove }: CollectionUploadProps) {
    const { statuses, createSongsMutation, createCollectionMutation, changeSongStatuses } = useUpload();
    useEffect(() => {
        if (fields.length > 0) {
            remove(fields.map((_, i) => i));
        }
    }, []);
    const isPending = createSongsMutation.status === "pending" || createCollectionMutation.status === "pending";

    const onSubmit = form.handleSubmit(async (vals) => {
        fields.forEach((_, i) => changeSongStatuses(i, {}));
        const authors: UUID[] = [];
        let songUUIDs: string[] = [];

        if (fields.length > 0) {
            const payload = fields.map((_, i) => ({
                key: `song_${i}`,
                title: vals.songs[i].title,
                description: vals.songs[i].description ?? "",
                audio: vals.songs[i].audio!,
                image: vals.songs[i].image,
            }));
            const { succeeded, failed } = await createSongsMutation.mutateAsync({
                authors,
                songs: payload,
            });

            fields.forEach((_, i) => {
                const key = `song_${i}`;
                const ok = succeeded.find((s) => s.key === key);
                if (ok) {
                    changeSongStatuses(i, { success: true, uuid: ok.uuid });
                } else {
                    const err = failed.find((f) => f.key === key);
                    changeSongStatuses(i, {
                        success: false,
                        errorMsg: err?.errors?.[0] ?? "Upload error",
                    });
                }
            });

            if (failed.length) return;
            songUUIDs = succeeded.map((s) => s.uuid);
        }

        await createCollectionMutation.mutateAsync({
            title: vals.title!,
            description: vals.description,
            private: vals.private,
            image: vals.image,
            authors,
            songs: songUUIDs,
        });
    });

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-sm border-2 border-gray-300 space-y-4">
                <FormField
                    control={form.control}
                    name="private"
                    render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                            <FormLabel>Private</FormLabel>
                            <FormControl>
                                <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Collection Title</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <ImageField name="image" />
            </div>

            <div className="text-xl font-semibold">Songs</div>
            {fields.map((f, i) => (
                <SongFields
                    key={f.id}
                    index={i}
                    isSuccess={statuses[i]?.success === true}
                    errorMsg={statuses[i]?.errorMsg}
                    onRemove={() => remove(i)}
                />
            ))}

            <Button
                type="button"
                onClick={() => {
                    append({ title: "", description: "" });
                }}
            >
                Add Another Song
            </Button>

            <div className="flex items-center space-x-4">
                <Button type="submit" disabled={isPending}>
                    {isPending ? <Spinner /> : "Create Collection"}
                </Button>
                {createCollectionMutation.status === "success" && (
                    <span className="text-green-600">Collection created!</span>
                )}
                {createCollectionMutation.status === "error" && (
                    <span className="text-red-600">
                        Failed: {createCollectionMutation.error?.message ?? "Unknown error"}
                    </span>
                )}
            </div>
        </form>
    );
}
