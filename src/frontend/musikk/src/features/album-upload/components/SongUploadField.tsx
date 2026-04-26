import { AudioField } from "@/features/common/AudioField";
import { ImageField } from "@/features/common/ImageField.tsx";
import { FormControl, FormField, FormItem, FormLabel } from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";

interface SongUploadProps {
    songIndex: number;
}

export function SongUploadField({ songIndex }: SongUploadProps) {
    return (
        <div className="flex flex-col gap-4">
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

            <ImageField name={`songs.${songIndex}.image`} />
            <AudioField name={`songs.${songIndex}.audio`} />

            <FormField
                name={`songs.${songIndex}.operationID`}
                render={({ field }) => <input type="hidden" {...field} />}
            />
            <FormField
                name={`songs.${songIndex}.uuid`}
                render={({ field }) => <input type="hidden" {...field} />}
            />
        </div>
    );
}
