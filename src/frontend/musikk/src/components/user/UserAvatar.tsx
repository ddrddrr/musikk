import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Smile } from "lucide-react";

type UserAvatarProps = {
    src?: string | null;
    alt?: string;
    size?: "sm" | "md" | "lg";
};

export function UserAvatar({ src, alt, size = "md" }: UserAvatarProps) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-16 h-16",
        lg: "w-24 h-24",
    }[size];

    console.log(src)
    if (src) {
        return (
            <Avatar className={sizeClasses}>
                <AvatarImage src={src} alt={alt} className="object-cover" />
            </Avatar>
        );
    }

    return (
        <div className={`flex items-center justify-center ${sizeClasses} rounded-full bg-muted`}>
            <Smile className="w-2/3 h-2/3 text-muted-foreground" />
        </div>
    );
}
