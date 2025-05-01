import { login } from "@/auth/authentication";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

import { Spinner } from "@/components/common/Spinner";
import { EmailField } from "@/components/signup-login/EmailField";
import { PasswordField } from "@/components/signup-login/PasswordField";
import { IJWTPayload } from "@/components/signup-login/types.ts";
import { fetchUser } from "@/components/user/queries.ts";
import { UserContext } from "@/providers/userContext.ts";
import Cookies from "js-cookie";

const loginSchema = z.object({
    email: z.string().min(3, "This field is required!"),
    password: z.string().min(8, "This field is required!"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const { setUser } = useContext(UserContext);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (values: LoginFormValues) => {
        setMessage("");
        setLoading(true);
        try {
            await login(values.email, values.password);
            const decodedToken = jwtDecode<IJWTPayload>(Cookies.get("access"));
            const user = await fetchUser(decodedToken.uuid);
            setUser(user);
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
                    <EmailField control={form.control} />
                    <PasswordField control={form.control} />

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
                            Don't have an account?{"   "}
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
