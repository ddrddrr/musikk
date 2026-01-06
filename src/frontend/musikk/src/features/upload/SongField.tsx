import { ImageField } from "@/features/common/ImageField.tsx";
import { Spinner } from "@/features/common/Spinner.tsx";
import { FormControl, FormField, FormItem, FormLabel } from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";
import { AudioField } from "@/features/upload/AudioField.tsx";
import { SongUploadStatus } from "@/features/upload/types";

interface SongUploadProps {
    songIndex: number;
}

function statusTone(status: SongUploadStatus) {
    if (status === "ready") return "text-green-600 bg-green-50 border-green-200";
    if (status === "processing" || status === "queued" || status === "creating")
        return "text-amber-700 bg-amber-50 border-amber-200";
    if (status === "unknown") return "text-muted-foreground bg-muted border-border";
    return "text-red-600 bg-red-50 border-red-200";
}

function StatusBadge({ status, detail }: { status: SongUploadStatus; detail?: string }) {
    if (status === "processing") {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                <span>processing</span>
            </div>
        );
    }

    if (status === "unknown") return null;

    return (
        <div className="flex items-center gap-2">
            <div
                className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium ${statusTone(
                    status,
                )}`}
            >
                {status}
            </div>
            {detail ? (
                <div className="max-w-[50ch] truncate text-xs text-muted-foreground">{detail}</div>
            ) : null}
        </div>
    );
}

export function SongField({ songIndex }: SongUploadProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    name={`songs.${songIndex}.title`}
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
                    name={`songs.${songIndex}.description`}
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
                    <ImageField name={`songs.${songIndex}.image`} />
                </div>

                <div className="space-y-2">
                    <AudioField name={`songs.${songIndex}.audio`} />
                </div>
            </div>

            <FormField
                name={`songs.${songIndex}.uuid`}
                render={({ field }) => <input type="hidden" {...field} />}
            />
        </div>
    );
}

SongField.StatusBadge = StatusBadge;
