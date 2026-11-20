import { OverflowTooltip } from "@/features/ui/tooltip.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { cn } from "@/lib/utils.ts";
import { Link } from "react-router-dom";

type AuthorLinksProps = {
    authors: BaseUser[];
    className?: string;
};

export function AuthorLinks({ authors, className }: AuthorLinksProps) {
    const allNames = authors.map((author) => author.display_name).join(", ");

    return (
        <OverflowTooltip label={allNames}>
            <span className={cn("block truncate", className)}>
                {authors.map((author, index) => (
                    <span key={author.uuid}>
                        <Link
                            to={`/users/${author.uuid}`}
                            className="relative z-10 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {author.display_name}
                        </Link>
                        {index < authors.length - 1 && ", "}
                    </span>
                ))}
            </span>
        </OverflowTooltip>
    );
}
