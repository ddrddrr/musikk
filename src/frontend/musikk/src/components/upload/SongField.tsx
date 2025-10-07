import { ImageField } from "@/components/common/ImageField.tsx";
import { Spinner } from "@/components/common/Spinner.tsx";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { AudioField } from "@/components/upload/AudioField.tsx";
import { SongUploadStatus } from "@/components/upload/types.ts";

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
