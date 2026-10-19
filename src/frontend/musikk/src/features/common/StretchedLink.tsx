import { cn } from "@/lib/utils.ts";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

type StretchedLinkProps = {
    className?: string;
    children: ReactNode;
} & ({ to: string; onClick?: () => void } | { to?: undefined; onClick: () => void });

const STRETCHED_CLASS = "after:absolute after:inset-0";

/**
 * Makes the whole card or row clickable without wrapping it in a link. A link around the card would contain
 * the author links, and a link inside a link is invalid HTML. The pseudo-element covers the nearest
 * positioned ancestor, so that ancestor needs `relative`, and the nested links need `relative z-10` to stay
 * clickable. It renders a button when it gets `onClick`, for example in the search select mode.
 */
export function StretchedLink({ to, onClick, className, children }: StretchedLinkProps) {
    if (to !== undefined && !onClick) {
        return (
            <Link to={to} className={cn(STRETCHED_CLASS, className)}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(STRETCHED_CLASS, "cursor-pointer text-left", className)}
        >
            {children}
        </button>
    );
}
