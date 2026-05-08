import { UserIdentifier } from "@/features/user/components/UserIdentifier.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { formatDateTime } from "@/utils/formatDate.ts";

type PostHeaderProps = {
    author: BaseUser;
    dateAdded: string;
};

export function PostHeader({ author, dateAdded }: PostHeaderProps) {
    return (
        <div className="-ml-2 flex items-center gap-2">
            <UserIdentifier user={author} />
            <div className="text-xs text-muted-foreground">{formatDateTime(dateAdded)}</div>
        </div>
    );
}
