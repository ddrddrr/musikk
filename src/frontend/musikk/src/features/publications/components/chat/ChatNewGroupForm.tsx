import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
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

    const toggleParticipant = (friendUUID: string) => {
        const current = selectedParticipants;
        const next = current.includes(friendUUID)
            ? current.filter((uuid) => uuid !== friendUUID)
            : [...current, friendUUID];
        form.setValue("participants", next);
    };
    // TODO: participants not passed correctly?
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
                    console.error("Failed to create group chat:", error);
                },
            },
        );
    };

    if (!friends || friends.length === 0) {
        return (
            <div className="rounded-sm border-2 border-black bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-600">
                    Group chats can be created only with friends...
                </p>
                {onCancel && (
                    <Button variant="brand" size="lg" onClick={onCancel} className="mt-4">
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                    <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-sm border-2 border-black bg-white p-2">
                                        {friends.map((friend) => (
                                            // TODO button
                                            <button
                                                key={friend.uuid}
                                                type="button"
                                                onClick={() => void toggleParticipant(friend.uuid)}
                                                className={cn(
                                                    "w-full rounded-sm border-2 border-black bg-white p-2 text-left transition-colors hover:bg-gray-50",
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={cn(
                                                            "h-5 w-5 rounded-sm border-2 border-black",
                                                            selectedParticipants.includes(
                                                                friend.uuid,
                                                            )
                                                                ? "bg-black"
                                                                : "bg-white",
                                                        )}
                                                    />
                                                    {/*TODO: use the common avatar component*/}
                                                    {friend.avatar && (
                                                        <img
                                                            src={friend.avatar}
                                                            alt={friend.display_name}
                                                            className="h-8 w-8 rounded-sm border-2 border-black object-cover"
                                                        />
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {friend.display_name}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
