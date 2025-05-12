import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useFriendRequestMutation } from "@/components/user/mutations.tsx";
import { IUser } from "@/components/user/types.ts";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserCardProps {
    user: IUser;
    onClick?: (u: IUser) => void;
}

export function UserCard({ user, onClick = undefined }: UserCardProps) {
    const navigate = useNavigate();
    const friendRequestMutation = useFriendRequestMutation();

    const { avatar, display_name } = user;
    const truncatedName = display_name.length > 10 ? display_name.slice(0, 10) + "…" : display_name;

    if (friendRequestMutation.isSuccess) {
        toast("Friend request sent.");
    }

    function handleOnClick(u: IUser) {
        if (onClick) {
            onClick(u);
        } else {
            navigate(`/users/${u.uuid}`);
        }
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Card onClick={() => handleOnClick(user)} className="w-fit p-2 flex items-center gap-2">
                    <Avatar className="rounded-sm w-10 h-10">
                        <AvatarImage src={avatar} alt={display_name} className="object-cover" />
                    </Avatar>
                    <span className="text-sm font-medium">{truncatedName}</span>
                </Card>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48 bg-white rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1">
                <ContextMenuItem
                    className="flex items-center px-3 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
                    onSelect={() => friendRequestMutation.mutate(user.uuid)}
                >
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Send friend request
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
