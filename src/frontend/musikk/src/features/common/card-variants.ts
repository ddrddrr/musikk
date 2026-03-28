import { cva } from "class-variance-authority";

export type CardSize = "small" | "medium" | "big";

export const cardTitleVariants = cva("truncate font-bold", {
    variants: {
        size: {
            small: "text-sm",
            medium: "text-base",
            big: "text-xl",
        },
    },
    defaultVariants: { size: "medium" },
});

export const cardSubtitleVariants = cva("truncate text-gray-600", {
    variants: {
        size: {
            small: "text-xs",
            medium: "text-sm",
            big: "text-base",
        },
    },
    defaultVariants: { size: "medium" },
});

export const cardPaddingVariants = cva("border-t-2 border-black bg-gray-200", {
    variants: {
        size: {
            small: "p-1",
            medium: "p-2",
            big: "p-3",
        },
    },
    defaultVariants: { size: "medium" },
});
