import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/modules/ui/form.tsx";
import { Input } from "@/modules/ui/input.tsx";
import { useFormContext } from "react-hook-form";

export function EmailField() {
    const { control } = useFormContext();
    return (
        <FormField
            control={control}
            name="email"
            render={({ field }) => (
                <FormItem className="space-y-2">
                    <FormLabel className="text-lg font-bold text-gray-900">Email</FormLabel>
                    <FormControl>
                        <div className="p-3 border-2 border-black rounded-md transition-colors">
                            <Input
                                placeholder="Enter Email"
                                {...field}
                                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 "
                            />
                        </div>
                    </FormControl>
                    <FormMessage className="font-medium" />
                </FormItem>
            )}
        />
    );
}
