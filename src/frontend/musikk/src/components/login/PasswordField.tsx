import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Control, FieldValues } from "react-hook-form";

type Props = {
    control: Control;
};

export default function PasswordField({ control }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <FormField
            control={control}
            name="password"
            render={({ field }) => (
                <FormItem className="space-y-2">
                    <div className="flex items-center justify-between">
                        <FormLabel className="text-lg font-bold">Password</FormLabel>
                    </div>
                    <FormControl>
                        <div className="relative bg-gray-200 p-2 border-2 border-black">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 pr-10"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-2 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <Eye className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                        </div>
                    </FormControl>
                    <FormMessage className="text-red-600" />
                </FormItem>
            )}
        />
    );
}
