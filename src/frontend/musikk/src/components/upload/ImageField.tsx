import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ImageField({ index, control }: { index: number; control: any }) {
    return (
        <FormField
            control={control}
            name={`songs.${index}.image`}
            render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                        <div className="bg-gray-200 p-4 border-2 border-black rounded-md">
                            <label className="flex items-center cursor-pointer">
                                <span className="px-3 py-2 bg-red-600 text-white rounded mr-2">Choose file</span>
                                <span className="truncate text-sm">{value?.name ?? "No file selected"}</span>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        onChange(file);
                                    }}
                                    className="hidden"
                                    {...rest}
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
