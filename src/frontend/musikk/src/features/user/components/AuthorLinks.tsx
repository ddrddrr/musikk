import { cn } from "@/lib/utils.ts";
import { BaseUser } from "@/features/user/types.ts";
import { useNavigate } from "react-router-dom";

type AuthorLinksProps = {
    authors: BaseUser[];
    className?: string;
};

export function AuthorLinks({ authors, className }: AuthorLinksProps) {
    const navigate = useNavigate();

    return (
        <span className={cn("truncate", className)}>
            {authors.map((author, index) => (
                <span key={author.uuid}>
                    <span
                        role="link"
                        className="cursor-pointer hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                            void navigate(`/users/${author.uuid}`);
                        }}
                    >
                        {author.display_name}
                    </span>
                    {index < authors.length - 1 && ", "}
                </span>
            ))}
        </span>
    );
}
