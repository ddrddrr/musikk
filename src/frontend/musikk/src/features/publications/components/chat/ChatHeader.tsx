import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useChatImage } from "@/features/publications/hooks/useChatImage.ts";
import { Chat } from "@/features/publications/types.ts";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/ui/popover.tsx";
import { ScrollArea } from "@/features/ui/scroll-area.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/ui/tabs.tsx";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";

interface ChatHeaderProps {
    chat: Chat;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
    const currentUserUUID = useUserUUID();
    const otherMember = chat.is_direct
        ? chat.members.find((m) => m.uuid !== currentUserUUID)
        : undefined;
    const { chatImg, chatImgAlt } = useChatImage(chat);

    return (
        <div className="flex gap-x-4 border-b-2 border-foreground bg-muted p-4">
            <Popover>
                <PopoverTrigger asChild>
                    <div className="flex cursor-pointer items-center gap-3">
                        <UserAvatar src={chatImg} alt={chatImgAlt} size="sm" />
                    </div>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-64">
                    <Tabs defaultValue={chat.is_direct ? "info" : "members"}>
                        <TabsList className="w-full">
                            {chat.is_direct ? (
                                <TabsTrigger value="info">Info</TabsTrigger>
                            ) : (
                                <TabsTrigger value="members">Members</TabsTrigger>
                            )}
                            <TabsTrigger value="attachments">Attachments</TabsTrigger>
                        </TabsList>

                        {chat.is_direct && otherMember && (
                            <TabsContent value="info">
                                <div className="flex flex-col items-center gap-2 py-2">
                                    <UserAvatar
                                        src={otherMember.avatar}
                                        alt={otherMember.display_name}
                                        size="md"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">
                                            {otherMember.display_name}
                                        </span>
                                        {/*TODO: mb render differently*/}
                                        {otherMember.is_artist && (
                                            <span className="rounded-sm bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">
                                                Artist
                                            </span>
                                        )}
                                    </div>
                                    {otherMember.bio && (
                                        <p className="text-center text-sm text-muted-foreground">
                                            {otherMember.bio}
                                        </p>
                                    )}
                                </div>
                            </TabsContent>
                        )}

                        {!chat.is_direct && (
                            <TabsContent value="members">
                                {/*TODO: should scroll area be used more in general? eg in search/songs for collection etc
                                should this border variant be moved there?*/}
                                <div className={"rounded-sm border border-foreground"}>
                                    <ScrollArea className="max-h-48">
                                        <div className="flex flex-col gap-2 py-2">
                                            {chat.members.map((member) => (
                                                <UserIdentifier key={member.uuid} user={member} />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </TabsContent>
                        )}

                        {/*TODO: remove that placeholder when proper logic is added*/}
                        <TabsContent value="attachments">
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                No attachments yet
                            </p>
                        </TabsContent>
                    </Tabs>
                </PopoverContent>
            </Popover>
            <div>
                <h2 className="text-lg font-bold">{chat.title}</h2>
            </div>
        </div>
    );
}
