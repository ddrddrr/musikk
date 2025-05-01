import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

type Props = {
    control: Control;
};

export function EmailField({ control }: Props) {
    return (
        <FormField
            control={control}
            name="email"
            render={({ field }) => (
                <FormItem className="space-y-2">
                    <FormLabel className="text-lg font-bold">Email</FormLabel>
                    <FormControl>
                        <div className="bg-gray-200 p-2 border-2 border-black">
                            <Input
                                placeholder="Enter Email"
                                {...field}
                                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                            />
                        </div>
                    </FormControl>
                    <FormMessage className="text-red-600" />
                </FormItem>
            )}
        />
    );
}
