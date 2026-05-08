import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";
import { useFormContext } from "react-hook-form";

export function EmailField() {
    const { control } = useFormContext();
    return (
        <FormField
            control={control}
            name="email"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-lg font-bold text-foreground">Email</FormLabel>
                    <FormControl>
                        <div className="rounded-sm border-2 border-foreground p-3 transition-colors">
                            <Input
                                placeholder="Enter Email"
                                {...field}
                                className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </FormControl>
                    <FormMessage className="font-medium" />
                </FormItem>
            )}
        />
    );
}
