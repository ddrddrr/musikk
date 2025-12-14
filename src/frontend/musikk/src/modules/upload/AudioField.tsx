import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/modules/ui/form";
import { Input } from "@/modules/ui/input";
import { useFormContext } from "react-hook-form";

interface AudioFieldProps {
    name: string;
    label?: string;
    buttonText?: string;
    accept?: string;
    className?: string;
}

export function AudioField({
    name,
    label = "Audio File",
    buttonText = "Choose file",
    accept = "audio/*",
    className,
}: AudioFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
                <FormItem className={`min-w-0 ${className ?? ""}`}>
                    <FormLabel>{label}</FormLabel>

                    <FormControl>
                        <div className="bg-gray-200 p-4 border-2 border-black rounded-sm">
                            <label className="flex w-full min-w-0 items-center gap-3 cursor-pointer overflow-hidden">
                                <span className="shrink-0 bg-red-600 text-white border-2 border-black rounded px-2 py-1 text-sm font-medium">
                                    {buttonText}
                                </span>

                                <div className="min-w-0 flex-1 w-0">
                                    <span className="block truncate text-sm">
                                        {value?.name ?? "No file selected"}
                                    </span>
                                </div>

                                <Input
                                    type="file"
                                    accept={accept}
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
