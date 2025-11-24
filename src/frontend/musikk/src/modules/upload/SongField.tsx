import { ImageField } from "@/modules/common/ImageField.tsx";
import { Spinner } from "@/modules/common/Spinner.tsx";
import { FormControl, FormField, FormItem, FormLabel } from "@/modules/ui/form.tsx";
import { Input } from "@/modules/ui/input.tsx";
import { AudioField } from "@/modules/upload/AudioField.tsx";
import { SongUploadStatus } from "@/modules/upload/types.ts";

interface SongUploadProps {
    songIndex: number;
    status: SongUploadStatus;
}

export function SongField({ songIndex, status }: SongUploadProps) {
    return (
        <>
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

            <ImageField name={`songs.${songIndex}.image`} />
            <AudioField name={`songs.${songIndex}.audio`} />

            <FormField name={`songs.${songIndex}.uuid`} render={({ field }) => <input type="hidden" {...field} />} />

            <div className="mt-2">
                {status === "processing" && <Spinner />}
                {status !== "processing" && status !== "idle" && (
                    <div
                        className={`inline-block px-2 py-1 text-sm font-medium rounded ${
                            status === "success" ? "text-green-600" : "text-red-600"
                        }`}
                    >
                        {status}
                    </div>
                )}
            </div>
        </>
    );
}
