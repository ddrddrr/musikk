import { AudioField } from "@/features/common/AudioField";
import { ImageField } from "@/features/common/ImageField.tsx";
import { FormControl, FormField, FormItem, FormLabel } from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";

interface SongUploadProps {
    songIndex: number;
}

export function SongUploadField({ songIndex }: SongUploadProps) {
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
