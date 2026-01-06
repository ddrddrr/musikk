import { ImageField } from "@/features/common/ImageField.tsx";
import { Avatar, AvatarImage } from "@/features/ui/avatar.tsx";
import { Button } from "@/features/ui/button.tsx";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import { useMeUpdateMutation } from "@/features/user/mutations.tsx";
import { ProfileFormSchema, ProfileFormValues } from "@/features/user/types.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function ProfileForm() {
    const { user } = useAuth();

    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
    const [message, setMessage] = useState<string | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            avatar: undefined,
            display_name: user?.display_name,
            bio: user?.bio,
        },
    });

    const mutation = useMeUpdateMutation();

    const borderClass =
        submitStatus === "success"
            ? "border-green-500"
            : submitStatus === "error"
              ? "border-red-500"
              : "border-border";

    const messageClass =
        submitStatus === "success"
            ? "text-green-700"
            : submitStatus === "error"
              ? "text-red-700"
              : "text-muted-foreground";

    const onSubmit = (values: ProfileFormValues) => {
        setSubmitStatus("submitting");
        setMessage("Saving...");

        mutation.mutate(
            { ...values },
            {
                onError: (err: any) => {
                    setSubmitStatus("error");
                    setMessage(err?.message ?? "Profile update failed.");
                },
                onSuccess: () => {
                    setSubmitStatus("success");
                    setMessage("Profile updated successfully.");
                },
            },
        );
    };

    if (!user) return null;

    return (
        <div className="p-4">
            <div className={`mx-auto max-w-xl rounded-2xl border-2 ${borderClass} bg-white p-6`}>
                {message ? <div className={`mb-4 text-sm ${messageClass}`}>{message}</div> : null}

                <div className="mb-6 flex items-center space-x-4">
                    <Avatar className="h-12 w-12 rounded-md">
                        <AvatarImage
                            src={user.avatar}
                            alt={user.display_name}
                            className="object-cover"
                        />
                    </Avatar>
                    <div className="text-lg font-medium">{user.display_name}</div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="display_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold">
                                        Display Name
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} className="mt-1" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold">
                                        Your Bio
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            className="mt-1 max-h-40 resize-none overflow-y-auto"
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <ImageField name="avatar" />

                        <div className="border-t pt-2">
                            <Button
                                type="submit"
                                disabled={submitStatus === "submitting"}
                                className="w-full"
                            >
                                {submitStatus === "submitting" ? "Sending…" : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
