import { cva } from "class-variance-authority";

export type CardSize = "sm" | "md" | "lg";

export const cardTitleVariants = cva("truncate font-bold", {
    variants: {
        size: {
            sm: "text-sm",
            md: "text-base",
            lg: "text-xl",
        },
    },
    defaultVariants: { size: "md" },
});

export const cardSubtitleVariants = cva("truncate text-muted-foreground", {
    variants: {
        size: {
            sm: "text-xs",
            md: "text-sm",
            lg: "text-base",
        },
    },
    defaultVariants: { size: "md" },
});

export const cardPaddingVariants = cva("border-t-2 border-foreground bg-muted", {
    variants: {
        size: {
            sm: "p-1",
            md: "p-2",
            lg: "p-3",
        },
    },
    defaultVariants: { size: "md" },
});
