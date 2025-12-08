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
import { useUserUpdateMutation } from "@/modules/user/mutations.tsx";
import { ProfileFormSchema, ProfileFormValues } from "@/modules/user/types.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function ProfileForm() {
    const { user } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            avatar: undefined,
            display_name: user?.display_name,
            bio: user?.bio,
        },
    });

    const mutation = useUserUpdateMutation();

    const onSubmit = (values: ProfileFormValues) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        mutation.mutate(
            { ...values, userUUID: user!.uuid },
            {
                onError: (err: any) => {
                    setErrorMessage(err?.message ?? "An unexpected error occurred");
                },
                onSuccess: () => {
                    setSuccessMessage("Profile updated successfully");
                },
            },
        );
    };

    if (!user) return null;

    return (
        <div className="max-w-xl mx-auto space-y-6 bg-white p-6 rounded-2xl">
            <div className="flex items-center space-x-4">
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
                                <FormLabel className="text-sm font-semibold">Your Bio</FormLabel>
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

                    <div className="pt-2">
                        <Button type="submit" disabled={mutation.isPending} className="w-full">
                            {mutation.isPending ? "Sending…" : "Save Changes"}
                        </Button>
                    </div>

                    {errorMessage && (
                        <p className="mt-2 text-sm text-red-600 text-center">{errorMessage}</p>
                    )}
                    {successMessage && (
                        <p className="mt-2 text-sm text-green-600 text-center">{successMessage}</p>
                    )}
                </form>
            </Form>
        </div>
    );
}
