import { login } from "@/auth/authentication";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

import { Spinner } from "@/components/common/Spinner";
import { EmailField } from "@/components/signup-login/EmailField";
import { PasswordField } from "@/components/signup-login/PasswordField";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
    email: z.string().min(5, "Email is required."),
    password: z.string().min(8, "Password is required."),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const navigate = useNavigate();
    const client = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (values: LoginFormValues) => {
        setMessage("");
        setLoading(true);
        try {
            await login(values.email, values.password);
            client.invalidateQueries({ queryKey: ["user"] });
            navigate("/");
        } catch (error) {
            const resMessage = axios.isAxiosError(error)
                ? error.response?.data?.message || error.message
                : String(error);
            setMessage(resMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                    <EmailField />
                    <PasswordField />

                    <Button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white border-2 border-black p-6"
                        disabled={loading}
                    >
                        {loading ? <Spinner /> : "Login"}
                    </Button>

                    {message && (
                        <div className="p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded">
                            <p>{message}</p>
                        </div>
                    )}

                    <div className="text-center">
                        <p>
                            Don't have an account?
                            <Button
                                onClick={() => navigate("/signup")}
                                className="w-30 bg-red-600 hover:bg-red-700 text-white border-2 border-black p-4"
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
