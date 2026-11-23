import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

import { setFormServerErrors } from "@/api/errorUtils.ts";
import { useRegister } from "@/features/auth/api/mutations.ts";
import { useRegistrationSettingsQuery } from "@/features/auth/api/queries.ts";
import { EmailField } from "@/features/auth/components/EmailField.tsx";
import { PasswordField } from "@/features/auth/components/PasswordField.tsx";
import { FormServerError } from "@/features/common/FormServerError.tsx";
import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { Button } from "@/features/ui/button.tsx";
import { CardContent } from "@/features/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/features/ui/form.tsx";
import { Spinner } from "@/features/ui/spinner.tsx";
import { Switch } from "@/features/ui/switch.tsx";
import { cn } from "@/lib/utils.ts";

const signupSchema = z
    .object({
        email: z.string().email("Invalid email"),
        password1: z.string().min(8, "Minimum 8 chars"),
        password2: z.string().min(1, "Please confirm your password"),
        userRole: z.enum(["StreamingUser", "Artist"]),
        signupPassword: z.string(),
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
    const navigate = useNavigate();
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { userRole: "StreamingUser", signupPassword: "" },
    });

    const { mutate, isPending, data: needsEmailConfirmation } = useRegister();
    const {
        data: registrationSettings,
        error: registrationSettingsError,
        refetch: refetchRegistrationSettings,
    } = useRegistrationSettingsQuery();
    const signupPasswordRequired = registrationSettings?.signup_password_required === true;

    const onSubmit = (values: SignUpFormValues) => {
        form.clearErrors("root");
        mutate(values, {
            onSuccess(needsConfirmation) {
                if (!needsConfirmation) {
                    void navigate("/");
                }
            },
            onError(error) {
                setFormServerErrors(form, error, {
                    fieldMap: { signup_password: "signupPassword" },
                });
            },
        });
    };

    const serverErrorMessage = form.formState.errors.root?.serverError?.message;

    return (
        <CardContent className="flex flex-col gap-6">
            {registrationSettingsError && (
                <QueryErrorBox
                    message="Could not load the sign-up settings"
                    onRetry={() => void refetchRegistrationSettings()}
                />
            )}
            <Form {...form}>
                <form
                    onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
                    className="flex flex-col gap-6"
                >
                    <EmailField />
                    <PasswordField name="password1" label="Password" placeholder="Enter Password" />
                    <PasswordField
                        name="password2"
                        label="Confirm Password"
                        placeholder="Re-enter Password"
                    />
                    {signupPasswordRequired && (
                        <PasswordField
                            name="signupPassword"
                            label="Sign-up Password"
                            placeholder="Enter Sign-up Password"
                        />
                    )}
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
                    <FormServerError message={serverErrorMessage} />
                    {needsEmailConfirmation && (
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
