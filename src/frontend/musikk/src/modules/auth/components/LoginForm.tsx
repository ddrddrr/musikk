import { useAuth } from "@/hooks/useAuth.ts";
import { EmailField } from "@/modules/auth/components/EmailField.tsx";
import { PasswordField } from "@/modules/auth/components/PasswordField.tsx";
import { Spinner } from "@/modules/common/Spinner.tsx";
import { Button } from "@/modules/ui/button.tsx";
import { CardContent } from "@/modules/ui/card.tsx";
import { Form } from "@/modules/ui/form.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

const loginSchema = z.object({
    email: z.string().min(5, "Email is required."),
    password: z.string().min(8, "Password is required."),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setmessage] = useState("");

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (values: LoginFormValues) => {
        setmessage("");
        setLoading(true);
        try {
            await login(values.email, values.password);
            navigate("/");
        } catch (error) {
            const resMessage = isAxiosError(error)
                ? error.response?.data?.message || error.message
                : String(error);
            console.error(`Login failed, ${resMessage}`);
            setmessage("Could not perform login, please check your credentials and try again.");
        } finally {
            setLoading(false);
        }
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
                        disabled={loading}
                    >
                        {loading ? <Spinner /> : "Login"}
                    </Button>

                    {message && (
                        <div className="p-4 bg-red-700 border-2 border-red-900 text-white rounded-md">
                            <p className="font-medium">{message}</p>
                        </div>
                    )}

                    <div className="text-center">
                        <p className="text-gray-700">
                            Don't have an account?
                            <Button
                                type="button"
                                onClick={() => navigate("/signup")}
                                variant="link"
                                size="sm"
                                className="ml-1 text-red-600 hover:text-red-700"
                            >
                                Sign up
                            </Button>
                        </p>
                    </div>
                </form>
            </Form>
        </CardContent>
    );
}
