import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type MediaThumbnailProps = {
    src?: string;
    alt?: string;
    fallback?: ReactNode;
    className?: string;
};

const baseClass =
    "flex items-center justify-center bg-gray-200 rounded-sm border border-black overflow-hidden";

export function MediaThumbnail({ src, alt = "", fallback, className }: MediaThumbnailProps) {
    if (src) {
        return (
            <div className={cn(baseClass, className)}>
                <img src={src} alt={alt} className="h-full w-full object-cover" />
            </div>
        );
    }

    return (
        <div className={cn(baseClass, className)}>
            {fallback ?? <span className="text-2xl text-gray-400">&#9835;</span>}
        </div>
    );
}
