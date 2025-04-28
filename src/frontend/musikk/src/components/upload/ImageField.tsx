import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function ImageField({ name, control }: { name: string; control: any }) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
                <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                        <div className="bg-gray-200 p-4 border-2 border-black rounded-sm">
                            <label className="flex items-center cursor-pointer">
                                <span className="px-3 py-2 bg-red-600 text-white rounded mr-2">Choose file</span>
                                <span className="truncate text-sm">{value?.name ?? "No file selected"}</span>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => onChange(e.target.files?.[0])}
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
