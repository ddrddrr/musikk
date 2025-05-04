import { ImageField } from "@/components/common/ImageField";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserUpdateMutation } from "@/components/user/mutations";
import { ProfileFormSchema, ProfileFormValues } from "@/components/user/types";
import { UserContext } from "@/providers/userContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";

export function ProfileForm() {
    const { user } = useContext(UserContext);
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
        <>
            <Avatar className="rounded-sm w-10 h-10">
                <AvatarImage src={user.avatar} alt={user.display_name} className="object-cover" />
            </Avatar>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                        control={form.control}
                        name="display_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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
                                <FormLabel>Your Bio</FormLabel>
                                <FormControl>
                                    <Textarea {...field} className="resize-none max-h-40 overflow-y-auto" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <ImageField name="avatar" />

                    <div className="mt-4">
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Sending…" : "Send"}
                        </Button>
                    </div>

                    {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
                    {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
                </form>
            </Form>
        </>
    );
}
