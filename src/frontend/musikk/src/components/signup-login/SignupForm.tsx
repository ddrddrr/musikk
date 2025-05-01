import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Spinner } from "@/components/common/Spinner";
import { EmailField } from "@/components/signup-login/EmailField.tsx";
import { userCreate } from "@/components/signup-login/mutations.ts";
import { PasswordField } from "@/components/signup-login/PasswordField.tsx";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

const signupSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Minimum 8 chars"),
    userRole: z.enum(["StreamingUser", "Artist"]),
});

type SignUpFormValues = z.infer<typeof signupSchema>;

export function SignUpForm() {
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { userRole: "StreamingUser" },
    });

    const { mutate, isPending, isError, isSuccess } = useMutation({
        mutationFn: userCreate,
        onError(error) {
            const msg = axios.isAxiosError(error) ? error.response?.data?.error || error.message : "An error occurred";
            setMessage(msg);
        },
        onSuccess() {
            setMessage("Account created successfully. Redirecting to login page.");
            setTimeout(() => navigate("/login"), 5000);
        },
    });

    const onSubmit = (values: SignUpFormValues) => {
        console.log("signup values:", values);
        setMessage("");
        mutate(values);
    };

    return (
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                    <EmailField control={form.control} />
                    <PasswordField control={form.control} />
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
                        disabled={isPending}
                        className="w-full bg-red-600 hover:bg-red-700 text-white border-2 border-black p-6"
                    >
                        {isPending ? <Spinner /> : "Sign Up"}
                    </Button>
                    {message && (
                        <div
                            className={[
                                "p-3 border-2 rounded",
                                isError
                                    ? "bg-red-100 border-red-500 text-red-700"
                                    : isSuccess
                                      ? "bg-green-100 border-green-500 text-green-700"
                                      : "",
                            ].join(" ")}
                        >
                            {message}
                        </div>
                    )}{" "}
                </form>
            </Form>
        </CardContent>
    );
}
