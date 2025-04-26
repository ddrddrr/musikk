import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { IUser } from "@/components/user/types.ts";

interface UserCardProps {
    user: IUser;
}

export function UserCard({ user }: UserCardProps) {
    const { avatar, display_name, first_name, last_name } = user;

    const truncatedName = display_name.length > 10 ? display_name.slice(0, 10) + "…" : display_name;

    return (
        <Card className="w-fit p-2 flex items-center gap-2">
            <Avatar className="rounded-md w-10 h-10">
                <AvatarImage src={avatar} alt={display_name} className="object-cover" />
                <AvatarFallback className="rounded-md">
                    {first_name[0]}
                    {last_name[0]}
                </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{truncatedName}</span>
        </Card>
    );
}
