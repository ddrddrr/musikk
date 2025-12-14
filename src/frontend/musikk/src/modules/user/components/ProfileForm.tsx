import { useAuth } from "@/hooks/useAuth.ts";
import { ImageField } from "@/modules/common/ImageField.tsx";
import { Avatar, AvatarImage } from "@/modules/ui/avatar.tsx";
import { Button } from "@/modules/ui/button.tsx";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/modules/ui/form.tsx";
import { Input } from "@/modules/ui/input.tsx";
import { Textarea } from "@/modules/ui/textarea.tsx";
import { useMeUpdateMutation } from "@/modules/user/mutations.tsx";
import { ProfileFormSchema, ProfileFormValues } from "@/modules/user/types.ts";
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
            <div className={`max-w-xl mx-auto rounded-2xl border-2 ${borderClass} bg-white p-6`}>
                {message ? <div className={`text-sm mb-4 ${messageClass}`}>{message}</div> : null}

                <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="rounded-md w-12 h-12">
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
                                            className="mt-1 resize-none max-h-40 overflow-y-auto"
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <ImageField name="avatar" />

                        <div className="pt-2 border-t">
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
