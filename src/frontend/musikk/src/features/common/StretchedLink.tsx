import { OverflowTooltip } from "@/features/ui/tooltip.tsx";
import { cn } from "@/lib/utils.ts";
import { Link } from "react-router-dom";

type StretchedLinkProps = {
    className?: string;
    children: string;
} & ({ to: string; onClick?: () => void } | { to?: undefined; onClick: () => void });

const STRETCHED_CLASS = "after:absolute after:inset-0";

/**
 * Makes the whole card or row clickable without wrapping it in a link, since a link inside a link (the author
 * links) is invalid HTML. The card needs `relative`, nested links need `relative z-10`.
 * The button needs `block w-full`, otherwise it grows with the text and never truncates the label.
 */
export function StretchedLink({ to, onClick, className, children }: StretchedLinkProps) {
    const label = (
        <OverflowTooltip label={children}>
            <span className="relative z-10 block truncate">{children}</span>
        </OverflowTooltip>
    );

    if (to !== undefined && !onClick) {
        return (
            <Link to={to} className={cn(STRETCHED_CLASS, className)}>
                {label}
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(STRETCHED_CLASS, "block w-full cursor-pointer text-left", className)}
        >
            {label}
        </button>
    );
}
