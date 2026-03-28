import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { getErrorDetail } from "@/api/errorUtils.ts";
import { register } from "@/features/auth/api.ts";
import { EmailField } from "@/features/auth/components/EmailField.tsx";
import { PasswordField } from "@/features/auth/components/PasswordField.tsx";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/features/ui/button.tsx";
import { CardContent } from "@/features/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/features/ui/form.tsx";
import { Switch } from "@/features/ui/switch.tsx";
import * as z from "zod";

const signupSchema = z
    .object({
        email: z.string().email("Invalid email"),
        password1: z.string().min(8, "Minimum 8 chars"),
        password2: z.string().min(1, "Please confirm your password"),
        userRole: z.enum(["StreamingUser", "Artist"]),
    })
    .refine((data) => data.password1 === data.password2, {
        message: "Passwords do not match",
        path: ["password2"],
    });

type SignUpFormValues = z.infer<typeof signupSchema>;

export function SignUpForm() {
    const [formMessage, setFormMessage] = useState("");
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { userRole: "StreamingUser" },
    });

    const { mutate, isPending, isError, isSuccess } = useMutation({
        mutationFn: register,
        onError(error) {
            setFormMessage(getErrorDetail(error, "Could not perform registration, please try again."));
        },
        onSuccess() {
            setFormMessage(
                "Confirmation email has been sent. " +
                    "Please follow the link in the email and validate your account.",
            );
        },
    });

    const onSubmit = (values: SignUpFormValues) => {
        setFormMessage("");
        mutate(values);
    };

    return (
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                    <EmailField />
                    <PasswordField name="password1" label="Password" placeholder="Enter Password" />
                    <PasswordField
                        name="password2"
                        label="Confirm Password"
                        placeholder="Re-enter Password"
                    />
                    <FormField
                        control={form.control}
                        name="userRole"
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                    <Switch
                                        checked={field.value === "Artist"}
                                        onCheckedChange={(checked) =>
                                            field.onChange(checked ? "Artist" : "StreamingUser")
                                        }
                                    />
                                </FormControl>
                                <FormLabel className="m-0">I’m an artist</FormLabel>
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        variant="brand"
                        disabled={isPending}
                        size="lg"
                        className="w-full"
                    >
                        {isPending ? <Spinner /> : "Sign Up"}
                    </Button>
                    {formMessage && (
                        <div
                            className={[
                                "rounded-sm border-2 p-4 font-medium",
                                isError
                                    ? "border-red-900 bg-red-700 text-white"
                                    : isSuccess
                                      ? "border-green-900 bg-green-700 text-white"
                                      : "",
                            ].join(" ")}
                        >
                            {formMessage}
                        </div>
                    )}
                </form>
            </Form>
        </CardContent>
    );
}
