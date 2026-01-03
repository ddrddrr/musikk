import type { UUID } from "@/api/types";
import { ImageField } from "@/features/common/ImageField";
import { Button } from "@/features/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/features/ui/form";
import { Input } from "@/features/ui/input";
import { SongUploadCard } from "./SongUploadCard";
import { useCollectionUploadFormData } from "./useCollectionUploadFormData.ts";

export function CollectionUploadForm() {
    const {
        form,
        fields,
        songs,
        statusByUUID,
        songsStateByFieldId,
        canSubmit,
        appendSong,
        removeSong,
        uploadSongs,
        submitCollection,
        submitState,
        resetAll,
    } = useCollectionUploadFormData();

    const borderClass =
        submitState.status === "success"
            ? "border-green-500"
            : submitState.status === "error"
              ? "border-red-500"
              : "border-border";

    const message =
        submitState.status === "success"
            ? `Collection created successfully. Resetting in ${submitState.resetIn ?? 5}s.`
            : submitState.status === "error"
              ? (submitState.message ?? "Submit failed.")
              : submitState.status === "submitting"
                ? "Submitting..."
                : null;

    const messageClass =
        submitState.status === "success"
            ? "text-green-700"
            : submitState.status === "error"
              ? "text-red-700"
              : "text-muted-foreground";

    return (
        <div className="p-4 max-h-screen overflow-y-auto">
            <div className={`rounded-xl border-2 ${borderClass} bg-background p-4 shadow-sm`}>
                {message ? <div className={`text-sm mb-4 ${messageClass}`}>{message}</div> : null}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submitCollection)} className="space-y-6">
                        <div className="rounded-xl border bg-background p-4 shadow-sm space-y-4">
                            <div className="text-sm font-semibold">Collection</div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <ImageField name="image" />
                                </div>

                                <FormField
                                    name="private"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Visibility</FormLabel>
                                            <div className="flex items-center gap-2 pt-2">
                                                <FormControl>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!field.value}
                                                        onChange={(e) =>
                                                            field.onChange(e.target.checked)
                                                        }
                                                    />
                                                </FormControl>
                                                <div className="text-sm">Private</div>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, i) => (
                                <SongUploadCard
                                    key={field.id}
                                    index={i}
                                    fieldId={field.id}
                                    uuid={songs?.[i]?.uuid as UUID | undefined}
                                    statusByUUID={statusByUUID}
                                    songsStateByFieldId={songsStateByFieldId}
                                    onRemove={() => removeSong(i, field.id)}
                                />
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button type="button" variant="outline" onClick={appendSong}>
                                Add Song
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={form.handleSubmit(uploadSongs, (errors) =>
                                    console.log("validation errors", errors),
                                )}
                            >
                                Upload Songs
                            </Button>

                            <div className="flex-1" />

                            {(submitState.status === "success" ||
                                submitState.status === "error") && (
                                <Button type="button" variant="outline" onClick={resetAll}>
                                    Reset now
                                </Button>
                            )}

                            <Button
                                type="submit"
                                disabled={!canSubmit || submitState.status === "submitting"}
                            >
                                Submit
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
