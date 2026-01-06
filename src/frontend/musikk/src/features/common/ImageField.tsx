import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";
import { useFormContext } from "react-hook-form";

type ImageFieldProps = {
    name: string;
    label?: string;
    buttonText?: string;
    accept?: string;
    className?: string;
};

export function ImageField({
    name,
    label = "Image",
    buttonText = "Choose file",
    accept = "image/*",
    className,
}: ImageFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
                <FormItem className={`min-w-0 ${className ?? ""}`}>
                    <FormLabel>{label}</FormLabel>

                    <FormControl>
                        <div className="rounded-sm border-2 border-black bg-gray-200 p-4">
                            <label className="flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden">
                                <span className="shrink-0 rounded border-2 border-black bg-red-600 px-2 py-1 text-sm font-medium text-white">
                                    {buttonText}
                                </span>
                                {value?.name && (
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                        {value?.name}
                                    </span>
                                )}

                                <Input
                                    type="file"
                                    accept={accept}
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
