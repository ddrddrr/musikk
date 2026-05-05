import { setFormServerErrors } from "@/api/errorUtils.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { useCreateChat } from "@/features/publications/api/mutations.ts";
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
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import { cn } from "@/lib/utils.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const chatNewGroupFormSchema = z.object({
    title: z.string().min(1, "Chat title is required").max(100, "Title too long"),
    participants: z.array(z.string()).min(1, "Select at least one friend"),
});

type ChatNewGroupFormData = z.infer<typeof chatNewGroupFormSchema>;

interface ChatNewGroupFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ChatNewGroupForm({ onSuccess, onCancel }: ChatNewGroupFormProps) {
    const userUUID = useUserUUID();
    const { friends } = useContext(UserConnectionsContext);
    const createChatMutation = useCreateChat();

    const form = useForm<ChatNewGroupFormData>({
        resolver: zodResolver(chatNewGroupFormSchema),
        defaultValues: {
            title: "",
            participants: [],
        },
    });

    const selectedParticipants = form.watch("participants");
    const serverErrorMessage = form.formState.errors.root?.serverError?.message;

    const toggleParticipant = (friendUUID: string) => {
        const current = selectedParticipants;
        const next = current.includes(friendUUID)
            ? current.filter((uuid) => uuid !== friendUUID)
            : [...current, friendUUID];
        form.setValue("participants", next);
    };

    const onSubmit = (data: ChatNewGroupFormData) => {
        if (!userUUID) return;

        createChatMutation.mutate(
            {
                userUUID,
                participants: data.participants,
                isDirect: false,
                title: data.title,
            },
            {
                onSuccess: () => {
                    form.reset();
                    onSuccess?.();
                },
                onError: (error) => {
                    setFormServerErrors(form, error);
                },
            },
        );
    };

    if (!friends || friends.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4">
                <EmptyState message="No friends to create a group with yet" />
                {onCancel && (
                    <Button variant="brand" size="lg" onClick={onCancel}>
                        Back
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="mb-4 text-xl font-bold">Create Group Chat</h2>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormField
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Chat Title</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter chat title..." />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        name="participants"
                        render={() => (
                            <FormItem>
                                <FormLabel>
                                    Select Friends ({selectedParticipants.length} selected)
                                </FormLabel>
                                <FormControl>
                                    <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto rounded-sm border-2 border-foreground bg-card p-2">
                                        {friends.map((friend) => (
                                            <Button
                                                key={friend.uuid}
                                                type="button"
                                                variant="ghost"
                                                onClick={() => void toggleParticipant(friend.uuid)}
                                                className="h-auto w-full justify-start rounded-sm border-2 border-foreground bg-card p-2 text-left text-foreground hover:bg-muted"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={cn(
                                                            "size-5 rounded-sm border-2 border-foreground",
                                                            selectedParticipants.includes(
                                                                friend.uuid,
                                                            )
                                                                ? "bg-foreground"
                                                                : "bg-card",
                                                        )}
                                                    />
                                                    <UserAvatar
                                                        src={friend.avatar}
                                                        alt={friend.display_name}
                                                        size="sm"
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {friend.display_name}
                                                    </span>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {serverErrorMessage && (
                        <p className="text-sm text-destructive">{serverErrorMessage}</p>
                    )}

                    <div className="flex gap-2">
                        {onCancel && (
                            <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            variant="brand"
                            size="lg"
                            disabled={createChatMutation.isPending}
                            className="flex-1"
                        >
                            {createChatMutation.isPending ? "Creating..." : "Create Group Chat"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
