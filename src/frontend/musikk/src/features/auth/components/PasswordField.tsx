import { Button } from "@/features/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

type PasswordFieldProps = {
    name: string;
    label?: string;
    placeholder?: string;
};

export function PasswordField({
    name,
    label = "Password",
    placeholder = "Enter Password",
}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { control } = useFormContext();
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-lg font-bold text-foreground">{label}</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-2 rounded-sm border-2 border-foreground p-3 transition-colors">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder={placeholder}
                                {...field}
                                className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowPassword(!showPassword)}
                                className="size-8 shrink-0"
                            >
                                {showPassword ? (
                                    <EyeOff className="size-5" />
                                ) : (
                                    <Eye className="size-5" />
                                )}
                            </Button>
                        </div>
                    </FormControl>
                    <FormMessage className="font-medium" />
                </FormItem>
            )}
        />
    );
}
