import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/form";
import { Input } from "@/features/ui/input";
import { useFormContext } from "react-hook-form";

export interface FileFieldProps {
    name: string;
    accept: string;
    label: string;
    buttonText?: string;
    className?: string;
}

export function FileField({
    name,
    accept,
    label,
    buttonText = "Choose file",
    className,
}: FileFieldProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => {
                const { value, onChange, ...rest } = field;
                const file = value as File | undefined;

                return (
                    <FormItem className={`min-w-0 ${className ?? ""}`}>
                        <FormLabel>{label}</FormLabel>

                        <FormControl>
                            <div className="rounded-sm border-2 border-black bg-gray-200 p-4">
                                <label className="flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden">
                                    <span className="shrink-0 rounded border-2 border-black bg-red-600 px-2 py-1 text-sm font-medium text-white">
                                        {buttonText}
                                    </span>

                                    {file?.name && (
                                        <span className="min-w-0 flex-1 truncate text-sm">
                                            {file.name}
                                        </span>
                                    )}

                                    <Input
                                        type="file"
                                        accept={accept}
                                        className="hidden"
                                        {...rest}
                                        onChange={(e) => onChange(e.target.files?.[0])}
                                    />
                                </label>
                            </div>
                        </FormControl>

                        <FormMessage className="text-red-600" />
                    </FormItem>
                );
            }}
        />
    );
}
