import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/form";
import { Input } from "@/features/ui/input";
import { cn } from "@/lib/utils.ts";
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
                    <FormItem className={cn("min-w-0", className)}>
                        <FormLabel>{label}</FormLabel>

                        <FormControl>
                            <div className="overflow-hidden rounded-sm border-2 border-foreground bg-muted p-4">
                                <label className="flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden">
                                    <span className="shrink-0 rounded border-2 border-foreground bg-brand px-2 py-1 text-sm font-medium text-brand-foreground">
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

                        <FormMessage className="text-destructive" />
                    </FormItem>
                );
            }}
        />
    );
}
