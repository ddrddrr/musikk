import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function AudioField({ index, control }: { index: number; control: any }) {
    return (
        <FormField
            control={control}
            name={`songs.${index}.audio`}
            render={({ field: { onChange, value } }) => (
                <FormItem>
                    <FormLabel>Audio File</FormLabel>
                    <FormControl>
                        <div className="bg-gray-200 p-4 border-2 border-black rounded-md">
                            <label className="flex items-center cursor-pointer">
                                <span className="px-3 py-2 bg-red-600 text-white rounded mr-2">Choose file</span>
                                <span className="truncate text-sm">{value?.name ?? "No file selected"}</span>
                                <Input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => onChange(e.target.files?.[0])}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </FormControl>
                    <FormMessage className="text-red-600" />
                </FormItem>
            )}
        />
    );
}
