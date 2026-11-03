import { getErrorDetail } from "@/api/errorUtils.ts";
import { useAuth } from "@/features/auth/hooks/useAuth.ts";
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
import { useMeUpdateMutation } from "@/features/user/api/mutations.ts";
import { ProfileFormSchema, ProfileFormValues } from "@/features/user/types.ts";
import { cn } from "@/lib/utils.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { MutationStatus } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

const BORDER_CLASS_BY_STATUS: Record<MutationStatus, string> = {
    idle: "border-border",
    pending: "border-border",
    success: "border-success",
    error: "border-destructive",
};

const MESSAGE_CLASS_BY_STATUS: Record<MutationStatus, string> = {
    idle: "text-muted-foreground",
    pending: "text-muted-foreground",
    success: "text-foreground",
    error: "text-destructive",
};

function statusMessage(status: MutationStatus, error: Error | null): string | null {
    switch (status) {
        case "idle":
            return null;
        case "pending":
            return "Saving...";
        case "success":
            return "Profile updated successfully";
        case "error":
            return getErrorDetail(error, "Profile update failed");
    }
}

export function ProfileForm() {
    const { user } = useAuth();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            avatar: undefined,
            display_name: user?.display_name,
            bio: user?.bio,
        },
    });

    const mutation = useMeUpdateMutation();
    const message = statusMessage(mutation.status, mutation.error);

    const onSubmit = (values: ProfileFormValues) => {
        mutation.mutate(values);
    };

    if (!user) return null;

    return (
        <div className="p-4">
            <div
                className={cn(
                    "mx-auto max-w-xl rounded-sm border-2 bg-card p-6",
                    BORDER_CLASS_BY_STATUS[mutation.status],
                )}
            >
                {message && (
                    <div className={cn("mb-4 text-sm", MESSAGE_CLASS_BY_STATUS[mutation.status])}>
                        {message}
                    </div>
                )}

                <div className="mb-6 flex items-center gap-4">
                    <Avatar className="size-12 rounded-sm">
                        <AvatarImage
                            src={user.avatar ?? undefined}
                            alt={user.display_name}
                            className="object-cover"
                        />
                    </Avatar>
                    <div className="text-lg font-medium">{user.display_name}</div>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
                        className="flex flex-col gap-5"
                    >
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
                            <Button type="submit" disabled={mutation.isPending} className="w-full">
                                {mutation.isPending ? "Sending…" : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
