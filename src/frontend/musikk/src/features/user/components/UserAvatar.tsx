import { Avatar, AvatarImage } from "@/features/ui/avatar.tsx";
import { cn } from "@/lib/utils.ts";
import { Smile } from "lucide-react";

type UserAvatarProps = {
    src?: string | null;
    alt?: string;
    size?: "sm" | "md" | "lg";
};

export function UserAvatar({ src, alt, size = "md" }: UserAvatarProps) {
    const sizeClass = {
        sm: "size-8",
        md: "size-16",
        lg: "size-24",
    }[size];

    if (src) {
        return (
            <Avatar className={sizeClass}>
                <AvatarImage src={src} alt={alt} className="object-cover" />
            </Avatar>
        );
    }

    return (
        <div className={cn("flex items-center justify-center rounded-full bg-muted", sizeClass)}>
            <Smile className="h-2/3 w-2/3 text-muted-foreground" />
        </div>
    );
}
