import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { setFormServerErrors } from "@/api/errorUtils.ts";
import { register } from "@/features/auth/api.ts";
import { EmailField } from "@/features/auth/components/EmailField.tsx";
import { PasswordField } from "@/features/auth/components/PasswordField.tsx";
import { Button } from "@/features/ui/button.tsx";
import { CardContent } from "@/features/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/features/ui/form.tsx";
import { Spinner } from "@/features/ui/spinner";
import { Switch } from "@/features/ui/switch.tsx";
import { cn } from "@/lib/utils.ts";

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

const SUCCESS_MESSAGE =
    "Confirmation email has been sent. " +
    "Please follow the link in the email and validate your account.";

export function SignUpForm() {
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { userRole: "StreamingUser" },
    });

    const { mutate, isPending, isSuccess } = useMutation({
        mutationFn: register,
        onError(error) {
            setFormServerErrors(form, error);
        },
    });

    const onSubmit = (values: SignUpFormValues) => {
        form.clearErrors("root");
        mutate(values);
    };

    const serverErrorMessage = form.formState.errors.root?.serverError?.message;

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
                            <FormItem className="flex items-center gap-2">
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
                    {serverErrorMessage && (
                        <div
                            className={cn(
                                "rounded-sm border-2 p-4 font-medium",
                                "border-destructive bg-destructive text-destructive-foreground",
                            )}
                        >
                            {serverErrorMessage}
                        </div>
                    )}
                    {isSuccess && (
                        <div
                            className={cn(
                                "rounded-sm border-2 p-4 font-medium",
                                "border-success bg-success text-success-foreground",
                            )}
                        >
                            {SUCCESS_MESSAGE}
                        </div>
                    )}
                </form>
            </Form>
        </CardContent>
    );
}
