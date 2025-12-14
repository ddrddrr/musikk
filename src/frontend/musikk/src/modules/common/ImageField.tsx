import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/modules/ui/form.tsx";
import { Input } from "@/modules/ui/input.tsx";
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
                        <div className="bg-gray-200 p-4 border-2 border-black rounded-sm">
                            <label className="flex w-full min-w-0 items-center gap-3 cursor-pointer overflow-hidden">
                                <span className="shrink-0 bg-red-600 text-white border-2 border-black rounded px-2 py-1 text-sm font-medium">
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
