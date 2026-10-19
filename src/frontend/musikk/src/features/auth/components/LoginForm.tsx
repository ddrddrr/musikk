import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";

import { setFormServerErrors } from "@/api/errorUtils.ts";
import { EmailField } from "@/features/auth/components/EmailField.tsx";
import { PasswordField } from "@/features/auth/components/PasswordField.tsx";
import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { FormServerError } from "@/features/common/FormServerError.tsx";
import { Button } from "@/features/ui/button.tsx";
import { CardContent } from "@/features/ui/card.tsx";
import { Form } from "@/features/ui/form.tsx";
import { Spinner } from "@/features/ui/spinner.tsx";

const loginSchema = z.object({
    email: z.string().min(5, "Email is required."),
    password: z.string().min(8, "Password is required."),
});
type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginLocationState {
    from?: { pathname: string };
}

export function LoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = (location.state as LoginLocationState | null)?.from?.pathname ?? "/";

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });
    const serverErrorMessage = form.formState.errors.root?.serverError?.message;

    const { mutate, isPending } = useMutation({
        mutationFn: (values: LoginFormValues) => login(values.email, values.password),
        onSuccess() {
            void navigate(redirectTo);
        },
        onError(error) {
            setFormServerErrors(form, error);
        },
    });

    const onSubmit = (values: LoginFormValues) => {
        form.clearErrors("root");
        mutate(values);
    };

    return (
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                    <EmailField />
                    <PasswordField name={"password"} />

                    <Button
                        type="submit"
                        variant="brand"
                        size="lg"
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending ? <Spinner /> : "Login"}
                    </Button>

                    <FormServerError message={serverErrorMessage} />

                    <div className="text-center">
                        <p className="text-foreground">
                            Don&#39;t have an account?
                            <Button
                                variant="link"
                                size="sm"
                                className="ml-1 text-brand hover:text-brand-hover"
                                asChild
                            >
                                <Link to="/signup">Sign up</Link>
                            </Button>
                        </p>
                    </div>
                </form>
            </Form>
        </CardContent>
    );
}
