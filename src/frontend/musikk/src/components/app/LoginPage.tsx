import { login } from "@/auth/authentication.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";

const loginSchema = z.object({
    email: z.string().min(3, "This field is required!"),
    password: z.string().min(8, "This field is required!"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// TODO: add signup logic
export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [showPassword, setShowPassword] = useState(false);
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
            navigate(location.state || "/");
        } catch (error) {
            let resMessage;
            if (axios.isAxiosError(error)) {
                resMessage = error.response?.data?.message || error.message || error.toString();
            } else {
                resMessage = String(error);
            }
            setMessage(resMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col items-center justify-center min-h-screen")}>
            <Card className="border-2 border-black shadow-none w-full max-w-md">
                {" "}
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-lg font-bold">Email</FormLabel>
                                        <FormControl>
                                            <div className="bg-gray-200 p-2 border-2 border-black">
                                                <Input
                                                    placeholder="Enter your email"
                                                    {...field}
                                                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
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

                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white border-2 border-black p-6"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    "Login"
                                )}
                            </Button>

                            {message && (
                                <div className="p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded">
                                    <p>{message}</p>
                                </div>
                            )}

                            <div className="text-center">
                                <p>
                                    Don't have an account?{" "}
                                    <a href="#" className="text-red-600 hover:underline">
                                        Sign up
                                    </a>
                                </p>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
