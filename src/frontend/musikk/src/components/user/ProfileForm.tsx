import { ImageField } from "@/components/common/ImageField.tsx";
import { Avatar, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useUserUpdateMutation } from "@/components/user/mutations.tsx";
import { ProfileFormSchema, ProfileFormValues } from "@/components/user/types.ts";
import { UserContext } from "@/providers/userContext.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";

export function ProfileForm() {
    const { user } = useContext(UserContext);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            avatar: undefined,
            display_name: user?.display_name,
            bio: user?.bio,
        },
    });
    const userUpdateMutation = useUserUpdateMutation();

    const onSubmit = (values: ProfileFormValues) => {
        setErrorMessage(null);
        userUpdateMutation.mutate(
            { ...values, userUUID: user?.uuid },
            {
                onError: (error: any) => {
                    setErrorMessage(error?.message ?? "An unexpected error occurred");
                },
            },
        );
    };
    if (!user) return null;

    return (
        <>
            <Avatar className="rounded-sm w-10 h-10">
                <AvatarImage src={user?.avatar} alt={user?.display_name} className="object-cover" />
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
                                    <Input {...field} defaultValue={user?.display_name} />
                                </FormControl>
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
                                    <Textarea {...field} defaultValue={user.bio} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <ImageField name="avatar" />

                    <div className="mt-4">
                        <Button type="submit">Send</Button>
                    </div>

                    {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
                </form>
            </Form>
        </>
    );
}
