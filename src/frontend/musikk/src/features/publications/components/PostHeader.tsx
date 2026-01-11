import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";
import { BaseUser } from "@/features/user/types.ts";

type PostHeaderProps = {
    author: BaseUser;
    dateAdded: string;
};

export function PostHeader({ author, dateAdded }: PostHeaderProps) {
    return (
        <div className="flex items-center gap-2">
            <UserIdentifier user={author} />
            <div className="text-[10px] text-muted-foreground">
                {new Date(dateAdded).toLocaleString("en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                })}
            </div>
        </div>
    );
}