import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

interface AudioFieldProps {
    name: string;
}

export function AudioField({ name }: AudioFieldProps) {
    const { control } = useFormContext();
    return (
        <FormField
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
                <FormItem>
                    <FormLabel>Audio File</FormLabel>
                    <FormControl>
                        <div className="bg-gray-200 p-4 border-2 border-black rounded-sm">
                            <label className="flex items-center cursor-pointer">
                                <Button asChild variant="brand" className="px-3 py-2 mr-2">
                                    <span>Choose file</span>
                                </Button>{" "}
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
