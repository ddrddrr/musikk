import { OverflowTooltip } from "@/features/ui/tooltip.tsx";
import { cn } from "@/lib/utils.ts";
import { Link } from "react-router-dom";

type StretchedLinkProps = {
    className?: string;
    children: string;
} & ({ to: string; onClick?: () => void } | { to?: undefined; onClick: () => void });

const STRETCHED_CLASS = "after:absolute after:inset-0";

/**
 * Makes the whole card or row clickable without wrapping it in a link. A link around the card would contain
 * the author links, and a link inside a link is invalid HTML. The pseudo-element covers the nearest
 * positioned ancestor, so that ancestor needs `relative`, and the nested links need `relative z-10` to stay
 * clickable. It renders a button when it gets `onClick`, for example in the search select mode.
 *
 * A long label is cut off, and hovering it shows the full label. The label also sits above the
 * pseudo-element, so hovering other parts of the card does not open that tooltip. The button needs
 * `block w-full`, because a button grows to fit its text and would never cut the label.
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
